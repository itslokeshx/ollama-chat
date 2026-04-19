import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, Cloud, User } from 'lucide-react';
import type { AuthState } from '@/lib/types';

interface Props {
  authState: AuthState;
  onSignIn: () => void;
  onSignOut: () => void;
}

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
];

function hashToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(username?: string, email?: string): string {
  const name = username || email || '?';
  const parts = name.split(/[@._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AccountWidget({ authState, onSignIn, onSignOut }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (authState.status === 'checking') {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          <div className="h-2.5 w-16 bg-muted rounded animate-pulse mt-1" />
        </div>
      </div>
    );
  }

  if (authState.status === 'signed-out') {
    return (
      <button
        onClick={onSignIn}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-sidebar-accent transition-colors group"
        data-testid="button-sign-in"
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
          <User size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-xs font-medium text-foreground">Sign in to Ollama</div>
          <div className="text-xs text-muted-foreground">Access cloud models</div>
        </div>
      </button>
    );
  }

  // Signed in
  const initials = getInitials(authState.username, authState.email);
  const avatarColor = hashToColor(authState.username || authState.email || 'user');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-sidebar-accent transition-colors"
        data-testid="button-account"
      >
        <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center shrink-0 text-white text-xs font-semibold`}>
          {initials}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-foreground truncate">
              {authState.username || 'User'}
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px] font-medium">
              <Cloud size={9} />
              Cloud
            </span>
          </div>
          {authState.email && (
            <div className="text-xs text-muted-foreground truncate">{authState.email}</div>
          )}
        </div>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-popover-border rounded-xl shadow-lg py-1 z-50">
          <button
            onClick={() => {
              setDropdownOpen(false);
              onSignOut();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
            data-testid="button-sign-out"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
