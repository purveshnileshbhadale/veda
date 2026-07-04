'use client';

import { useState } from 'react';
import { Plus, Search, MessageSquare, Trash2, Settings } from 'lucide-react';
import type { Conversation } from './types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  conversations, activeId, searchQuery, onSearchChange,
  onNewChat, onSelect, onDelete, onOpenSettings,
  isMobile, onCloseMobile,
}: SidebarProps) {
  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (id: string) => {
    onSelect(id);
    onCloseMobile?.();
  };

  return (
    <aside className="flex flex-col h-full bg-[#090912]">
      <div className="p-3">
        <button
          onClick={() => { onNewChat(); onCloseMobile?.(); }}
          className="flex w-full items-center gap-2 rounded-xl border border-white/[0.06] px-3 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div className="px-2 pb-1">
        <div className="relative">
          <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/15" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full h-7 rounded-lg bg-white/[0.04] border border-white/[0.04] pl-7 pr-2 text-xs text-white/50 outline-none placeholder:text-white/15 focus:border-white/[0.1] transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {filtered.length === 0 ? (
          <p className="text-[10px] text-white/15 text-center pt-4">No conversations found</p>
        ) : filtered.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-sm cursor-pointer transition-colors ${
              c.id === activeId
                ? 'bg-white/[0.07] text-white'
                : 'text-white/40 hover:bg-white/[0.03] hover:text-white/70'
            }`}
            onClick={() => handleSelect(c.id)}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate flex-1">{c.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-white/[0.03]">
        <button
          onClick={() => { onOpenSettings(); onCloseMobile?.(); }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors"
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </button>

        <div className="mt-3 flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400">
            <span className="text-[9px] font-bold text-white">PB</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-white/60 truncate">PURVESH NILESH BHADALE</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
