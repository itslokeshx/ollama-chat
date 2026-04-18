let markedLoaded = false;
let hlLoaded = false;

async function loadMarked(): Promise<{
  parse: (md: string, opts?: Record<string, unknown>) => string;
  setOptions: (opts: Record<string, unknown>) => void;
}> {
  if (markedLoaded && (window as unknown as Record<string, unknown>).marked) {
    return (window as unknown as Record<string, unknown>).marked as ReturnType<typeof loadMarked> extends Promise<infer T> ? T : never;
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js';
    script.onload = () => { markedLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load marked'));
    document.head.appendChild(script);
  });
  return (window as unknown as Record<string, unknown>).marked as ReturnType<typeof loadMarked> extends Promise<infer T> ? T : never;
}

async function loadHighlightJs(): Promise<{
  highlight: (code: string, opts: { language: string }) => { value: string };
  highlightAuto: (code: string) => { value: string };
  getLanguage: (lang: string) => unknown;
}> {
  if (hlLoaded && (window as unknown as Record<string, unknown>).hljs) {
    return (window as unknown as Record<string, unknown>).hljs as ReturnType<typeof loadHighlightJs> extends Promise<infer T> ? T : never;
  }
  if (!document.querySelector('link[data-hljs]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
    link.setAttribute('data-hljs', 'light');
    document.head.appendChild(link);
    const linkDark = document.createElement('link');
    linkDark.rel = 'stylesheet';
    linkDark.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
    linkDark.setAttribute('data-hljs', 'dark');
    linkDark.media = '(prefers-color-scheme: dark)';
    document.head.appendChild(linkDark);
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
    script.onload = () => { hlLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load highlight.js'));
    document.head.appendChild(script);
  });
  return (window as unknown as Record<string, unknown>).hljs as ReturnType<typeof loadHighlightJs> extends Promise<infer T> ? T : never;
}

export async function renderMarkdown(text: string): Promise<string> {
  const [marked, hljs] = await Promise.all([loadMarked(), loadHighlightJs()]);

  (marked as unknown as { setOptions: (opts: Record<string, unknown>) => void }).setOptions({
    breaks: true,
    gfm: true,
    highlight: (code: string, lang: string) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch {}
      }
      return hljs.highlightAuto(code).value;
    },
  });

  let html = (marked as unknown as { parse: (s: string) => string }).parse(text);

  html = html.replace(
    /<pre><code class="language-([^"]*)">([\s\S]*?)<\/code><\/pre>/g,
    (_: string, lang: string, code: string) => {
      const escaped = code.replace(/"/g, '&quot;');
      return `<div class="code-block-wrapper" data-lang="${lang}" data-code="${escaped}">
        <div class="code-block-header">
          <span class="code-lang-label">${lang || 'code'}</span>
          <button class="code-copy-btn" data-code="${escaped}" onclick="copyCode(this)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
        </div>
        <pre><code class="hljs language-${lang}">${code}</code></pre>
      </div>`;
    }
  );

  html = html.replace(
    /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
    (_: string, code: string) => {
      const escaped = code.replace(/"/g, '&quot;');
      return `<div class="code-block-wrapper" data-lang="code">
        <div class="code-block-header">
          <span class="code-lang-label">code</span>
          <button class="code-copy-btn" data-code="${escaped}" onclick="copyCode(this)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
        </div>
        <pre><code class="hljs">${code}</code></pre>
      </div>`;
    }
  );

  return html;
}
