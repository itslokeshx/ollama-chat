import { useState, useEffect } from 'react';
import { ChevronRight, Trash2, Box, Info, Cloud } from 'lucide-react';
import type { OllamaModel, ModelShowInfo } from '@/lib/types';
import {
  getModelCapabilities,
  getCapabilityColor,
  formatModelSize,
  parseParamSize,
} from '@/lib/model-utils';
import { formatRelativeTime } from '@/lib/time-utils';
import { showModel, deleteModel } from '@/lib/ollama';

interface Props {
  open: boolean;
  modelName: string | null;
  models: OllamaModel[];
  ollamaHost: string;
  onRefreshModels: () => Promise<void>;
  onModelChange: (m: string) => void;
}

export function ModelInfoPanel({
  open,
  modelName,
  models,
  ollamaHost,
  onRefreshModels,
  onModelChange,
}: Props) {
  const [info, setInfo] = useState<ModelShowInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const modelDef = models.find((m) => m.name === modelName);
  const isCloud = modelName?.includes(':cloud');

  // Fetch /api/show when the selected model changes
  useEffect(() => {
    let active = true;
    if (!open || !modelName || isCloud) {
      setInfo(null);
      return;
    }
    setLoading(true);
    showModel(ollamaHost, modelName).then((res) => {
      if (active) {
        setInfo(res);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [open, modelName, ollamaHost, isCloud]);

  if (!open) return null;

  const handleDelete = async () => {
    if (!modelName) return;
    if (deleteConfirm) {
      const ok = await deleteModel(ollamaHost, modelName);
      if (ok) {
        await onRefreshModels();
        onModelChange((models.find(m => m.name !== modelName) || { name: '' }).name);
      }
      setDeleteConfirm(false);
    } else {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };

  const caps = modelDef ? getModelCapabilities(modelDef) : [];
  const family = info?.details?.family || modelDef?.details?.family || '—';
  const params = info?.details?.parameter_size || modelDef?.details?.parameter_size || '—';
  const quant = info?.details?.quantization_level || modelDef?.details?.quantization_level || '—';
  const sizeStr = modelDef?.size ? formatModelSize(modelDef.size) : '—';
  const modifiedStr = modelDef?.modified_at ? formatRelativeTime(new Date(modelDef.modified_at).getTime()) : '—';

  // extract context length from model_info if possible
  const mInfo = info?.model_info as Record<string, unknown> | undefined;
  const ctxLength = mInfo?.['llama.context_length'] || mInfo?.['qwen2.context_length'] || '8192';

  return (
    <div
      className={`border-l border-border bg-sidebar flex flex-col transition-all overflow-hidden ${
        open ? 'w-60 opacity-100' : 'w-0 opacity-0'
      }`}
      style={{ minWidth: open ? '240px' : '0' }}
      data-testid="model-info-panel"
    >
      <div className="p-4 border-b border-sidebar-border bg-sidebar-accent/50">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Model Info
        </h3>
        <div className="font-medium text-foreground truncate" title={modelName || 'No model selected'}>
          {modelName ? modelName.split(':')[0] : 'None'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-sm">
        {!modelName ? (
          <div className="text-muted-foreground text-xs text-center py-4">No model strictly selected.</div>
        ) : isCloud ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500">
              <Cloud size={24} />
            </div>
            <div className="px-2">
              <h4 className="font-semibold text-foreground mb-1">Cloud Model</h4>
              <p className="text-xs leading-relaxed">
                This model runs efficiently on Ollama's high-performance cloud servers.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grid properties */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
              <div className="text-muted-foreground font-medium">Modified</div>
              <div className="text-right truncate text-foreground" title={modifiedStr}>{modifiedStr}</div>
            </div>

            {/* Capabilities */}
            <div>
              <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Box size={14} className="text-muted-foreground" />
                Capabilities
              </div>
              <div className="flex flex-wrap gap-1.5">
                {caps.length === 0 && <span className="text-xs text-muted-foreground">None detected</span>}
                {caps.map((cap) => {
                  const colors = getCapabilityColor(cap);
                  return (
                    <span
                      key={cap}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium leading-tight ${colors.bg} ${colors.text}`}
                    >
                      {cap}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Delete button */}
            <div className="pt-2 border-t border-sidebar-border">
              <button
                onClick={handleDelete}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors border ${
                  deleteConfirm
                    ? 'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    : 'border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20'
                }`}
              >
                {deleteConfirm ? (
                  'Click again to delete'
                ) : (
                  <>
                    <Trash2 size={14} /> Delete local model
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
