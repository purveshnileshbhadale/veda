'use client';

import { Sparkles } from 'lucide-react';

interface FooterProps {
  modeLabel: string;
}

export default function Footer({ modeLabel }: FooterProps) {
  return (
    <>
      <p className="text-[10px] text-white/15 text-center mt-2 font-mono">
        VEDA — {modeLabel} Mode
      </p>
      <footer className="border-t border-white/[0.02] bg-[#0d0d1a] shrink-0">
        <div className="mx-auto w-full md:max-w-3xl px-3 md:px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-sm">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-semibold bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                PURVESH NILESH BHADALE
              </span>
            </div>
            <div className="flex items-center gap-3 md:gap-4 text-[10px] text-white/25">
              <a href="tel:8421919113" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                8421919113
              </a>
              <a href="mailto:purveshnileshbhdale@gmail.com" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                purveshnileshbhdale@gmail.com
              </a>
            </div>
          </div>
          <div className="text-center mt-2 text-[9px] text-white/15 font-mono tracking-wider">
            &copy; {new Date().getFullYear()} PURVESH NILESH BHADALE &middot; ALL RIGHTS RESERVED
          </div>
        </div>
      </footer>
    </>
  );
}
