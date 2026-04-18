import type { FileAttachment } from '@/lib/types';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const TEXT_EXTENSIONS = [
  '.txt', '.md', '.py', '.js', '.ts', '.jsx', '.tsx', '.json', '.csv',
  '.html', '.css', '.yaml', '.yml', '.toml', '.sh', '.rs', '.go',
  '.c', '.cpp', '.h', '.java', '.rb', '.php', '.swift', '.kt',
];

function getFileType(file: File): 'image' | 'text' | 'pdf' {
  if (IMAGE_TYPES.includes(file.type)) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (TEXT_EXTENSIONS.includes(ext)) return 'text';
  return 'text';
}

function getCodeLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    py: 'python', js: 'javascript', ts: 'typescript',
    jsx: 'jsx', tsx: 'tsx', json: 'json', html: 'html',
    css: 'css', yaml: 'yaml', yml: 'yaml', toml: 'toml',
    sh: 'bash', rs: 'rust', go: 'go', c: 'c', cpp: 'cpp',
    h: 'c', java: 'java', rb: 'ruby', php: 'php',
    swift: 'swift', kt: 'kotlin', md: 'markdown',
  };
  return map[ext] ?? ext;
}

export async function processFile(file: File): Promise<FileAttachment> {
  const type = getFileType(file);

  if (type === 'image') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve({
          id: generateId(),
          name: file.name,
          type: 'image',
          mimeType: file.type,
          content: '',
          base64,
          size: file.size,
          thumbnailUrl: dataUrl,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (type === 'pdf') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const text = await extractPdfText(arrayBuffer, file.name);
          resolve({
            id: generateId(),
            name: file.name,
            type: 'pdf',
            mimeType: 'application/pdf',
            content: text.text,
            size: file.size,
            pageCount: text.pages,
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve({
        id: generateId(),
        name: file.name,
        type: 'text',
        mimeType: file.type || 'text/plain',
        content,
        size: file.size,
      });
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function extractPdfText(
  buffer: ArrayBuffer,
  filename: string
): Promise<{ text: string; pages: number }> {
  try {
    const pdfjsLib = await loadPdfJs();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = pdf.numPages;
    const textParts: string[] = [];

    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: { str: string }) => item.str)
        .join(' ');
      textParts.push(`[Page ${i}]\n${pageText}`);
    }

    return { text: textParts.join('\n\n'), pages };
  } catch {
    return { text: `[Could not extract text from ${filename}]`, pages: 0 };
  }
}

async function loadPdfJs(): Promise<{
  getDocument: (opts: { data: ArrayBuffer }) => { promise: Promise<{
    numPages: number;
    getPage: (n: number) => Promise<{
      getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
    }>;
  }> };
}> {
  if ((window as unknown as { pdfjsLib: unknown }).pdfjsLib) {
    return (window as unknown as { pdfjsLib: ReturnType<typeof loadPdfJs> extends Promise<infer T> ? T : never }).pdfjsLib;
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load pdf.js'));
    document.head.appendChild(script);
  });
  const lib = (window as unknown as { pdfjsLib: ReturnType<typeof loadPdfJs> extends Promise<infer T> ? T : never }).pdfjsLib;
  (lib as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  return lib;
}

export function buildMessageContent(
  text: string,
  attachments: FileAttachment[]
): { content: string; images: string[] } {
  const textAttachments = attachments.filter((a) => a.type === 'text' || a.type === 'pdf');
  const imageAttachments = attachments.filter((a) => a.type === 'image');

  let content = text;
  for (const att of textAttachments) {
    const lang = att.type === 'pdf' ? 'text' : getCodeLanguage(att.name);
    content += `\n\n[${att.name}]\n\`\`\`${lang}\n${att.content}\n\`\`\``;
  }

  const images = imageAttachments.map((a) => a.base64 ?? '').filter(Boolean);

  return { content: content.trim(), images };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
