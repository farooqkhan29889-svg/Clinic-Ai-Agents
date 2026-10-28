import { useState, useEffect } from 'react';

const THEME_KEY = 'citycare_theme';

export function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) {
    return stored === 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return { isDark, toggleTheme };
}
