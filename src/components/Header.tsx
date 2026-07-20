'use client';

import ThemeToggle from './ThemeToggle';
import TruncfixIcon from './icons/TruncfixIcon';

export default function Header() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
            <TruncfixIcon size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              truncfix
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5">
              Split large files. Avoid truncation.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
