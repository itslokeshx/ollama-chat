import type { OllamaModel } from '@/lib/types';

export type ModelTier = 'frontier' | 'balanced' | 'efficient' | 'cloud';
export type ModelCapability = 'vision' | 'tools' | 'thinking' | 'cloud' | 'audio' | 'text';

const VISION_FAMILIES = [
  'llava', 'bakllava', 'moondream', 'cogvlm', 'llama3.2-vision', 'minicpm-v',
  'qwen2-vl', 'qwen3-vl', 'llava-llama3', 'llava-phi3', 'falcon2', 'granite3',
  'pixtral', 'internvl', 'obsidian', 'gemma4', 'gemini', 'devstral',
];

const TOOL_FAMILIES = [
  'llama3', 'qwen', 'mistral', 'gemma', 'deepseek', 'nemotron', 'kimi',
  'minimax', 'cogito', 'glm', 'devstral', 'gemini',
];

const THINKING_FAMILIES = [
  'deepseek', 'qwen3', 'cogito', 'kimi-k2-thinking', 'gemini', 'glm',
];

/**
 * Parse parameter size string to a number in billions.
 * Handles formats like "3.2b", "7B", "671b", "120B", etc.
 */
export function parseParamSize(sizeStr: string): number {
  if (!sizeStr) return 0;
  const cleaned = sizeStr.toLowerCase().replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Determine model tier based on parameter size.
 */
export function getModelTier(model: OllamaModel): ModelTier {
  if (model.name.includes(':cloud')) return 'cloud';

  const paramSize = parseParamSize(model.details?.parameter_size ?? '');

  if (paramSize >= 70) return 'frontier';
  if (paramSize >= 7) return 'balanced';
  return 'efficient';
}

/**
 * Get tier display info.
 */
export function getTierInfo(tier: ModelTier): { label: string; color: string; dotColor: string } {
  switch (tier) {
    case 'frontier':
      return { label: 'Frontier', color: 'text-orange-500', dotColor: 'bg-orange-500' };
    case 'balanced':
      return { label: 'Balanced', color: 'text-amber-500', dotColor: 'bg-amber-500' };
    case 'efficient':
      return { label: 'Efficient', color: 'text-emerald-500', dotColor: 'bg-emerald-500' };
    case 'cloud':
      return { label: 'Cloud', color: 'text-sky-500', dotColor: 'bg-sky-500' };
  }
}

/**
 * Detect model capabilities from name and family.
 */
export function getModelCapabilities(model: OllamaModel): ModelCapability[] {
  const caps: ModelCapability[] = [];
  const name = model.name.toLowerCase();
  const family = (model.details?.family ?? '').toLowerCase();
  const families = model.details?.families ?? [];
  const allFamilies = [family, ...families.map(f => f.toLowerCase())];

  // Cloud detection
  if (name.includes(':cloud') || name.includes('-cloud')) {
    caps.push('cloud');
  }

  // Vision detection
  if (VISION_FAMILIES.some(f => name.includes(f) || allFamilies.some(af => af.includes(f)))) {
    caps.push('vision');
  }
  if (name.includes('-vl') || name.includes('vision')) {
    caps.push('vision');
  }

  // Tools detection
  if (TOOL_FAMILIES.some(f => name.includes(f) || allFamilies.some(af => af.includes(f)))) {
    caps.push('tools');
  }

  // Thinking/reasoning detection
  if (THINKING_FAMILIES.some(f => name.includes(f) || allFamilies.some(af => af.includes(f)))) {
    caps.push('thinking');
  }
  if (name.includes('think') || name.includes('reason') || name.includes('cot')) {
    caps.push('thinking');
  }

  // If no special caps, mark as text-only
  if (caps.length === 0 || (caps.length === 1 && caps[0] === 'cloud')) {
    caps.push('text');
  }

  // Deduplicate
  return Array.from(new Set(caps));
}

/**
 * Get color class for a capability badge.
 */
export function getCapabilityColor(cap: ModelCapability): { bg: string; text: string } {
  switch (cap) {
    case 'vision':
      return { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400' };
    case 'tools':
      return { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' };
    case 'thinking':
      return { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' };
    case 'cloud':
      return { bg: 'bg-sky-500/15', text: 'text-sky-600 dark:text-sky-400' };
    case 'audio':
      return { bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400' };
    case 'text':
      return { bg: 'bg-gray-500/10', text: 'text-gray-500 dark:text-gray-400' };
  }
}

/**
 * Format large pull counts: 1234567 → "1.2M", 35700 → "35.7K"
 */
export function formatPullCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Format model file size: bytes → "2.0 GB", "345 MB"
 */
export function formatModelSize(bytes: number): string {
  if (bytes <= 0) return '—';
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

/**
 * Group models by tier, returning an ordered array.
 */
export function groupModelsByTier(models: OllamaModel[]): {
  tier: ModelTier;
  label: string;
  models: OllamaModel[];
}[] {
  const groups: Record<ModelTier, OllamaModel[]> = {
    frontier: [],
    balanced: [],
    efficient: [],
    cloud: [],
  };

  for (const model of models) {
    const tier = getModelTier(model);
    groups[tier].push(model);
  }

  const tierOrder: ModelTier[] = ['frontier', 'balanced', 'efficient'];
  return tierOrder
    .map(tier => ({
      tier,
      label: getTierInfo(tier).label,
      models: groups[tier],
    }))
    .filter(g => g.models.length > 0);
}
