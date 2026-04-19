import { useState, useEffect, useCallback, useRef } from 'react';
import type { AuthState } from '@/lib/types';
import { fetchWhoAmI, signOut as apiSignOut } from '@/lib/ollama';

const AUTH_STORAGE_KEY = 'ollama-chat-auth';
const POLL_INTERVAL = 30_000; // 30 seconds

function loadAuthState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...parsed, status: 'checking' };
    }
  } catch { }
  return { status: 'checking' };
}

function saveAuthState(state: AuthState): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

export function useAuthStore(ollamaHost: string) {
  const [authState, setAuthState] = useState<AuthState>(loadAuthState);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAuth = useCallback(async () => {
    if (!isSupported) return;
    try {
      const res = await window.fetch(`${ollamaHost}/api/whoami`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (res.status === 404) {
        setIsSupported(false); // Stop polling whoami
        
        // Fallback: check if they have cloud models exposed in tags
        const tagsRes = await window.fetch(`${ollamaHost}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(5000) });
        if (tagsRes.ok) {
          const data = await tagsRes.json();
          const hasCloud = data.models?.some((m: any) => m.name.includes(':cloud') || m.remote_host);
          if (hasCloud) {
            const newState: AuthState = { status: 'signed-in', username: 'Cloud User' };
            setAuthState(newState);
            saveAuthState(newState);
            return;
          }
        }
        
        const newState: AuthState = { status: 'signed-out' };
        setAuthState(newState);
        saveAuthState(newState);
        return;
      }
      
      const user = await fetchWhoAmI(ollamaHost);
      if (user && (user.username || user.email)) {
        const newState: AuthState = {
          status: 'signed-in',
          username: user.username,
          email: user.email,
        };
        setAuthState(newState);
        saveAuthState(newState);
      } else {
        const newState: AuthState = { status: 'signed-out' };
        setAuthState(newState);
        saveAuthState(newState);
      }
    } catch {
      // Network error, keep polling
      const newState: AuthState = { status: 'signed-out' };
      setAuthState(newState);
      saveAuthState(newState);
    }
  }, [ollamaHost, isSupported]);

  const signOut = useCallback(async () => {
    await apiSignOut(ollamaHost);
    const newState: AuthState = { status: 'signed-out' };
    setAuthState(newState);
    saveAuthState(newState);
  }, [ollamaHost]);

  // Check auth on mount and start polling
  useEffect(() => {
    checkAuth();
    if (isSupported) {
      pollTimerRef.current = setInterval(checkAuth, POLL_INTERVAL);
    }
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [checkAuth, isSupported]);

  /**
   * Determine API configuration based on model and auth state.
   * Cloud models route through local Ollama (which proxies when authenticated).
   */
  const getApiConfig = useCallback(
    (modelName: string) => {
      const _isCloud = modelName.includes(':cloud') || modelName.includes('-cloud');
      // Always route through local Ollama — it handles cloud proxy when signed in
      return {
        host: ollamaHost,
        headers: {} as Record<string, string>,
        isCloud: _isCloud,
      };
    },
    [ollamaHost]
  );

  return {
    authState,
    checkAuth,
    signOut,
    getApiConfig,
    isSignedIn: authState.status === 'signed-in',
    isChecking: authState.status === 'checking',
  };
}
