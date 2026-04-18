import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { Settings } from '@/lib/types';
import { testConnection } from '@/lib/ollama';

interface Props {
  open: boolean;
  settings: Settings;
  onClose: () => void;
  onSave: (updates: Partial<Settings>) => void;
  onExportAll: () => void;
  onClearAll: () => void;
}

export function SettingsModal({ open, settings, onClose, onSave, onExportAll, onClearAll }: Props) {
  const [draft, setDraft] = useState(settings);
  const [connStatus, setConnStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [clearConfirm, setClearConfirm] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const update = <K extends keyof Settings>(key: K, val: Settings[K]) => {
    const next = { ...draft, [key]: val };
    setDraft(next);
    onSave({ [key]: val });
  };

  const handleTestConnection = async () => {
    setConnStatus('testing');
    const ok = await testConnection(draft.ollamaHost);
    setConnStatus(ok ? 'ok' : 'fail');
  };

  const handleClearAll = () => {
    if (clearConfirm) {
      onClearAll();
      setClearConfirm(false);
      onClose();
    } else {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="settings-modal"
    >
      <div className="relative w-full max-w-[520px] mx-4 bg-card border border-card-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-card border-b border-border rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-close-settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Connection</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Ollama Host URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draft.ollamaHost}
                    onChange={(e) => setDraft({ ...draft, ollamaHost: e.target.value })}
                    onBlur={() => onSave({ ollamaHost: draft.ollamaHost })}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="http://localhost:11434"
                    data-testid="input-ollama-host"
                  />
                  <button
                    onClick={handleTestConnection}
                    disabled={connStatus === 'testing'}
                    className="px-3 py-2 text-sm rounded-lg bg-muted border border-border hover:bg-accent text-foreground transition-colors disabled:opacity-60 flex items-center gap-1.5"
                    data-testid="button-test-connection"
                  >
                    {connStatus === 'testing' && <Loader2 size={14} className="animate-spin" />}
                    {connStatus === 'ok' && <CheckCircle size={14} className="text-green-500" />}
                    {connStatus === 'fail' && <XCircle size={14} className="text-destructive" />}
                    {connStatus === 'idle' && 'Test'}
                    {connStatus === 'testing' && 'Testing'}
                    {connStatus === 'ok' && 'Connected'}
                    {connStatus === 'fail' && 'Failed'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Generation</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">Temperature</label>
                  <span className="text-sm text-muted-foreground">{draft.temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range" min="0" max="2" step="0.1"
                  value={draft.temperature}
                  onChange={(e) => update('temperature', parseFloat(e.target.value))}
                  className="w-full accent-primary"
                  data-testid="slider-temperature"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Precise</span><span>Balanced</span><span>Creative</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">Top P</label>
                  <span className="text-sm text-muted-foreground">{draft.topP.toFixed(2)}</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={draft.topP}
                  onChange={(e) => update('topP', parseFloat(e.target.value))}
                  className="w-full accent-primary"
                  data-testid="slider-top-p"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Top K</label>
                  <input
                    type="number" min="1" max="200"
                    value={draft.topK}
                    onChange={(e) => update('topK', parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    data-testid="input-top-k"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Max tokens</label>
                  <input
                    type="number" min="1" max="32768"
                    value={draft.maxTokens}
                    onChange={(e) => update('maxTokens', parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    data-testid="input-max-tokens"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Keep alive</label>
                <select
                  value={draft.keepAlive}
                  onChange={(e) => update('keepAlive', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="select-keep-alive"
                >
                  <option value="5m">5 minutes</option>
                  <option value="30m">30 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="-1">Forever</option>
                </select>
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Interface</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Theme</label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => update('theme', t)}
                      className={`flex-1 py-1.5 text-sm transition-colors capitalize ${draft.theme === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                      data-testid={`button-theme-${t}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Font size</label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {(['sm', 'md', 'lg'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => update('fontSize', s)}
                      className={`flex-1 py-1.5 text-sm transition-colors ${draft.fontSize === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                      data-testid={`button-font-${s}`}
                    >
                      {s === 'sm' ? 'Small' : s === 'md' ? 'Medium' : 'Large'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Send on Enter</span>
                <button
                  role="switch"
                  aria-checked={draft.sendOnEnter}
                  onClick={() => update('sendOnEnter', !draft.sendOnEnter)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${draft.sendOnEnter ? 'bg-primary' : 'bg-muted border border-border'}`}
                  data-testid="toggle-send-on-enter"
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${draft.sendOnEnter ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Show token count</span>
                <button
                  role="switch"
                  aria-checked={draft.showTokenCount}
                  onClick={() => update('showTokenCount', !draft.showTokenCount)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${draft.showTokenCount ? 'bg-primary' : 'bg-muted border border-border'}`}
                  data-testid="toggle-token-count"
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${draft.showTokenCount ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Auto-scroll</span>
                <button
                  role="switch"
                  aria-checked={draft.autoScroll}
                  onClick={() => update('autoScroll', !draft.autoScroll)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${draft.autoScroll ? 'bg-primary' : 'bg-muted border border-border'}`}
                  data-testid="toggle-auto-scroll"
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${draft.autoScroll ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Data</h3>
            <div className="space-y-2">
              <button
                onClick={onExportAll}
                className="w-full px-4 py-2 text-sm text-left rounded-lg border border-border bg-muted hover:bg-accent text-foreground transition-colors"
                data-testid="button-export-all"
              >
                Export all conversations as JSON
              </button>
              <button
                onClick={handleClearAll}
                className={`w-full px-4 py-2 text-sm text-left rounded-lg border transition-colors ${clearConfirm ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border bg-muted hover:bg-destructive/10 hover:border-destructive text-destructive'}`}
                data-testid="button-clear-all"
              >
                {clearConfirm ? 'Click again to confirm deletion' : 'Clear all conversations'}
              </button>
            </div>
          </section>

          <div className="border-t border-border pt-2">
            <p className="text-xs text-muted-foreground">Ollama Chat v1.0 · Built for local LLMs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
