import { useState } from "react";
import {
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Check,
  X,
} from "lucide-react";
import type { Message, FileAttachment } from "@/lib/types";
import { MarkdownMessage } from "./MarkdownMessage";
import { FileChip } from "./FileChip";
import { formatRelativeTime } from "@/lib/time-utils";

interface Props {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  onFeedback?: (feedback: "up" | "down" | null) => void;
  onImageClick?: (src: string) => void;
}

export function MessageBubble({
  message,
  isStreaming,
  onRegenerate,
  onEdit,
  onFeedback,
  onImageClick,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditConfirm = () => {
    if (onEdit && editText.trim()) {
      onEdit(editText.trim());
    }
    setEditing(false);
  };

  const handleEditCancel = () => {
    setEditText(message.content);
    setEditing(false);
  };

  if (isUser) {
    return (
      <div
        className="flex justify-end group message-animate-in px-4 py-1 mb-4"
        data-testid={`message-user-${message.id}`}
      >
        <div className="flex flex-col items-end gap-1 max-w-[72%]">
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {message.attachments.map((att) => (
                <FileChip
                  key={att.id}
                  attachment={att}
                  readonly
                  onImageClick={onImageClick}
                />
              ))}
            </div>
          )}

          {editing ? (
            <div className="flex flex-col gap-2 w-full">
              <textarea
                className="w-full min-w-[280px] rounded-2xl bg-primary text-primary-foreground px-4 py-3 text-sm resize-none outline-none border-2 border-primary-border focus:ring-2 focus:ring-ring"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleEditConfirm();
                  }
                  if (e.key === "Escape") handleEditCancel();
                }}
                data-testid="input-message-edit"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleEditCancel}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  <X size={12} /> Cancel
                </button>
                <button
                  onClick={handleEditConfirm}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                >
                  <Check size={12} /> Submit
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="bg-primary text-primary-foreground rounded-[18px_18px_4px_18px] px-4 py-3 text-sm whitespace-pre-wrap shadow-sm">
                {message.content}
              </div>
              {!isStreaming && (
                <div className="absolute -bottom-7 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(message.createdAt)}
                  </span>
                  {onEdit && (
                    <button
                      onClick={() => setEditing(true)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
                      title="Edit message"
                      data-testid="button-edit-message"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex justify-start group message-animate-in px-4 py-2 mb-4"
      data-testid={`message-assistant-${message.id}`}
    >
      <div className="flex flex-col gap-1 max-w-[80%] min-w-0">
        <div className="text-foreground text-sm">
          {isStreaming && !message.content ? (
            <div className="flex items-center gap-1.5 py-2">
              <div className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
              <div className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
              <div className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
            </div>
          ) : (
            <MarkdownMessage
              content={message.content}
              isStreaming={isStreaming}
            />
          )}
        </div>

        {!isStreaming && (
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
            <span className="text-xs text-muted-foreground mr-2">
              {formatRelativeTime(message.createdAt)}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
              title="Copy message"
              data-testid="button-copy-message"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
                title="Regenerate"
                data-testid="button-regenerate"
              >
                <RefreshCw size={13} />
              </button>
            )}
            {onFeedback && (
              <>
                <button
                  onClick={() =>
                    onFeedback(message.feedback === "up" ? null : "up")
                  }
                  className={`p-1.5 rounded-md hover:bg-muted transition-colors text-xs ${message.feedback === "up" ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`}
                  title="Good response"
                  data-testid="button-thumbs-up"
                >
                  <ThumbsUp size={13} />
                </button>
                <button
                  onClick={() =>
                    onFeedback(message.feedback === "down" ? null : "down")
                  }
                  className={`p-1.5 rounded-md hover:bg-muted transition-colors text-xs ${message.feedback === "down" ? "text-red-500" : "text-muted-foreground hover:text-foreground"}`}
                  title="Bad response"
                  data-testid="button-thumbs-down"
                >
                  <ThumbsDown size={13} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
