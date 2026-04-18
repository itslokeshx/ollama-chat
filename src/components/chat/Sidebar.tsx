import { useState } from 'react';
import { Plus, Search, Trash2, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import type { Conversation } from '@/lib/types';
import { groupConversationsByDate, formatRelativeTime } from '@/lib/time-utils';

interface Props {
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
}

export function Sidebar({ open, conversations, activeId, onSelect, onNewChat, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = search.trim()
    ? conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const groups = groupConversationsByDate(filtered as { updatedAt: number; [key: string]: unknown }[]) as {
    label: string;
    items: Conversation[];
  }[];

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 2500);
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out overflow-hidden ${open ? 'w-60' : 'w-0'}`}
      style={{ minWidth: open ? '240px' : '0px', maxWidth: open ? '240px' : '0px' }}
      data-testid="sidebar"
    >
      <div className="flex flex-col h-full w-60 overflow-hidden">
        <div className="p-3 pt-2 flex flex-col gap-2">
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-transparent border border-sidebar-border hover:bg-sidebar-accent text-sidebar-foreground text-sm font-medium transition-colors active:scale-[0.97]"
            data-testid="button-new-chat"
          >
            <Plus size={16} />
            New chat
          </button>

          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              data-testid="input-search-chats"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {groups.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              {search ? 'No results' : 'No conversations yet'}
            </div>
          )}

          {groups.map((group) => (
            <div key={group.label} className="mb-2">
              <button
                className="flex items-center gap-1 w-full px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                onClick={() => setCollapsed((c) => ({ ...c, [group.label]: !c[group.label] }))}
              >
                {collapsed[group.label] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                {group.label}
              </button>

              {!collapsed[group.label] && (
                <div className="space-y-0.5">
                  {group.items.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group relative flex items-start gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                        activeId === conv.id
                          ? 'bg-sidebar-accent border-l-2 border-primary text-sidebar-foreground'
                          : 'hover:bg-sidebar-accent/60 text-sidebar-foreground border-l-2 border-transparent'
                      }`}
                      onClick={() => onSelect(conv.id)}
                      data-testid={`conv-item-${conv.id}`}
                    >
                      <MessageSquare size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{conv.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                            {conv.model.split(':')[0]}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(conv.updatedAt)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        className={`shrink-0 p-1 rounded transition-all ${
                          deleteConfirm === conv.id
                            ? 'opacity-100 text-destructive'
                            : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive'
                        }`}
                        title={deleteConfirm === conv.id ? 'Click again to confirm' : 'Delete'}
                        data-testid={`button-delete-conv-${conv.id}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-sidebar-border">
          <span className="text-xs text-muted-foreground">Ollama Chat v1.0</span>
        </div>
      </div>
    </div>
  );
}
