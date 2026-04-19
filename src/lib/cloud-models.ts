import type { OllamaModel } from '@/lib/types';
import type { ModelCapability } from '@/lib/model-utils';

export interface CloudModelEntry extends OllamaModel {
  capabilities?: ModelCapability[];
  description?: string;
}

export const CLOUD_MODELS: CloudModelEntry[] = [
  { name: 'glm-5.1:cloud', model: 'glm-5.1:cloud', modified_at: '', size: 0, digest: '', details: { family: 'glm', parameter_size: '744B', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'tools', 'thinking'], description: 'Advanced reasoning model from Zhipu AI' },
  { name: 'gemma4:31b-cloud', model: 'gemma4:31b-cloud', modified_at: '', size: 0, digest: '', details: { family: 'gemma', parameter_size: '31B', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'vision', 'tools', 'thinking'], description: 'Google\'s 31B multimodal model' },
  { name: 'qwen3.5:cloud', model: 'qwen3.5:cloud', modified_at: '', size: 0, digest: '', details: { family: 'qwen', parameter_size: '35B', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'vision', 'tools', 'thinking'], description: 'Alibaba\'s frontier reasoning model' },
  { name: 'qwen3-coder-next:cloud', model: 'qwen3-coder-next:cloud', modified_at: '', size: 0, digest: '', details: { family: 'qwen', parameter_size: 'Unknown (estimated ~80B)', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'tools', 'thinking'], description: 'Specialized coding model with advanced reasoning' },
  { name: 'nemotron-3-super:cloud', model: 'nemotron-3-super:cloud', modified_at: '', size: 0, digest: '', details: { family: 'nemotron', parameter_size: '120B', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'tools', 'thinking'], description: 'NVIDIA\'s flagship reasoning model' },
  { name: 'minimax-m2.7:cloud', model: 'minimax-m2.7:cloud', modified_at: '', size: 0, digest: '', details: { family: 'minimax', parameter_size: '230B', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'tools'], description: 'MiniMax\'s latest conversational model' },
  { name: 'kimi-k2.5:cloud', model: 'kimi-k2.5:cloud', modified_at: '', size: 0, digest: '', details: { family: 'kimi', parameter_size: '1000B', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'tools', 'thinking'], description: 'Moonshot\'s massive reasoning model' },
  { name: 'kimi-k2-thinking:cloud', model: 'kimi-k2-thinking:cloud', modified_at: '', size: 0, digest: '', details: { family: 'kimi', parameter_size: 'Unknown (estimated ~55B scale)', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'tools', 'thinking'], description: 'Kimi with enhanced chain-of-thought' },
  { name: 'deepseek-v3.2:cloud', model: 'deepseek-v3.2:cloud', modified_at: '', size: 0, digest: '', details: { family: 'deepseek', parameter_size: '685B', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'tools', 'thinking'], description: 'DeepSeek\'s advanced reasoning model' },
  { name: 'gemini-3-flash-preview:cloud', model: 'gemini-3-flash-preview:cloud', modified_at: '', size: 0, digest: '', details: { family: 'gemini', parameter_size: '', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'vision', 'tools', 'thinking'], description: 'Google Gemini 3 Flash preview' },
  { name: 'glm-5:cloud', model: 'glm-5:cloud', modified_at: '', size: 0, digest: '', details: { family: 'glm', parameter_size: '744B', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'tools', 'thinking'], description: 'Zhipu\'s general-purpose model' },
  { name: 'glm-4.7:cloud', model: 'glm-4.7:cloud', modified_at: '', size: 0, digest: '', details: { family: 'glm', parameter_size: 'Unknown (~300-400B range)', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'tools', 'thinking'], description: 'Zhipu\'s large reasoning model' },
  { name: 'glm-4.6:cloud', model: 'glm-4.6:cloud', modified_at: '', size: 0, digest: '', details: { family: 'glm', parameter_size: 'Unknown (~355B)', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'tools', 'thinking'], description: 'Zhipu\'s frontier model' },
  { name: 'gpt-oss:120b-cloud', model: 'gpt-oss:120b-cloud', modified_at: '', size: 0, digest: '', details: { family: 'gptoss', parameter_size: '120B', quantization_level: '', format: '', families: [] }, capabilities: ['cloud', 'tools', 'thinking'], description: 'Open-weights architecture aligned model' },
];
