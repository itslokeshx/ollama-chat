import { useRef, useState, useEffect, useCallback } from "react";
import {
  Paperclip,
  Send,
  Square,
  ChevronDown,
  AlertTriangle,
  Eye,
} from "lucide-react";
import type { FileAttachment, OllamaModel } from "@/lib/types";
import { isVisionModel } from "@/lib/types";
import { FileChip } from "./FileChip";
import { processFile } from "@/lib/file-utils";

interface Props {
  disabled?: boolean;
  isStreaming?: boolean;
  models: OllamaModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  onSend: (content: string, attachments: FileAttachment[]) => void;
  onStop: () => void;
  sendOnEnter: boolean;
  showTokenCount: boolean;
  onImageClick?: (src: string) => void;
}

export function InputArea({
  disabled,
  isStreaming,
  models,
  selectedModel,
  onModelChange,
  onSend,
  onStop,
  sendOnEnter,
  showTokenCount,
  onImageClick,
}: Props) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasImages = attachments.some((a) => a.type === "image");
  const visionCapable = isVisionModel(selectedModel);
  const showVisionWarning = hasImages && !visionCapable;

  const tokenEstimate = Math.ceil(
    (text.length + attachments.reduce((s, a) => s + a.content.length, 0)) / 4,
  );

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [text]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSend = useCallback(() => {
    if (!text.trim() && attachments.length === 0) return;
    if (isStreaming) return;
    onSend(text.trim(), attachments);
    setText("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, attachments, isStreaming, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (sendOnEnter && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((i) => i.type.startsWith("image/"));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        const att = await processFile(
          new File([file], "pasted-image.png", { type: file.type }),
        );
        setAttachments((prev) => [...prev, att]);
      }
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const processed = await Promise.all(arr.map(processFile));
    setAttachments((prev) => [...prev, ...processed]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const getModelDisplayName = (name: string) => {
    const parts = name.split(":");
    return parts[0];
  };

  const getParamSize = (model: OllamaModel) => {
    return model.details?.parameter_size ?? "";
  };

  const canSend = (text.trim() || attachments.length > 0) && !disabled;

  return (
    <div className="border-t border-border bg-background p-3">
      {showVisionWarning && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs">
          <AlertTriangle size={13} />
          This model may not support images. Consider switching to a
          vision-capable model.
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((att) => (
            <FileChip
              key={att.id}
              attachment={att}
              onRemove={removeAttachment}
              onImageClick={onImageClick}
            />
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Message Ollama..."
            rows={1}
            disabled={disabled}
            className="w-full resize-none rounded-xl border border-border bg-card text-foreground px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground disabled:opacity-50 transition-all"
            style={{ minHeight: "46px", maxHeight: "160px" }}
            data-testid="input-message"
          />
        </div>

        {isStreaming ? (
          <button
            onClick={onStop}
            className="shrink-0 w-10 h-10 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center justify-center transition-all active:scale-95"
            title="Stop generation"
            data-testid="button-stop"
          >
            <Square size={16} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="shrink-0 w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Send message"
            data-testid="button-send"
          >
            <Send size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 px-0.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs"
            title="Attach file"
            data-testid="button-attach"
          >
            <Paperclip size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.md,.py,.js,.ts,.jsx,.tsx,.json,.csv,.html,.css,.yaml,.yml,.toml,.sh,.rs,.go,.c,.cpp,.pdf"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            data-testid="input-file"
          />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowModelDropdown((v) => !v)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border"
              data-testid="button-model-selector"
            >
              {isVisionModel(selectedModel) && (
                <Eye size={12} className="text-blue-500" />
              )}
              <span className="max-w-[120px] truncate">
                {getModelDisplayName(selectedModel) || "Select model"}
              </span>
              <ChevronDown size={12} />
            </button>

            {showModelDropdown && (
              <div className="absolute bottom-full left-0 mb-1 w-64 bg-popover border border-popover-border rounded-xl shadow-lg py-1 z-50 max-h-80 overflow-y-auto flex flex-col">
                {models.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No models found
                  </div>
                ) : (
                  <>
                    {models.filter((m) => !m.name.includes(":cloud")).length >
                      0 && (
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 sticky top-0 backdrop-blur-md">
                        Local Models
                      </div>
                    )}
                    {models
                      .filter((m) => !m.name.includes(":cloud"))
                      .map((m) => (
                        <button
                          key={m.name}
                          onClick={() => {
                            onModelChange(m.name);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-accent transition-colors ${m.name === selectedModel ? "bg-accent" : ""}`}
                          data-testid={`model-option-${m.name}`}
                        >
                          <div className="flex items-center gap-2">
                            {isVisionModel(m.name) && (
                              <Eye size={11} className="text-blue-500" />
                            )}
                            <span className="font-medium text-foreground">
                              {m.name.split(":")[0]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {getParamSize(m) && (
                              <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs">
                                {getParamSize(m)}
                              </span>
                            )}
                            <span className="text-muted-foreground text-xs">
                              {m.details?.family ?? ""}
                            </span>
                          </div>
                        </button>
                      ))}

                    {models.filter((m) => m.name.includes(":cloud")).length >
                      0 && (
                      <div className="px-3 py-2 mt-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 sticky top-0 backdrop-blur-md">
                        Cloud Models
                      </div>
                    )}
                    {models
                      .filter((m) => m.name.includes(":cloud"))
                      .map((m) => (
                        <button
                          key={m.name}
                          onClick={() => {
                            onModelChange(m.name);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-accent transition-colors ${m.name === selectedModel ? "bg-accent" : ""}`}
                          data-testid={`model-option-${m.name}`}
                        >
                          <div className="flex items-center gap-2">
                            {isVisionModel(m.name) && (
                              <Eye size={11} className="text-blue-500" />
                            )}
                            <span className="font-medium text-foreground">
                              {m.name.split(":")[0]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {getParamSize(m) && (
                              <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs">
                                {getParamSize(m)}
                              </span>
                            )}
                            <span className="text-muted-foreground text-xs">
                              {m.details?.family ?? ""}
                            </span>
                          </div>
                        </button>
                      ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {showTokenCount && (
          <span className="text-xs text-muted-foreground">
            ~{tokenEstimate} tokens
          </span>
        )}
      </div>
    </div>
  );
}
