import { X, FileText, FileCode, FileType } from 'lucide-react';
import type { FileAttachment } from '@/lib/types';
import { formatFileSize } from '@/lib/file-utils';

interface Props {
  attachment: FileAttachment;
  onRemove?: (id: string) => void;
  readonly?: boolean;
  onImageClick?: (src: string) => void;
}

export function FileChip({ attachment, onRemove, readonly, onImageClick }: Props) {
  if (attachment.type === 'image' && attachment.thumbnailUrl) {
    return (
      <div className="relative group inline-flex items-center gap-1.5 bg-muted border border-border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => onImageClick?.(attachment.thumbnailUrl!)}
          className="block"
          data-testid={`chip-image-${attachment.id}`}
        >
          <img
            src={attachment.thumbnailUrl}
            alt={attachment.name}
            className="w-10 h-10 object-cover"
          />
        </button>
        <div className="pr-2 pl-1 flex flex-col min-w-0">
          <span className="text-xs text-foreground truncate max-w-[80px]" title={attachment.name}>
            {attachment.name}
          </span>
          <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
        </div>
        {!readonly && onRemove && (
          <button
            onClick={() => onRemove(attachment.id)}
            className="absolute top-0.5 right-0.5 w-4 h-4 bg-foreground/80 rounded-full flex items-center justify-center text-background hover:bg-foreground transition-colors"
            data-testid={`button-remove-${attachment.id}`}
          >
            <X size={10} />
          </button>
        )}
      </div>
    );
  }

  const Icon = attachment.type === 'pdf' ? FileType : attachment.mimeType.includes('json') || attachment.mimeType.includes('javascript') ? FileCode : FileText;
  const iconColor = attachment.type === 'pdf' ? 'text-red-400' : 'text-blue-400';

  return (
    <div
      className="inline-flex items-center gap-1.5 bg-muted border border-border rounded-lg px-2.5 py-1.5 max-w-[180px]"
      data-testid={`chip-file-${attachment.id}`}
    >
      <Icon size={14} className={iconColor} />
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-foreground truncate" title={attachment.name}>
          {attachment.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {attachment.type === 'pdf' && attachment.pageCount
            ? `${attachment.pageCount}p · ${formatFileSize(attachment.size)}`
            : formatFileSize(attachment.size)}
        </span>
      </div>
      {!readonly && onRemove && (
        <button
          onClick={() => onRemove(attachment.id)}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
          data-testid={`button-remove-${attachment.id}`}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
