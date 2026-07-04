'use client';

import type { ModeConfig } from './types';

interface NavigationTabsProps {
  modes: ModeConfig[];
  active: string;
  onSelect: (id: string) => void;
}

export default function NavigationTabs({ modes, active, onSelect }: NavigationTabsProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.03] bg-[#0a0a16] overflow-x-auto scrollbar-thin shrink-0">
      <span className="text-[10px] text-white/20 font-mono mr-1 shrink-0 uppercase tracking-wider">Mode</span>
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
            active === m.id
              ? `bg-gradient-to-r ${m.color} text-white shadow-sm`
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <span className={active === m.id ? 'text-white' : 'text-white/30'}>{m.icon}</span>
          {m.label}
        </button>
      ))}
    </div>
  );
}
