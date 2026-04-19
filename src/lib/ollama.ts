import type { Message, ModelShowInfo, PullProgress } from '@/lib/types';

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

export async function fetchModels(host: string): Promise<{ models: Array<{ name: string; model: string; size: number; details: { family: string; parameter_size: string; } }> }> {
  const res = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function testConnection(host: string): Promise<boolean> {
  try {
    const res = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Check authentication state via Ollama's whoami endpoint.
 * Returns user info if signed in, null if not.
 */
export async function fetchWhoAmI(host: string): Promise<{
  username?: string;
  email?: string;
} | null> {
  try {
    const res = await fetch(`${host}/api/whoami`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.username || data.email) {
      return { username: data.username, email: data.email };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sign out from Ollama.
 */
export async function signOut(host: string): Promise<boolean> {
  try {
    const res = await fetch(`${host}/api/signout`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch model details via the /api/show endpoint.
 */
export async function showModel(host: string, name: string): Promise<ModelShowInfo | null> {
  try {
    const res = await fetch(`${host}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Delete a model.
 */
export async function deleteModel(host: string, name: string): Promise<boolean> {
  try {
    const res = await fetch(`${host}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      signal: AbortSignal.timeout(30000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Pull a model with streaming progress.
 */
export async function pullModel(
  host: string,
  name: string,
  onProgress: (progress: PullProgress) => void,
  abortSignal?: AbortSignal
): Promise<boolean> {
  try {
    const res = await fetch(`${host}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, stream: true }),
      signal: abortSignal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => `HTTP ${res.status}`);
      onProgress({ status: 'error', error: text });
      return false;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onProgress({ status: 'error', error: 'No response body' });
      return false;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line) as PullProgress;
          onProgress(data);
          if (data.error) return false;
          if (data.status === 'success') return true;
        } catch {}
      }
    }
    return true;
  } catch (err) {
    if ((err as Error).name === 'AbortError') return false;
    onProgress({ status: 'error', error: (err as Error).message });
    return false;
  }
}

export function buildOllamaMessages(
  messages: Message[],
  systemPrompt: string
): Array<{ role: string; content: string; images?: string[] }> {
  const result: Array<{ role: string; content: string; images?: string[] }> = [];
  if (systemPrompt) {
    result.push({ role: 'system', content: systemPrompt });
  }
  for (const m of messages) {
    const entry: { role: string; content: string; images?: string[] } = {
      role: m.role,
      content: m.content,
    };
    if (m.images && m.images.length > 0) {
      entry.images = m.images;
    }
    result.push(entry);
  }
  return result;
}

export async function streamChat(
  host: string,
  model: string,
  messages: Array<{ role: string; content: string; images?: string[] }>,
  options: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    keep_alive?: string;
  },
  callbacks: StreamCallbacks,
  abortSignal: AbortSignal,
  extraHeaders?: Record<string, string>
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(extraHeaders ?? {}),
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          temperature: options.temperature,
          top_p: options.top_p,
          top_k: options.top_k,
          num_predict: options.num_predict,
        },
        keep_alive: options.keep_alive,
      }),
      signal: abortSignal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    callbacks.onError(err as Error);
    return;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => `HTTP ${response.status}`);
    callbacks.onError(new Error(text));
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError(new Error('No response body'));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            callbacks.onToken(data.message.content);
          }
          if (data.done) {
            callbacks.onDone();
            return;
          }
          if (data.error) {
            callbacks.onError(new Error(data.error));
            return;
          }
        } catch {}
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    callbacks.onError(err as Error);
  } finally {
    callbacks.onDone();
  }
}
