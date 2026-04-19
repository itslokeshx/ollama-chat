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
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAuth = useCallback(async () => {
    try {
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
      // If endpoint doesn't exist (404) or connection fails, treat as signed out
      const newState: AuthState = { status: 'signed-out' };
      setAuthState(newState);
      saveAuthState(newState);
    }
  }, [ollamaHost]);

  const signOut = useCallback(async () => {
    await apiSignOut(ollamaHost);
    const newState: AuthState = { status: 'signed-out' };
    setAuthState(newState);
    saveAuthState(newState);
  }, [ollamaHost]);

  // Check auth on mount and start polling
  useEffect(() => {
    checkAuth();

    pollTimerRef.current = setInterval(checkAuth, POLL_INTERVAL);
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [checkAuth]);

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
