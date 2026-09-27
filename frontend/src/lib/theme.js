const KEY = 'firsthour-theme';
const VALID = ['light', 'dark', 'system'];

export function getTheme() {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(KEY);
  return VALID.includes(stored) ? stored : 'system';
}

export function setTheme(value) {
  const v = VALID.includes(value) ? value : 'system';
  localStorage.setItem(KEY, v);
  applyTheme(v);
}

export function applyTheme(value) {
  const v = VALID.includes(value) ? value : 'system';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = v === 'dark' || (v === 'system' && prefersDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}
