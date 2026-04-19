import { useState, useEffect } from 'react';
import { X, Search, Telescope, Cloud, Download, Check, AlertTriangle } from 'lucide-react';
import { CLOUD_MODELS } from '@/lib/cloud-models';
import { getModelCapabilities, getCapabilityColor, formatPullCount, formatModelSize } from '@/lib/model-utils';
import { pullModel } from '@/lib/ollama';
import type { OllamaModel, PullProgress } from '@/lib/types';
import * as Progress from '@radix-ui/react-progress';

interface Props {
  open: boolean;
  onClose: () => void;
  localModels: OllamaModel[];
  onModelSelected: (modelName: string) => void;
  ollamaHost: string;
  onRefreshModels: () => Promise<void>;
}

export function ModelBrowser({
  open,
  onClose,
  localModels,
  onModelSelected,
  ollamaHost,
  onRefreshModels,
}: Props) {
  const [search, setSearch] = useState('');
  const [pulling, setPulling] = useState<Record<string, PullProgress>>({});

  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const filteredModels = CLOUD_MODELS.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = m.name.toLowerCase();
    const desc = (m.description ?? '').toLowerCase();
    const family = (m.details?.family ?? '').toLowerCase();
    return name.includes(q) || desc.includes(q) || family.includes(q);
  });

  const handlePull = async (modelName: string) => {
    // Cloud models in this list have names like "gemma4:cloud". For pulling locally, we map them directly.
    // However, if the user pulls a cloud model, they actually just "select" it for cloud inference.
    // If we want to pull the local version of it, we'd pull the name without `:cloud`.
    const localName = modelName.replace(':cloud', '');

    setPulling((prev) => ({
      ...prev,
      [modelName]: { status: 'starting', completed: 0, total: 100 },
    }));

    const success = await pullModel(ollamaHost, localName, (prog) => {
      setPulling((prev) => ({
        ...prev,
        [modelName]: prog,
      }));
    });

    if (success) {
      setTimeout(() => {
        setPulling((prev) => {
          const next = { ...prev };
          delete next[modelName];
          return next;
        });
        onRefreshModels();
      }, 2000); // clear progress after 2s
    }
  };

  const isModelInstalled = (modelName: string) => {
    const localName = modelName.replace(':cloud', '');
    return localModels.some((m) => m.name === localName || m.name === modelName);
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 bottom-0 right-0 w-[480px] bg-card border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-[480px]'
        }`}
        data-testid="model-browser-drawer"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex flex-col gap-4 bg-card z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Telescope size={16} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground leading-tight">Model Library</h2>
                <p className="text-xs text-muted-foreground">Discover and pull new models to your machine</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search models by name, capability, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative">
          {filteredModels.map((model) => {
            const caps = getModelCapabilities(model);
            const installed = isModelInstalled(model.name);
            const prog = pulling[model.name];
            const isPulling = !!prog && prog.status !== 'success' && prog.status !== 'error';
            const progressPercent = prog?.total && prog?.completed
              ? Math.max(5, Math.floor((prog.completed / prog.total) * 100))
              : 5;

            const localName = model.name.replace(':cloud', '');

            return (
              <div
                key={model.name}
                className="p-4 rounded-xl border border-border bg-card/60 hover:bg-muted/40 transition-colors"
                data-testid={`model-card-${model.name}`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      {localName}
                      {model.name.includes(':cloud') && (
                        <span className="flex items-center gap-0.5 text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded-full font-medium">
                          <Cloud size={10} /> Cloud option
                        </span>
                      )}
                    </h3>
                    {model.description && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {model.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {caps.map((cap) => {
                    const c = getCapabilityColor(cap);
                    return (
                      <span
                        key={cap}
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium leading-tight ${c.bg} ${c.text}`}
                      >
                        {cap}
                      </span>
                    );
                  })}
                  {(model.details?.parameter_size) && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] font-medium uppercase border border-zinc-200 dark:border-zinc-700">
                      {model.details.parameter_size}
                    </span>
                  )}
                  {model.size > 0 && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {formatModelSize(model.size)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isPulling ? (
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 font-medium">
                        <span className="truncate pr-2">{prog?.status === 'downloading' ? `Pulling layers...` : prog?.status}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <Progress.Root className="relative overflow-hidden bg-muted rounded-full w-full h-1.5" value={progressPercent}>
                        <Progress.Indicator
                          className="w-full h-full bg-primary transition-transform duration-500 ease-out"
                          style={{ transform: `translateX(-${100 - progressPercent}%)` }}
                        />
                      </Progress.Root>
                    </div>
                  ) : prog?.status === 'error' ? (
                    <div className="flex-1 flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-2 py-1.5 rounded-lg border border-destructive/20">
                      <AlertTriangle size={12} />
                      <span className="truncate">{prog.error || 'Failed to pull model'}</span>
                    </div>
                  ) : installed ? (
                    <div className="flex-1 flex gap-2">
                      <span className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                        <Check size={14} /> Installed
                      </span>
                      <button
                        onClick={() => {
                          onModelSelected(model.name.includes(':cloud') ? model.name : localName);
                          onClose();
                        }}
                        className="flex-1 py-1.5 rounded-lg border border-border bg-muted hover:bg-accent text-foreground text-xs font-medium transition-colors"
                      >
                        Select in chat
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex gap-2">
                      <button
                        onClick={() => handlePull(model.name)}
                        className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors border border-transparent active:scale-[0.98]"
                      >
                        <Download size={14} /> Pull local
                      </button>
                      {model.name.includes(':cloud') && (
                        <button
                          onClick={() => {
                            onModelSelected(model.name);
                            onClose();
                          }}
                          className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors active:scale-[0.98]"
                        >
                          <Cloud size={14} className="text-sky-500" /> Run Cloud
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
