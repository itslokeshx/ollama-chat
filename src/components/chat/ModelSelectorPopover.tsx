import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Check, ChevronDown, Lock, Cloud, Telescope } from 'lucide-react';
import type { OllamaModel, AuthState } from '@/lib/types';
import {
  getModelTier,
  getTierInfo,
  getModelCapabilities,
  getCapabilityColor,
  parseParamSize,
  type ModelCapability,
  type ModelTier,
} from '@/lib/model-utils';
import { isVisionModel } from '@/lib/types';

function getProviderPrefix(family: string = '', name: string = '') {
  let f = family.toLowerCase().replace(/[0-9.]/g, ''); // strip numbers
  
  if (!f && name) {
    // Infer family from model name if metadata is empty (e.g. glm-4.7:cloud -> glm)
    f = name.split('-')[0].split(':')[0].toLowerCase().replace(/[0-9.]/g, '');
  }

  const map: Record<string, string> = {
    llama: 'Meta',
    gemma: 'Google',
    qwen: 'Alibaba',
    qwennext: 'Alibaba',
    mistral: 'Mistral',
    mixtral: 'Mistral',
    phi: 'Microsoft',
    deepseek: 'DeepSeek',
    nemotron: 'NVIDIA',
    minimax: 'MiniMax',
    kimi: 'Moonshot AI',
    glm: 'Zhipu AI',
    gptoss: 'ChatGPT',
    gpt: 'ChatGPT',
    granite: 'IBM',
    command: 'Cohere',
    starcoder: 'BigCode',
  };
  
  if (map[f]) return map[f];
  if (!f) return 'Other';
  return f.charAt(0).toUpperCase() + f.slice(1);
}

const PROVIDER_ORDER = [
  'Zhipu AI',
  'MiniMax',
  'Moonshot AI',
  'Alibaba',
  'DeepSeek',
  'ChatGPT',
  'Google',
  'NVIDIA'
];

interface Props {
  models: OllamaModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  authState: AuthState;
  onBrowseModels: () => void;
  onSignIn: () => void;
}

function CapabilityBadge({ cap }: { cap: ModelCapability }) {
  const colors = getCapabilityColor(cap);
  return (
    <span
      className={`capability-badge inline-flex items-center px-1.5 py-[1px] rounded-full text-[10px] font-medium leading-tight ${colors.bg} ${colors.text}`}
    >
      {cap}
    </span>
  );
}

function ModelRow({
  model,
  isSelected,
  onClick,
}: {
  model: OllamaModel;
  isSelected: boolean;
  onClick: () => void;
}) {
  const tier = getModelTier(model);
  const tierInfo = getTierInfo(tier);
  const caps = getModelCapabilities(model);
  const paramSize = model.details?.parameter_size ?? '';
  const quant = model.details?.quantization_level ?? '';
  const displayName = model.name.split(':')[0];
  const tag = model.name.includes(':') ? model.name.split(':').slice(1).join(':') : '';

  // Show max 3 badges
  const visibleCaps = caps.slice(0, 3);
  const overflowCount = caps.length - 3;

  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col gap-0.5 px-3 py-2 text-left transition-colors rounded-lg mx-1 group hover:bg-accent ${
        isSelected ? 'bg-accent/80' : ''
      }`}
      data-testid={`model-popover-${model.name}`}
    >
      <div className="flex items-center gap-2 w-full">
        {/* Tier dot */}
        <div className={`w-2 h-2 rounded-full shrink-0 ${tierInfo.dotColor}`} />

        {/* Model name */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {tier === 'cloud' && <Cloud size={11} className="text-sky-500 shrink-0" />}
          <span className="text-xs font-medium text-foreground truncate">
            {displayName}
          </span>
          {tag && tag !== 'latest' && tag !== 'cloud' && (
            <span className="text-[10px] text-muted-foreground">
              :{tag}
            </span>
          )}
        </div>

        {/* Param size badge */}
        {paramSize && (
          <span className="px-1.5 py-[1px] rounded bg-muted text-muted-foreground text-[10px] font-medium shrink-0 uppercase">
            {paramSize}
          </span>
        )}

        {/* Capability badges */}
        <div className="flex items-center gap-1 shrink-0">
          {visibleCaps.map((cap) => (
            <CapabilityBadge key={cap} cap={cap} />
          ))}
          {overflowCount > 0 && (
            <span className="text-[10px] text-muted-foreground">+{overflowCount}</span>
          )}
        </div>

        {/* Checkmark */}
        {isSelected && (
          <Check size={13} className="text-primary shrink-0" />
        )}
      </div>

      {/* Micro row: quant + family */}
      {(quant || model.details?.family) && (
        <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {quant && (
            <span className="text-[10px] text-muted-foreground">{quant}</span>
          )}
          {model.details?.family && (
            <span className="text-[10px] text-muted-foreground">{model.details.family}</span>
          )}
        </div>
      )}
    </button>
  );
}

export function ModelSelectorPopover({
  models,
  selectedModel,
  onModelChange,
  authState,
  onBrowseModels,
  onSignIn,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local');
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const localModels = useMemo(
    () => models.filter((m) => !m.name.includes(':cloud') && !m.name.includes('-cloud')),
    [models]
  );
  const cloudModels = useMemo(
    () => models.filter((m) => m.name.includes(':cloud') || m.name.includes('-cloud')),
    [models]
  );

  const filterModels = (list: OllamaModel[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((m) => {
      const name = m.name.toLowerCase();
      const family = (m.details?.family ?? '').toLowerCase();
      const paramSize = (m.details?.parameter_size ?? '').toLowerCase();
      const caps = getModelCapabilities(m).join(' ');
      return name.includes(q) || family.includes(q) || paramSize.includes(q) || caps.includes(q);
    });
  };

  const filteredLocal = filterModels(localModels);
  const filteredCloud = filterModels(cloudModels);

  // Group local models by provider
  const groupedLocal = useMemo(() => {
    const groups: Record<string, OllamaModel[]> = {};
    for (const model of filteredLocal) {
      const provider = getProviderPrefix(model.details?.family, model.name);
      if (!groups[provider]) groups[provider] = [];
      groups[provider].push(model);
    }
    return Object.entries(groups)
      .map(([provider, models]) => {
        // Sort models descending (high to low, e.g. glm-5.1 -> glm-4.7)
        models.sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
        return { provider, models };
      })
      .sort((a, b) => {
        const idxA = PROVIDER_ORDER.indexOf(a.provider);
        const idxB = PROVIDER_ORDER.indexOf(b.provider);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.provider.localeCompare(b.provider);
      });
  }, [filteredLocal]);

  // Group cloud models by provider
  const groupedCloud = useMemo(() => {
    const groups: Record<string, OllamaModel[]> = {};
    for (const model of filteredCloud) {
      const provider = getProviderPrefix(model.details?.family, model.name);
      if (!groups[provider]) groups[provider] = [];
      groups[provider].push(model);
    }
    return Object.entries(groups)
      .map(([provider, models]) => {
        // Sort models descending (high to low)
        models.sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
        return { provider, models };
      })
      .sort((a, b) => {
        const idxA = PROVIDER_ORDER.indexOf(a.provider);
        const idxB = PROVIDER_ORDER.indexOf(b.provider);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.provider.localeCompare(b.provider);
      });
  }, [filteredCloud]);

  const displayName = selectedModel.split(':')[0] || 'Select model';
  const isCloud = selectedModel.includes(':cloud');

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border"
        data-testid="button-model-selector"
      >
        {isCloud && <Cloud size={11} className="text-sky-500" />}
        {!isCloud && isVisionModel(selectedModel) && (
          <span className="w-2 h-2 rounded-full bg-purple-500" />
        )}
        <span className="max-w-[140px] truncate font-medium">{displayName}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="model-selector-popover absolute bottom-full left-0 mb-1 w-80 bg-popover border border-popover-border rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Tabs */}
          <div className="flex p-1 bg-muted/50 border-b border-border">
            <button
              onClick={() => { setActiveTab('local'); setSearch(''); searchRef.current?.focus(); }}
              className={`flex-1 py-1 px-2 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'local' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Local
            </button>
            <button
              onClick={() => { setActiveTab('cloud'); setSearch(''); searchRef.current?.focus(); }}
              className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'cloud' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Cloud size={11} className={activeTab === 'cloud' ? 'text-sky-500' : ''} />
              Cloud
            </button>
          </div>

          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder={`Search ${activeTab} models...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-md bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                data-testid="input-search-models"
              />
            </div>
          </div>

          {/* Model list */}
          <div className="max-h-[360px] overflow-y-auto py-1">
            {/* Local models */}
            {activeTab === 'local' && groupedLocal.length > 0 && (
              <div>
                {groupedLocal.map((group) => (
                  <div key={group.provider} className="mb-2">
                    <div className="px-3 py-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-muted-foreground/80 uppercase">
                        {group.provider}
                      </span>
                    </div>
                    {group.models.map((m) => (
                      <ModelRow
                        key={m.name}
                        model={m}
                        isSelected={m.name === selectedModel}
                        onClick={() => {
                          onModelChange(m.name);
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Empty local state */}
            {activeTab === 'local' && filteredLocal.length === 0 && (
              <div className="px-4 py-8 flex flex-col items-center justify-center text-center gap-2">
                <Telescope size={24} className="text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">
                  {search ? `No local models matching "${search}"` : 'No models installed.'}
                </p>
                {!search && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onBrowseModels();
                    }}
                    className="text-primary hover:underline text-xs"
                  >
                    Browse models to get started →
                  </button>
                )}
              </div>
            )}

            {/* Cloud models */}
            {activeTab === 'cloud' && (
              <div className="mt-1">
                {authState.status !== 'signed-in' && (
                  <div className="px-5 py-8 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Lock size={18} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1 text-foreground">Sign in Required</p>
                      <p className="text-[11px] text-muted-foreground max-w-[200px]">
                        Cloud models require an active Ollama account session.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onSignIn();
                      }}
                      className="mt-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90"
                    >
                      Sign In Now
                    </button>
                  </div>
                )}
                {authState.status === 'signed-in' && groupedCloud.length > 0 &&
                  groupedCloud.map((group) => (
                    <div key={group.provider} className="mb-2">
                      <div className="px-3 py-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground/80 uppercase">
                          {group.provider}
                        </span>
                      </div>
                      {group.models.map((m) => (
                        <ModelRow
                          key={m.name}
                          model={m}
                          isSelected={m.name === selectedModel}
                          onClick={() => {
                            onModelChange(m.name);
                            setIsOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  ))}
                  
                {authState.status === 'signed-in' && filteredCloud.length === 0 && search && (
                  <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No cloud models matching "{search}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onBrowseModels();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors font-medium"
              data-testid="button-browse-models-link"
            >
              <Telescope size={13} />
              Browse all models →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
