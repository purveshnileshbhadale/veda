'use client';

import { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface InputAreaProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export default function InputArea({
  value, onChange, onSend, placeholder, disabled, onKeyDown,
}: InputAreaProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
    onKeyDown?.(e);
  };

  return (
    <div className="border-t border-white/[0.02] bg-[#0d0d1a] shrink-0">
      <div className="mx-auto w-full md:max-w-3xl px-3 md:px-4 py-2 md:py-3">
        <div className="flex items-end gap-2 rounded-xl md:rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 md:px-4 py-2 md:py-3 focus-within:border-white/[0.12] transition-all">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-white/70 outline-none placeholder:text-white/15 resize-none py-0.5 max-h-32"
            disabled={disabled}
            rows={1}
          />
          <button
            onClick={onSend}
            disabled={!value.trim() || disabled}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/40 hover:bg-white/20 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
