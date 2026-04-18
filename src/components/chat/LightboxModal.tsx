import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  src: string | null;
  onClose: () => void;
}

export function LightboxModal({ src, onClose }: Props) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="lightbox-modal"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        data-testid="button-close-lightbox"
      >
        <X size={20} />
      </button>
      <img
        src={src}
        alt="Full size preview"
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
        data-testid="lightbox-image"
      />
    </div>
  );
}
