import { useState, useCallback, useEffect } from 'react';
import type { Conversation, Message, Settings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/types';

const STORAGE_KEY = 'ollama-chat-conversations';
const SETTINGS_KEY = 'ollama-chat-settings';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function useChatStore() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(() => {
    const convs = loadConversations();
    return convs.length > 0 ? convs[0].id : null;
  });
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  const persistConversations = useCallback((next: Conversation[]) => {
    setConversations(next);
    saveConversations(next);
  }, []);

  const updateSettings = useCallback((next: Partial<Settings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      saveSettings(merged);
      return merged;
    });
  }, []);

  const createConversation = useCallback((model: string, systemPrompt = ''): string => {
    const id = generateId();
    const now = Date.now();
    const conv: Conversation = {
      id,
      title: 'New chat',
      model,
      systemPrompt,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    persistConversations([conv, ...conversations]);
    setActiveId(id);
    return id;
  }, [conversations, persistConversations]);

  const deleteConversation = useCallback((id: string) => {
    const next = conversations.filter((c) => c.id !== id);
    persistConversations(next);
    if (activeId === id) {
      setActiveId(next.length > 0 ? next[0].id : null);
    }
  }, [conversations, activeId, persistConversations]);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    persistConversations(
      conversations.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c))
    );
  }, [conversations, persistConversations]);

  const addMessage = useCallback((convId: string, msg: Omit<Message, 'id' | 'createdAt'>): string => {
    const id = generateId();
    const message: Message = { ...msg, id, createdAt: Date.now() };
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return id;
    const isFirstUserMsg = conv.messages.length === 0 && msg.role === 'user';
    const title = isFirstUserMsg
      ? msg.content.slice(0, 40) || 'New chat'
      : conv.title;
    persistConversations(
      conversations.map((c) =>
        c.id === convId
          ? { ...c, messages: [...c.messages, message], title, updatedAt: Date.now() }
          : c
      )
    );
    return id;
  }, [conversations, persistConversations]);

  const updateMessage = useCallback((convId: string, msgId: string, updates: Partial<Message>) => {
    persistConversations(
      conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...updates } : m)),
              updatedAt: Date.now(),
            }
          : c
      )
    );
  }, [conversations, persistConversations]);

  const deleteMessagesAfter = useCallback((convId: string, msgId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;
    const idx = conv.messages.findIndex((m) => m.id === msgId);
    if (idx === -1) return;
    const truncated = conv.messages.slice(0, idx);
    persistConversations(
      conversations.map((c) =>
        c.id === convId ? { ...c, messages: truncated, updatedAt: Date.now() } : c
      )
    );
  }, [conversations, persistConversations]);

  const clearAllConversations = useCallback(() => {
    persistConversations([]);
    setActiveId(null);
  }, [persistConversations]);

  const exportAllConversations = useCallback(() => {
    const blob = new Blob([JSON.stringify(conversations, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ollama-chat-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [conversations]);

  const exportCurrentConversation = useCallback((format: 'json' | 'md') => {
    if (!activeConversation) return;
    let content: string;
    let filename: string;
    if (format === 'json') {
      content = JSON.stringify(activeConversation, null, 2);
      filename = `chat-${activeConversation.id}.json`;
    } else {
      const lines = [`# ${activeConversation.title}\n`];
      for (const m of activeConversation.messages) {
        lines.push(`## ${m.role === 'user' ? 'You' : 'Assistant'}\n`);
        lines.push(m.content + '\n');
      }
      content = lines.join('\n');
      filename = `chat-${activeConversation.id}.md`;
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeConversation]);

  return {
    conversations,
    activeId,
    setActiveId,
    activeConversation,
    settings,
    updateSettings,
    createConversation,
    deleteConversation,
    updateConversation,
    addMessage,
    updateMessage,
    deleteMessagesAfter,
    clearAllConversations,
    exportAllConversations,
    exportCurrentConversation,
  };
}
