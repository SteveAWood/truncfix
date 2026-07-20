'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('truncfix-theme');
    
    // Default to light mode unless user explicitly chose dark
    const shouldDark = stored === 'dark';
    
    setDark(shouldDark);
    document.documentElement.classList.toggle('dark', shouldDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('truncfix-theme', next ? 'dark' : 'light');
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        aria-label="Toggle dark mode"
      >
        Dark mode
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      aria-label="Toggle dark mode"
    >
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
