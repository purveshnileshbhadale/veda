'use client';

import { Sparkles, Search } from 'lucide-react';
import type { ModeConfig } from './types';

interface EditorCanvasProps {
  mode: ModeConfig;
  onSuggestionClick: (text: string) => void;
}

export default function EditorCanvas({ mode, onSuggestionClick }: EditorCanvasProps) {
  const colors = [
    'from-indigo-500/[0.08] to-purple-500/[0.08]',
    'from-emerald-500/[0.08] to-teal-500/[0.08]',
    'from-amber-500/[0.08] to-orange-500/[0.08]',
    'from-rose-500/[0.08] to-pink-500/[0.08]',
  ];
  const borders = [
    'border-indigo-500/10',
    'border-emerald-500/10',
    'border-amber-500/10',
    'border-rose-500/10',
  ];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto w-full md:max-w-3xl px-3 md:px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh] md:min-h-[75vh] text-center px-2">
          {/* Mode Icon */}
          <div
            className={`flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg mb-4 md:mb-5 ${mode.color} ${mode.accent}`}
          >
            <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-white" />
          </div>

          {/* Heading */}
          <h1 className="text-lg md:text-xl font-semibold text-white/85 mb-1">{mode.label}</h1>
          <p className="text-xs md:text-sm text-white/35 mb-5 md:mb-7 max-w-md leading-relaxed">
            {mode.desc}
          </p>

          {/* Suggestion Cards */}
          <div className="grid gap-1.5 md:gap-2 w-full max-w-lg">
            {mode.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(s.text)}
                className={`flex items-center gap-3 rounded-xl border ${borders[i % 4]} ${colors[i % 4]} px-4 py-3 text-left text-sm text-white/60 hover:text-white hover:border-white/15 transition-all group`}
              >
                <Search className="h-4 w-4 text-white/20 group-hover:text-white/50 shrink-0" />
                <div className="text-left">
                  <span>{s.text}</span>
                  <div className="text-[10px] text-white/20 mt-0.5">{s.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
