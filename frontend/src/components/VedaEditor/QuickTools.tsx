'use client';

import type { ReactNode } from 'react';

interface QuickTool {
  icon: ReactNode;
  label: string;
  prompt: string;
}

interface QuickToolsProps {
  tools: QuickTool[];
  onToolClick: (prompt: string) => void;
}

export default function QuickTools({ tools, onToolClick }: QuickToolsProps) {
  if (!tools || tools.length === 0) return null;

  return (
    <div className="border-t border-white/[0.02] bg-[#0d0d1a] shrink-0">
      <div className="mx-auto w-full md:max-w-3xl px-3 md:px-4 pt-2 pb-1">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {tools.map((tool, i) => (
            <button
              key={i}
              onClick={() => onToolClick(tool.prompt)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors shrink-0 whitespace-nowrap"
            >
              {tool.icon}
              {tool.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
