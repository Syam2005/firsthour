'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, apiBase } from '../../lib/api';

const STATUS_COLOR = { done: 'var(--success)', error: 'var(--error)', running: 'var(--teal)' };
const SOURCE_ICON = { github: '📦', upload: '📁' };

export default function HistoryPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | github | upload
  const BASE = apiBase();

  useEffect(() => {
    apiFetch('/api/runs')
      .then((data) => { setRuns(data); setLoading(false); })
      .catch((err) => {
        setError(err.status === 401 ? 'sign-in' : 'server');
        setLoading(false);
      });
  }, []);

  const filtered = filter === 'all' ? runs : runs.filter((r) => r.source === filter);

  if (loading) return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', paddingTop: 48 }}>
        <Spinner /> Loading history…
      </div>
    </div>
  );

  if (error === 'sign-in') return (
    <div className="container" style={{ paddingTop: 48 }}>
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <LockIcon />
        <h2 style={{ color: 'var(--navy)', marginTop: 16, marginBottom: 8 }}>Sign in to view history</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: '14px' }}>
          Your analysis runs are saved to your account.
        </p>
        <a href={`${BASE}/api/auth/github/start`} className="btn primary">Sign in with GitHub</a>
      </div>
    </div>
  );

  if (error === 'server') return (
    <div className="container" style={{ paddingTop: 48 }}>
      <div className="card">
        <p style={{ color: 'var(--error)', marginBottom: 12 }}>Cannot reach the server. Is the backend running?</p>
        <button className="btn" onClick={() => window.location.reload()}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)' }}>Analysis history</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: 2 }}>
            {runs.length} run{runs.length !== 1 ? 's' : ''} saved to your account
          </p>
        </div>
        <Link href="/" className="btn primary">+ New analysis</Link>
      </div>

      {/* Filter tabs */}
      {runs.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          {['all', 'github', 'upload'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: filter === f ? 'var(--navy)' : 'var(--surface)',
                color: filter === f ? '#fff' : 'var(--muted)',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              {f === 'all' ? `All (${runs.length})` : f === 'github' ? `📦 GitHub (${runs.filter(r => r.source === 'github').length})` : `📁 Upload (${runs.filter(r => r.source === 'upload').length})`}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {runs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
          <EmptyIcon />
          <h2 style={{ color: 'var(--navy)', marginTop: 16, marginBottom: 8, fontSize: '1.1rem' }}>No analyses yet</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: '14px' }}>
            Paste a GitHub URL or upload a zip to get your first onboarding brief.
          </p>
          <Link href="/" className="btn primary">Analyze a repository</Link>
        </div>
      )}

      {/* Run list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((run) => (
          <Link key={run.id} href={`/run/${run.id}`} style={{ textDecoration: 'none' }}>
            <div
              className="card"
              style={{ cursor: 'pointer', padding: '16px 20px', marginBottom: 0, transition: 'border-color 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--teal)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '15px' }}>{SOURCE_ICON[run.source] || '📦'}</span>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {run.source_label}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {run.summary || 'Analysis in progress…'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: STATUS_COLOR[run.status] || 'var(--muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    {run.status}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {formatDate(run.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && runs.length > 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center', marginTop: 24 }}>
          No {filter} runs yet.
        </p>
      )}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <circle cx="8" cy="8" r="6" stroke="var(--border)" strokeWidth="2"/>
      <path d="M14 8a6 6 0 0 0-6-6" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto', display: 'block' }}>
      <rect x="10" y="22" width="28" height="20" rx="4" stroke="var(--border)" strokeWidth="2"/>
      <path d="M16 22v-6a8 8 0 0 1 16 0v6" stroke="var(--navy)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="24" cy="32" r="2.5" fill="var(--teal)"/>
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto', display: 'block' }}>
      <rect x="10" y="10" width="44" height="44" rx="6" stroke="var(--border)" strokeWidth="2"/>
      <line x1="20" y1="24" x2="44" y2="24" stroke="var(--border)" strokeWidth="1.5"/>
      <line x1="20" y1="32" x2="38" y2="32" stroke="var(--border)" strokeWidth="1.5"/>
      <line x1="20" y1="40" x2="42" y2="40" stroke="var(--border)" strokeWidth="1.5"/>
    </svg>
  );
}
