'use client';

import React, { useEffect, useState } from 'react';

/**
 * Theme Toggle Component
 * 
 * Switches between light and dark mode
 * Persists preference to localStorage
 */

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    updateTheme(shouldBeDark);
  }, []);

  const updateTheme = (dark: boolean) => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    updateTheme(newIsDark);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-lg h-10 w-10 bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <svg
          className="w-5 h-5 text-amber-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm4.293 1.293a1 1 0 011.414 0l1.414 1.414a1 1 0 11-1.414 1.414L14.586 4.707a1 1 0 010-1.414zm2.828 2.828a1 1 0 011.414 0l1.414 1.414a1 1 0 11-1.414 1.414l-1.414-1.414a1 1 0 010-1.414zm.414 5.364a1 1 0 00-1.414 0l-1.414 1.414a1 1 0 101.414 1.414l1.414-1.414a1 1 0 000-1.414zm1.414 2.828a1 1 0 01-1.414 0l-1.414-1.414a1 1 0 011.414-1.414l1.414 1.414a1 1 0 010 1.414zM17 11a1 1 0 100-2h-2a1 1 0 100 2h2zm-7 4a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-1.414 1.414zm5.414 5.414a1 1 0 01-1.414 0L7.586 10a1 1 0 01.707-1.707h.586a1 1 0 01.707.293l1.414 1.414a1 1 0 010 1.414zM5 6a1 1 0 100-2H3a1 1 0 000 2h2zM3.464 5.05A1 1 0 102.05 6.464L3.464 5.05zm2.828 9.486A1 1 0 105.05 13.464l-1.414 1.414z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
