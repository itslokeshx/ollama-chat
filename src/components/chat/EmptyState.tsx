import { BrainCog, Code, FileText, Feather } from 'lucide-react';

interface Props {
  onSuggestion: (text: string) => void;
}

const SUGGESTIONS = [
  {
    icon: BrainCog,
    title: 'Explain a concept',
    subtitle: 'Break down complex topics clearly',
    text: 'Explain how large language models work, in simple terms.',
  },
  {
    icon: Code,
    title: 'Write some code',
    subtitle: 'Get help with any programming task',
    text: 'Write a Python function to find all prime numbers up to N using the Sieve of Eratosthenes.',
  },
  {
    icon: FileText,
    title: 'Analyze a file',
    subtitle: 'Review code, documents, or data',
    text: 'I\'ll attach a file. Please review it and summarize the key points.',
  },
  {
    icon: Feather,
    title: 'Creative writing',
    subtitle: 'Stories, poems, scripts, and more',
    text: 'Write a short, atmospheric opening paragraph for a noir detective story set in a rainy city.',
  },
];

export function EmptyState({ onSuggestion }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      <div className="mb-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <BrainCog size={28} className="text-primary" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-1">Ollama Chat</h1>
        <p className="text-sm text-muted-foreground">Chat with your local AI models, privately.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            onClick={() => onSuggestion(s.text)}
            className="flex flex-col items-start gap-2 p-3.5 rounded-xl border border-border bg-card hover:bg-card/80 hover:border-primary/30 text-left transition-all active:scale-[0.97] group"
            data-testid={`suggestion-${s.title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <s.icon size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <div>
              <div className="text-sm font-medium text-foreground">{s.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.subtitle}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
