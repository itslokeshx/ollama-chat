import { useEffect, useRef, useState } from 'react';
import { renderMarkdown } from '@/lib/markdown';

interface Props {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

declare global {
  interface Window {
    copyCode: (btn: HTMLButtonElement) => void;
  }
}

if (typeof window !== 'undefined') {
  window.copyCode = (btn: HTMLButtonElement) => {
    const code = btn.getAttribute('data-code') ?? '';
    const decoded = code.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    navigator.clipboard.writeText(decoded).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
      btn.style.color = 'var(--color-primary, #3b82f6)';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.color = '';
      }, 2000);
    });
  };
}

export function MarkdownMessage({ content, isStreaming, className }: Props) {
  const [html, setHtml] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    renderMarkdown(content).then(setHtml);
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`prose prose-sm max-w-none dark:prose-invert ${className ?? ''} ${isStreaming ? 'typing-cursor' : ''}`}
      style={{ fontSize: '15px', lineHeight: '1.7' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
