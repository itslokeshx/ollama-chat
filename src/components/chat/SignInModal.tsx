import { useState, useEffect } from 'react';
import { X, Terminal, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import type { AuthState } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCheckAuth: () => Promise<void>;
  authState: AuthState;
}

export function SignInModal({ open, onClose, onCheckAuth, authState }: Props) {
  const [activeTab, setActiveTab] = useState<'cli' | 'manual'>('cli');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Close modal when auth succeeds
  useEffect(() => {
    if (open && authState.status === 'signed-in') {
      onClose();
    }
  }, [authState.status, open, onClose]);

  if (!open) return null;

  const handleCheckAgain = async () => {
    setChecking(true);
    await onCheckAuth();
    setChecking(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm signin-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="signin-modal"
    >
      <div className="signin-modal-content relative w-full max-w-[440px] mx-4 bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Sign in to Ollama</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Required to use cloud models</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-close-signin"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('cli')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === 'cli'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Terminal size={14} />
              Sign in via CLI
            </span>
            {activeTab === 'cli' && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === 'manual'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <ExternalLink size={14} />
              Create Account
            </span>
            {activeTab === 'manual' && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {activeTab === 'cli' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Run this command in your terminal to sign in:
              </p>
              <div className="bg-muted rounded-xl p-4 font-mono text-sm text-foreground border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-500">$</span>
                  <span className="font-semibold">ollama signin</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Follow the prompts to authenticate with your Ollama account.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                After signing in via the terminal, click the button below to verify your authentication.
              </p>
              <button
                onClick={handleCheckAgain}
                disabled={checking}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                data-testid="button-check-auth"
              >
                {checking ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Check authentication
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create an Ollama account to access cloud models. After creating your account, use the CLI tab to sign in.
              </p>
              <a
                href="https://ollama.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                data-testid="link-create-account"
              >
                <ExternalLink size={15} />
                Create account on ollama.com
              </a>
              <div className="text-xs text-muted-foreground text-center">
                Already have an account? Switch to the{' '}
                <button
                  onClick={() => setActiveTab('cli')}
                  className="text-primary hover:underline"
                >
                  CLI sign-in
                </button>{' '}
                tab.
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Authentication is polled every 30 seconds. Cloud models require a signed-in Ollama instance.
          </p>
        </div>
      </div>
    </div>
  );
}
