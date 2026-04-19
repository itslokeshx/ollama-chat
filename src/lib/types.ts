export interface FileAttachment {
  id: string;
  name: string;
  type: 'image' | 'text' | 'pdf';
  mimeType: string;
  content: string;
  base64?: string;
  pageCount?: number;
  size: number;
  thumbnailUrl?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  attachments?: FileAttachment[];
  createdAt: number;
  feedback?: 'up' | 'down' | null;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  systemPrompt: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families?: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface AuthState {
  status: 'checking' | 'signed-in' | 'signed-out';
  username?: string;
  email?: string;
  avatar?: string;
  apiKey?: string;
}

export interface ModelShowInfo {
  modelfile: string;
  parameters: string;
  template: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  model_info?: Record<string, unknown>;
}

export interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
  error?: string;
}

export interface Settings {
  ollamaHost: string;
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  keepAlive: string;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'sm' | 'md' | 'lg';
  sendOnEnter: boolean;
  showTokenCount: boolean;
  autoScroll: boolean;
}

export interface SystemPromptPreset {
  id: string;
  name: string;
  prompt: string;
}

export const DEFAULT_SETTINGS: Settings = {
  ollamaHost: 'http://localhost:11434',
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 2048,
  keepAlive: '5m',
  theme: 'system',
  fontSize: 'md',
  sendOnEnter: true,
  showTokenCount: true,
  autoScroll: true,
};

export const SYSTEM_PROMPT_PRESETS: SystemPromptPreset[] = [
  { id: 'default', name: 'Default Assistant', prompt: '' },
  {
    id: 'engineer',
    name: 'Senior Software Engineer',
    prompt:
      'You are a senior software engineer. Write clean, well-documented, production-ready code. Ask clarifying questions when requirements are ambiguous. Consider edge cases, performance implications, and maintainability. Prefer established patterns over clever hacks.',
  },
  {
    id: 'concise',
    name: 'Concise',
    prompt:
      'You are a concise assistant. Answer in as few words as possible. No fluff, no filler, no preamble. Get straight to the point.',
  },
  {
    id: 'creative',
    name: 'Creative Writer',
    prompt:
      'You are a creative writer with a vivid, literary style. Use metaphor, sensory detail, and precise language. Every sentence should earn its place. Write with confidence and originality.',
  },
  {
    id: 'terminal',
    name: 'Linux Terminal',
    prompt:
      'You are a Linux terminal. Respond only as a terminal would — output only, no explanations. Simulate a Linux shell environment accurately.',
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    prompt:
      'You are a data analyst. Think in tables, statistics, and visualizations. When presenting data, prefer structured formats. Surface insights, trends, and actionable recommendations.',
  },
];

export const VISION_MODEL_FAMILIES = [
  'llava', 'bakllava', 'moondream', 'cogvlm', 'llama3.2-vision', 'minicpm-v', 'qwen2-vl',
  'llava-llama3', 'llava-phi3', 'falcon2', 'granite3', 'pixtral', 'internvl', 'obsidian',
];

export function isVisionModel(modelName: string): boolean {
  const lower = modelName.toLowerCase();
  return VISION_MODEL_FAMILIES.some((f) => lower.includes(f));
}
