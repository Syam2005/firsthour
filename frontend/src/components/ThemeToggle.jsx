'use client';
import { useState, useEffect } from 'react';
import { getTheme, setTheme } from '../lib/theme';

const OPTIONS = ['light', 'dark', 'system'];
const LABELS = { light: 'Light', dark: 'Dark', system: 'System' };

export default function ThemeToggle() {
  const [current, setCurrent] = useState('system');
  useEffect(() => { setCurrent(getTheme()); }, []);
  function handleKey(e, val) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(val); }
  }
  function pick(val) {
    setTheme(val);
    setCurrent(val);
  }
  return (
    <div role="group" aria-label="Theme" style={{ display: 'flex', gap: '4px' }}>
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => pick(opt)}
          onKeyDown={(e) => handleKey(e, opt)}
          aria-pressed={current === opt}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            background: current === opt ? 'var(--navy)' : 'var(--surface)',
            color: current === opt ? '#fff' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'inherit'
          }}
        >
          {LABELS[opt]}
        </button>
      ))}
    </div>
  );
}
