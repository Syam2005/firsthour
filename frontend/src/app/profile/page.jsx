'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, apiBase } from '../../lib/api';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const BASE = apiBase();

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(({ user: u }) => {
        setUser(u);
        if (u) {
          return apiFetch('/api/runs').then(setRuns).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/';
  }

  if (loading) return (
    <div className="container" style={{ paddingTop: 48, color: 'var(--muted)' }}>Loading…</div>
  );

  if (!user) return (
    <div className="container" style={{ paddingTop: 48, maxWidth: 440 }}>
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <AvatarPlaceholder letter="?" />
        <h2 style={{ color: 'var(--navy)', marginTop: 16, marginBottom: 8 }}>Not signed in</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: '14px' }}>
          Sign in with GitHub to save your analysis history.
        </p>
        <a href={`${BASE}/api/auth/github/start`} className="btn primary" style={{ display: 'block', textAlign: 'center' }}>
          Sign in with GitHub
        </a>
      </div>
    </div>
  );

  const done = runs.filter((r) => r.status === 'done').length;
  const github = runs.filter((r) => r.source === 'github').length;
  const upload = runs.filter((r) => r.source === 'upload').length;

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      {/* Profile card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        {user.avatar
          ? <img src={user.avatar} alt={user.login} style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
          : <AvatarPlaceholder letter={user.login?.[0]?.toUpperCase() || '?'} size={72} />
        }
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>
            {user.login}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: 12 }}>
            GitHub account · <a href={`https://github.com/${user.login}`} target="_blank" rel="noopener noreferrer">github.com/{user.login}</a>
          </p>
          <button onClick={logout} className="btn" style={{ fontSize: '13px', color: 'var(--error)', borderColor: 'var(--error)' }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total runs', value: runs.length, color: 'var(--navy)' },
          { label: 'Completed', value: done, color: 'var(--success)' },
          { label: 'GitHub repos', value: github, color: 'var(--teal)' },
          { label: 'Zip uploads', value: upload, color: 'var(--muted)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent runs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)' }}>Recent analyses</h2>
        <Link href="/history" style={{ fontSize: '13px', color: 'var(--teal)' }}>View all →</Link>
      </div>

      {runs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: '14px' }}>No analyses yet.</p>
          <Link href="/" className="btn primary">Analyze a repository</Link>
        </div>
      ) : (
        runs.slice(0, 5).map((run) => (
          <Link key={run.id} href={`/run/${run.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '14px 18px', marginBottom: 8, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--teal)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {run.source === 'github' ? '📦' : '📁'} {run.source_label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {run.summary || '—'}
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: run.status === 'done' ? 'var(--success)' : run.status === 'error' ? 'var(--error)' : 'var(--teal)', textTransform: 'uppercase' }}>
                    {run.status}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 2 }}>
                    {new Date(run.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))
      )}

      {/* Account section */}
      <div className="card" style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 14 }}>Account</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>GitHub login</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{user.login}</div>
          </div>
          <a href={`https://github.com/${user.login}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: '12px' }}>
            View on GitHub
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>Sign out</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Removes your session from this browser</div>
          </div>
          <button onClick={logout} className="btn" style={{ fontSize: '12px', color: 'var(--error)', borderColor: 'var(--error)' }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function AvatarPlaceholder({ letter, size = 72 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--navy)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, flexShrink: 0
    }}>
      {letter}
    </div>
  );
}
