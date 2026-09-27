'use client';
import { useEffect } from 'react';
import { getTheme, applyTheme } from '../lib/theme';

export default function ThemeProvider({ children }) {
  useEffect(() => {
    applyTheme(getTheme());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (getTheme() === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return children;
}
