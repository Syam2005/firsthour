'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiBase } from '../lib/api';

const SUGGESTIONS = [
  'https://github.com/expressjs/express',
  'https://github.com/facebook/react',
  'https://github.com/vercel/next.js',
  'https://github.com/fastapi/fastapi',
  'https://github.com/django/django',
  'https://github.com/vuejs/vue',
  'https://github.com/sveltejs/svelte',
  'https://github.com/nestjs/nest',
  'https://github.com/prisma/prisma',
  'https://github.com/supabase/supabase',
];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [ghResults, setGhResults] = useState([]);
  const fileRef = useRef();
  const inputRef = useRef();
  const dropdownRef = useRef();
  const router = useRouter();
  const BASE = apiBase();
  const debouncedUrl = useDebounce(url, 300);

  // Search GitHub repos as user types
  useEffect(() => {
    const q = debouncedUrl.trim();
    if (!q || q.length < 2) {
      setGhResults([]);
      // Show static suggestions when empty
      setSuggestions(q ? [] : SUGGESTIONS.slice(0, 6));
      setShowDropdown(!q ? false : false);
      return;
    }

    // Filter static list first
    const staticMatches = SUGGESTIONS.filter((s) =>
      s.toLowerCase().includes(q.toLowerCase())
    );

    // Query GitHub search API
    const controller = new AbortController();
    const encoded = encodeURIComponent(q.replace(/^https?:\/\/github\.com\//i, ''));
    fetch(`https://api.github.com/search/repositories?q=${encoded}&per_page=6&sort=stars`, {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      signal: controller.signal
    })
      .then((r) => r.json())
      .then((data) => {
        const hits = (data.items || []).map((r) => r.html_url);
        const combined = [...new Set([...staticMatches, ...hits])].slice(0, 8);
        setGhResults(combined);
        setSuggestions(combined);
        setShowDropdown(combined.length > 0);
        setActiveIdx(-1);
      })
      .catch(() => {
        setSuggestions(staticMatches);
        setShowDropdown(staticMatches.length > 0);
      });

    return () => controller.abort();
  }, [debouncedUrl]);

  function pickSuggestion(val) {
    setUrl(val);
    setShowDropdown(false);
    setActiveIdx(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIdx(-1);
    }
  }

  async function analyzeGitHub(e) {
    e.preventDefault();
    setShowDropdown(false);
    const val = url.trim();
    if (!val) { setError('Enter a GitHub repository URL or owner/name'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/analyze/github`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: val })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || `Error ${res.status}`); setLoading(false); return; }
      router.push(`/run/${data.id}`);
    } catch {
      setError('Cannot reach the server. Is the backend running?');
      setLoading(false);
    }
  }

  async function uploadZip(file) {
    if (!file) return;
    if (!file.name.endsWith('.zip')) { setError('Only .zip files are accepted'); return; }
    setError('');
    setLoading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch(`${BASE}/api/analyze/upload`, {
        method: 'POST',
        credentials: 'include',
        body: form
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || `Error ${res.status}`); setLoading(false); return; }
      router.push(`/run/${data.id}`);
    } catch {
      setError('Cannot reach the server. Is the backend running?');
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadZip(file);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="container" style={{ paddingTop: 48 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <RepositoryIcon />
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--navy)', marginTop: 16, marginBottom: 8, letterSpacing: '-0.5px' }}>
          Onboard any repository
        </h1>
        <p style={{ color: 'var(--muted)', maxWidth: 480, margin: '0 auto', fontSize: '1.05rem' }}>
          Paste a public GitHub URL or upload a zip. Get an architecture brief, setup checks, and five starter tasks in minutes.
        </p>
      </div>

      <div className="card">
        <form onSubmit={analyzeGitHub} autoComplete="off">
          <label htmlFor="repo-url" style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: 'var(--navy)' }}>
            GitHub repository URL
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="repo-url"
                ref={inputRef}
                type="text"
                placeholder="https://github.com/owner/repo"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (e.target.value.trim().length >= 1) setShowDropdown(true);
                }}
                onFocus={() => {
                  if (!url.trim()) {
                    setSuggestions(SUGGESTIONS.slice(0, 6));
                    setShowDropdown(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                aria-autocomplete="list"
                aria-controls="repo-suggestions"
                aria-activedescendant={activeIdx >= 0 ? `suggestion-${activeIdx}` : undefined}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn primary" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
                {loading ? 'Analyzing…' : 'Analyze'}
              </button>
            </div>

            {/* Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <ul
                id="repo-suggestions"
                ref={dropdownRef}
                role="listbox"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 200,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 6px 6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  listStyle: 'none',
                  margin: 0,
                  padding: '4px 0',
                  maxHeight: 280,
                  overflowY: 'auto'
                }}
              >
                {suggestions.map((s, i) => {
                  const label = s.replace(/^https?:\/\/github\.com\//i, '');
                  return (
                    <li
                      key={s}
                      id={`suggestion-${i}`}
                      role="option"
                      aria-selected={activeIdx === i}
                      onMouseDown={() => pickSuggestion(s)}
                      onMouseEnter={() => setActiveIdx(i)}
                      style={{
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: activeIdx === i ? 'var(--bg)' : 'transparent',
                        color: 'var(--text)'
                      }}
                    >
                      <RepoSmallIcon />
                      <span style={{ fontWeight: 500 }}>{label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: 6 }}>
            Or enter <code>owner/repo</code> shorthand. Public repositories only.
          </p>
        </form>

        <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--muted)', fontSize: '13px' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
          aria-label="Upload zip file"
          style={{
            border: `2px dashed ${dragging ? 'var(--teal)' : 'var(--border)'}`,
            borderRadius: '6px',
            padding: '28px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'color-mix(in srgb, var(--teal) 5%, var(--bg))' : 'var(--bg)',
            transition: 'border-color 0.15s, background 0.15s'
          }}
        >
          <UploadIcon />
          <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: '14px' }}>
            Drag & drop a <strong>.zip</strong> of a project folder, or click to browse
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: 4 }}>Maximum 15 MB</p>
        </div>
        <input ref={fileRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={(e) => uploadZip(e.target.files?.[0])} />

        {error && (
          <div role="alert" style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '5px', color: 'var(--error)', fontSize: '14px' }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { icon: '📋', title: 'Architecture brief', desc: 'What the code does, using real file paths' },
          { icon: '⚙️', title: 'Setup checks', desc: 'README, env vars, install commands — with conflict tags' },
          { icon: '✅', title: 'Starter tasks', desc: 'Five safe first changes, each with a proof step' }
        ].map((f) => (
          <div key={f.title} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ fontSize: '24px', marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--navy)' }}>{f.title}</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RepositoryIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ margin: '0 auto', display: 'block' }}>
      <rect x="8" y="6" width="48" height="52" rx="4" stroke="var(--navy)" strokeWidth="2" fill="var(--surface)"/>
      <rect x="8" y="6" width="48" height="12" rx="4" fill="var(--navy)" opacity="0.08"/>
      <circle cx="18" cy="12" r="2.5" fill="var(--teal)"/>
      <circle cx="26" cy="12" r="2.5" fill="var(--navy)" opacity="0.3"/>
      <circle cx="34" cy="12" r="2.5" fill="var(--navy)" opacity="0.3"/>
      <line x1="16" y1="26" x2="48" y2="26" stroke="var(--border)" strokeWidth="1.5"/>
      <line x1="16" y1="33" x2="40" y2="33" stroke="var(--border)" strokeWidth="1.5"/>
      <line x1="16" y1="40" x2="44" y2="40" stroke="var(--border)" strokeWidth="1.5"/>
      <line x1="16" y1="47" x2="36" y2="47" stroke="var(--border)" strokeWidth="1.5"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ margin: '0 auto', display: 'block' }}>
      <path d="M16 20V10M16 10L12 14M16 10L20 14" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 22H24" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function RepoSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.5 }}>
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Z" fill="var(--muted)"/>
    </svg>
  );
}
