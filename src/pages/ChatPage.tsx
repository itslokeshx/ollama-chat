import { useRef, useState, useEffect, useCallback } from "react";
import {
  Menu,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Terminal,
  Download,
  FileJson,
  Pencil,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import type { OllamaModel, FileAttachment } from "@/lib/types";
import { useChatStore } from "@/store/chat-store";
import { fetchModels, streamChat, buildOllamaMessages } from "@/lib/ollama";
import { CLOUD_MODELS } from "@/lib/cloud-models";
import { buildMessageContent } from "@/lib/file-utils";
import { Sidebar } from "@/components/chat/Sidebar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { InputArea } from "@/components/chat/InputArea";
import { SystemPromptPanel } from "@/components/chat/SystemPromptPanel";
import { SettingsModal } from "@/components/chat/SettingsModal";
import { EmptyState } from "@/components/chat/EmptyState";
import { LightboxModal } from "@/components/chat/LightboxModal";
import { SignInModal } from "@/components/chat/SignInModal";
import { ModelBrowser } from "@/components/chat/ModelBrowser";
import { ModelInfoPanel } from "@/components/chat/ModelInfoPanel";
import { useAuthStore } from "@/store/auth-store";

export default function ChatPage() {
  const store = useChatStore();
  const {
    conversations,
    activeId,
    setActiveId,
    activeConversation,
    settings,
    updateSettings,
  } = store;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [systemPanelOpen, setSystemPanelOpen] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [ollamaOffline, setOllamaOffline] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [userScrolledUp, _setUserScrolledUp] = useState(false);
  const userScrolledUpRef = useRef(false);
  const setUserScrolledUp = useCallback((val: boolean) => {
    userScrolledUpRef.current = val;
    _setUserScrolledUp(val);
  }, []);
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);

  const [modelBrowserOpen, setModelBrowserOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [modelInfoOpen, setModelInfoOpen] = useState(false);

  const { authState, checkAuth, signOut, getApiConfig } = useAuthStore(settings.ollamaHost);

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);
  
  const isCloudModel = selectedModel.includes(':cloud');

  const isDark =
    settings.theme === "dark" ||
    (settings.theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  const fontSizeClass =
    settings.fontSize === "sm"
      ? "text-[13px]"
      : settings.fontSize === "lg"
        ? "text-[17px]"
        : "text-[15px]";

  const loadModels = useCallback(async () => {
    try {
      const data = await fetchModels(settings.ollamaHost);
      const mods = (data.models ?? []) as OllamaModel[];

      // Combine local and cloud models, deduplicating by base name
      const allModels = [...mods];
      for (const cm of CLOUD_MODELS) {
        if (
          !allModels.find((m) => m.name.split(":")[0] === cm.name.split(":")[0])
        ) {
          allModels.push(cm);
        }
      }

      setModels(allModels);
      setOllamaOffline(false);
      if (!selectedModel && allModels.length > 0) {
        setSelectedModel(allModels[0].name);
      }
    } catch {
      setOllamaOffline(true);
      // Still show cloud models even if local Ollama is offline
      setModels(CLOUD_MODELS);
      if (!selectedModel && CLOUD_MODELS.length > 0) {
        setSelectedModel(CLOUD_MODELS[0].name);
      }
    }
  }, [settings.ollamaHost, selectedModel]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    if (activeConversation) {
      setSelectedModel(activeConversation.model || selectedModel);
    }
  }, [activeConversation?.id]);

  const scrollToBottom = useCallback(
    (force = false) => {
      if (!settings.autoScroll && !force) return;
      if (userScrolledUp && !force) return;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    [settings.autoScroll, userScrolledUp],
  );

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages.length, streamingMsgId]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 100;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setUserScrolledUp(!atBottom);
  }, []);

  const handleNewChat = useCallback(() => {
    store.createConversation(
      selectedModel || models[0]?.name || "llama3.2",
      "",
    );
    setUserScrolledUp(false);
  }, [store, selectedModel, models]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      setUserScrolledUp(false);
    },
    [setActiveId],
  );

  const handleSend = useCallback(
    async (text: string, attachments: FileAttachment[]) => {
      if (isStreaming) return;

      let convId = activeId;
      if (!convId) {
        convId = store.createConversation(
          selectedModel,
          activeConversation?.systemPrompt ?? "",
        );
      }

      const { content, images } = buildMessageContent(text, attachments);

      store.addMessage(convId, {
        role: "user",
        content,
        images: images.length > 0 ? images : undefined,
        attachments,
      });

      const assistantMsgId = store.addMessage(convId, {
        role: "assistant",
        content: "",
      });
      setStreamingMsgId(assistantMsgId);
      setIsStreaming(true);
      setUserScrolledUp(false);

      const conv = conversations.find((c) => c.id === convId);

      const allMessages = [
        ...(conv ? conv.messages : []).filter((m) => m.id !== assistantMsgId),
        {
          role: "user" as const,
          content,
          images: images.length > 0 ? images : undefined,
          id: "",
          createdAt: 0,
        },
      ];

      const ollamaMessages = buildOllamaMessages(
        allMessages,
        activeConversation?.systemPrompt ??
          (conv ? conv.systemPrompt : "") ??
          "",
      );

      abortRef.current = new AbortController();

      let accum = "";

      const apiConfig = getApiConfig(selectedModel);

      await streamChat(
        apiConfig.host,
        selectedModel,
        ollamaMessages,
        {
          temperature: settings.temperature,
          top_p: settings.topP,
          top_k: settings.topK,
          num_predict: settings.maxTokens,
          keep_alive: settings.keepAlive,
        },
        {
          onToken: (token) => {
            accum += token;
            store.updateMessage(convId!, assistantMsgId, { content: accum });
            if (!userScrolledUpRef.current && settings.autoScroll) {
              messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
            }
          },
          onDone: () => {
            setIsStreaming(false);
            setStreamingMsgId(null);
          },
          onError: (err) => {
            const isModelNotFound =
              err.message.includes("not found") &&
              err.message.includes("model");
            const isUnauthorized = err.message.includes("unauthorized");
            const modelToRun = selectedModel.includes(":cloud")
              ? selectedModel
              : `${selectedModel}:cloud`;
            
            let fallbackMsg = `Error: ${err.message}\n\nMake sure Ollama is running with:\n\`\`\`bash\nollama serve\n\`\`\``;
            
            if (isModelNotFound) {
              fallbackMsg = `Error: ${err.message}\n\n**This model is not downloaded locally yet.**\nTo run it, open your terminal and run:\n\`\`\`bash\nollama run ${modelToRun}\n\`\`\``;
            } else if (isUnauthorized) {
              fallbackMsg = `Error: ${err.message}\n\n**Cloud Authentication Failed.**\nYour Ollama session may have expired or is unauthorized to use this cloud model. Open your terminal and sign in again:\n\`\`\`bash\nollama signin\n\`\`\``;
            }

            store.updateMessage(convId!, assistantMsgId, {
              content: fallbackMsg,
            });
            setIsStreaming(false);
            setStreamingMsgId(null);
          },
        },
        abortRef.current.signal,
        apiConfig.headers
      );
    },
    [
      activeId,
      activeConversation,
      conversations,
      isStreaming,
      selectedModel,
      settings,
      store,
      userScrolledUp,
    ],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setStreamingMsgId(null);
  }, []);

  const handleRegenerate = useCallback(
    (msgId: string) => {
      if (!activeConversation || isStreaming) return;
      const idx = activeConversation.messages.findIndex((m) => m.id === msgId);
      if (idx < 1) return;
      const userMsg = activeConversation.messages[idx - 1];
      store.deleteMessagesAfter(activeConversation.id, userMsg.id);
      const { content, images } = buildMessageContent(userMsg.content, []);
      setTimeout(() => {
        handleSend(content, []);
      }, 50);
    },
    [activeConversation, isStreaming, store, handleSend],
  );

  const handleEditMessage = useCallback(
    (msgId: string, newContent: string) => {
      if (!activeConversation) return;
      store.deleteMessagesAfter(activeConversation.id, msgId);
      setTimeout(() => handleSend(newContent, []), 50);
    },
    [activeConversation, store, handleSend],
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const { processFile } = await import("@/lib/file-utils");
      const processed = await Promise.all(files.map(processFile));
      setPendingFiles((prev) => [...prev, ...processed]);
    }
  };

  const handleTitleEdit = () => {
    if (!activeConversation) return;
    setTitleDraft(activeConversation.title);
    setEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (activeConversation && titleDraft.trim()) {
      store.updateConversation(activeConversation.id, {
        title: titleDraft.trim(),
      });
    }
    setEditingTitle(false);
  };

  const cycleTheme = () => {
    const next =
      settings.theme === "light"
        ? "dark"
        : settings.theme === "dark"
          ? "system"
          : "light";
    updateSettings({ theme: next });
  };

  const ThemeIcon =
    settings.theme === "dark"
      ? Moon
      : settings.theme === "light"
        ? Sun
        : Monitor;

  const messages = activeConversation?.messages ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handleNewChat();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setSettingsOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "L") {
        e.preventDefault();
        cycleTheme();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNewChat, cycleTheme]);

  return (
    <div
      className={`flex flex-col h-screen bg-background overflow-hidden ${fontSizeClass}`}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="chat-page"
    >
      {isDragging && (
        <div className="drag-overlay">
          <div className="text-center">
            <div className="text-2xl font-semibold text-primary mb-2">
              Drop files to attach
            </div>
            <div className="text-sm text-muted-foreground">
              Images, text files, and PDFs supported
            </div>
          </div>
        </div>
      )}

      <div
        className="flex items-center h-9 px-3 bg-sidebar border-b border-sidebar-border shrink-0"
        data-tauri-drag-region
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        data-testid="titlebar"
      >
        <div
          className="flex items-center gap-2"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {window.__TAURI__ && (
            <div className="flex items-center gap-1.5 mr-2">
              <button onClick={() => window.__TAURI__?.window.getCurrent().close()} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors" />
              <button onClick={() => window.__TAURI__?.window.getCurrent().minimize()} className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors" />
              <button onClick={() => window.__TAURI__?.window.getCurrent().toggleMaximize()} className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Toggle sidebar (Ctrl+B)"
            data-testid="button-toggle-sidebar"
          >
            <Menu size={16} />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center min-w-0 px-4">
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") setEditingTitle(false);
              }}
              className="text-sm font-medium text-foreground bg-transparent border-b border-primary outline-none text-center min-w-[120px] max-w-xs"
              style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
              data-testid="input-title"
            />
          ) : (
            <button
              onDoubleClick={handleTitleEdit}
              className="text-sm font-medium text-foreground truncate max-w-xs hover:text-foreground/80 transition-colors"
              title="Double-click to edit title"
              style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
              data-testid="text-conversation-title"
            >
              {activeConversation?.title ?? "Ollama Chat"}
            </button>
          )}
        </div>

        <div
          className="flex items-center gap-2"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {isCloudModel ? (
             <span className="flex items-center gap-1 text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full font-medium">☁ Cloud</span>
           ) : (
             <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">⚡ Local</span>
          )}

          {activeConversation && (
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-sidebar-accent text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-export-menu"
              >
                <Download size={13} />
                <ChevronDown size={12} />
              </button>
              <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-popover-border rounded-xl shadow-lg py-1 z-50 hidden group-hover:block">
                <button
                  onClick={() => store.exportCurrentConversation("md")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-foreground transition-colors"
                  data-testid="button-export-md"
                >
                  <FileJson size={13} /> Export as Markdown
                </button>
                <button
                  onClick={() => store.exportCurrentConversation("json")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-foreground transition-colors"
                  data-testid="button-export-json"
                >
                  <FileJson size={13} /> Export as JSON
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setSystemPanelOpen((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${systemPanelOpen || activeConversation?.systemPrompt ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"}`}
            title="System prompt"
            data-testid="button-toggle-system"
          >
            <Terminal size={13} />
            <span>S</span>
            {activeConversation?.systemPrompt && (
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>

          <button
            onClick={cycleTheme}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Toggle theme (Ctrl+Shift+L)"
            data-testid="button-toggle-theme"
          >
            <ThemeIcon size={15} />
          </button>

          <button
            onClick={() => setModelInfoOpen(v => !v)}
            className={`p-1.5 rounded-md transition-colors ${modelInfoOpen ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"}`}
            title="Model info"
            data-testid="button-toggle-model-info"
          >
             <AlertTriangle size={15} className="rotate-180" />
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Settings (Ctrl+/)"
            data-testid="button-settings"
          >
            <SettingsIcon size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
          onDelete={store.deleteConversation}
          authState={authState}
          onSignIn={() => setSignInOpen(true)}
          onSignOut={signOut}
          onBrowseModels={() => setModelBrowserOpen(true)}
        />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {ollamaOffline && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm">
              <AlertTriangle size={15} />
              <span>
                Ollama is not running. Start it with{" "}
                <code className="font-mono text-xs bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                  ollama serve
                </code>
              </span>
              <button
                onClick={loadModels}
                className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-xs transition-colors"
                data-testid="button-retry-connection"
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {activeConversation && (
            <SystemPromptPanel
              open={systemPanelOpen}
              value={activeConversation.systemPrompt}
              onChange={(v) =>
                store.updateConversation(activeConversation.id, {
                  systemPrompt: v,
                })
              }
              onClose={() => setSystemPanelOpen(false)}
            />
          )}

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto py-4"
            onScroll={handleScroll}
            data-testid="messages-container"
          >
            {messages.length === 0 ? (
              <EmptyState
                onSuggestion={(text) => {
                  if (!activeId) {
                    store.createConversation(
                      selectedModel || models[0]?.name || "",
                      "",
                    );
                  }
                  setTimeout(() => handleSend(text, []), 50);
                }}
              />
            ) : (
              <div className="flex flex-col gap-3 max-w-3xl mx-auto w-full">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isStreaming={isStreaming && msg.id === streamingMsgId}
                    onRegenerate={
                      msg.role === "assistant"
                        ? () => handleRegenerate(msg.id)
                        : undefined
                    }
                    onEdit={
                      msg.role === "user"
                        ? (newContent) => handleEditMessage(msg.id, newContent)
                        : undefined
                    }
                    onFeedback={
                      msg.role === "assistant"
                        ? (f) =>
                            store.updateMessage(activeId!, msg.id, {
                              feedback: f,
                            })
                        : undefined
                    }
                    onImageClick={setLightboxSrc}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {userScrolledUp && messages.length > 0 && (
            <div className="flex justify-center pb-2">
              <button
                onClick={() => {
                  setUserScrolledUp(false);
                  scrollToBottom(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-sm"
                data-testid="button-scroll-to-bottom"
              >
                <ChevronDown size={14} /> Scroll to bottom
              </button>
            </div>
          )}

          <InputArea
            disabled={ollamaOffline}
            isStreaming={isStreaming}
            models={models}
            selectedModel={selectedModel}
            onModelChange={(m) => {
              setSelectedModel(m);
              if (activeId) store.updateConversation(activeId, { model: m });
            }}
            onSend={(text, attachments) => {
              const allAttachments = [...pendingFiles, ...attachments];
              setPendingFiles([]);
              handleSend(text, allAttachments);
            }}
            onStop={handleStop}
            sendOnEnter={settings.sendOnEnter}
            showTokenCount={settings.showTokenCount}
            onImageClick={setLightboxSrc}
            authState={authState}
            onBrowseModels={() => setModelBrowserOpen(true)}
            onSignIn={() => setSignInOpen(true)}
          />
        </div>
        
        <ModelInfoPanel
          open={modelInfoOpen}
          modelName={selectedModel}
          models={models}
          ollamaHost={settings.ollamaHost}
          onRefreshModels={loadModels}
          onModelChange={setSelectedModel}
        />
      </div>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={updateSettings}
        onExportAll={store.exportAllConversations}
        onClearAll={store.clearAllConversations}
      />

      <LightboxModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      
      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onCheckAuth={checkAuth}
        authState={authState}
      />
      
      <ModelBrowser
        open={modelBrowserOpen}
        onClose={() => setModelBrowserOpen(false)}
        localModels={models.filter(m => !m.name.includes(':cloud'))}
        onModelSelected={setSelectedModel}
        ollamaHost={settings.ollamaHost}
        onRefreshModels={loadModels}
      />
    </div>
  );
}
