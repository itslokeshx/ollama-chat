import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SYSTEM_PROMPT_PRESETS } from '@/lib/types';

interface Props {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}

export function SystemPromptPanel({ open, value, onChange, onClose }: Props) {
  const [draft, setDraft] = useState(value);
  const [preset, setPreset] = useState('default');

  const handleApply = () => {
    onChange(draft);
    onClose();
  };

  const handlePresetChange = (id: string) => {
    setPreset(id);
    const found = SYSTEM_PROMPT_PRESETS.find((p) => p.id === id);
    if (found) setDraft(found.prompt);
  };

  if (!open) return null;

  return (
    <div className="border-b border-border bg-card px-4 py-3 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">System prompt</span>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-close-system-panel"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="flex gap-2 mb-2">
        <select
          value={preset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="text-xs border border-border rounded-lg px-2 py-1.5 bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          data-testid="select-system-preset"
        >
          {SYSTEM_PROMPT_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Enter a custom system prompt..."
        rows={3}
        className="w-full resize-none text-sm border border-border rounded-xl bg-muted px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        data-testid="input-system-prompt"
      />

      <div className="flex justify-end mt-2">
        <button
          onClick={handleApply}
          className="px-4 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.97]"
          data-testid="button-apply-system-prompt"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
