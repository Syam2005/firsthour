'use client';
import { useState, useEffect } from 'react';
import { getTheme, setTheme } from '../../lib/theme';
import { apiFetch, apiBase } from '../../lib/api';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', desc: 'Always light background' },
  { value: 'dark',  label: 'Dark',  desc: 'Always dark background' },
  { value: 'system', label: 'System', desc: 'Follow OS preference' },
];

export default function SettingsPage() {
  const [currentTheme, setCurrentTheme] = useState('system');
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);
  const BASE = apiBase();

  useEffect(() => {
    setCurrentTheme(getTheme());
    apiFetch('/api/auth/me').then(({ user: u }) => setUser(u)).catch(() => {});
  }, []);

  function pickTheme(val) {
    setTheme(val);
    setCurrentTheme(val);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/';
  }

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Settings</h1>
      <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: 28 }}>Appearance and account preferences</p>

      {/* Theme */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 2 }}>Theme</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Saved in your browser as <code>firsthour-theme</code></p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {THEME_OPTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => pickTheme(value)}
              aria-pressed={currentTheme === value}
              style={{
                padding: '14px 10px',
                borderRadius: '7px',
                border: `2px solid ${currentTheme === value ? 'var(--navy)' : 'var(--border)'}`,
                background: currentTheme === value ? 'color-mix(in srgb, var(--navy) 8%, var(--surface))' : 'var(--surface)',
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s, background 0.15s'
              }}
            >
              <ThemePreview value={value} />
              <div style={{ fontWeight: currentTheme === value ? 700 : 500, fontSize: '14px', color: 'var(--navy)', marginTop: 8 }}>{label}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>{desc}</div>
            </button>
          ))}
        </div>
        {saved && (
          <p style={{ color: 'var(--success)', fontSize: '13px', marginTop: 10 }}>✓ Theme saved</p>
        )}
      </div>

      {/* Account */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 14 }}>Account</h2>
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
              {user.avatar
                ? <img src={user.avatar} alt={user.login} style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--border)' }} />
                : <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '18px' }}>
                    {user.login?.[0]?.toUpperCase()}
                  </div>
              }
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--navy)' }}>{user.login}</div>
                <a href={`https://github.com/${user.login}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: 'var(--teal)' }}>
                  github.com/{user.login}
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>Sign out</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Removes your session from this browser</div>
              </div>
              <button onClick={logout} className="btn" style={{ color: 'var(--error)', borderColor: 'var(--error)', fontSize: '13px' }}>
                Sign out
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>Not signed in</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Sign in to save analysis history across sessions</div>
            </div>
            <a href={`${BASE}/api/auth/github/start`} className="btn primary" style={{ fontSize: '13px' }}>
              Sign in with GitHub
            </a>
          </div>
        )}
      </div>

      {/* About */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 14 }}>About</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'AI model', value: process.env.NEXT_PUBLIC_WATSONX_MODEL || 'ibm/granite-4-h-small' },
            { label: 'Powered by', value: 'IBM watsonx.ai' },
            { label: 'Source', value: 'GitHub', link: 'https://github.com' },
          ].map(({ label, value, link }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '14px', color: 'var(--muted)' }}>{label}</span>
              {link
                ? <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: 'var(--teal)' }}>{value}</a>
                : <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{value}</span>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThemePreview({ value }) {
  const bg = value === 'dark' ? '#0E1621' : value === 'light' ? '#F4F1EA' : 'linear-gradient(135deg, #F4F1EA 50%, #0E1621 50%)';
  return (
    <div style={{
      width: '100%',
      height: 40,
      borderRadius: 5,
      background: bg,
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <div style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: value === 'dark' ? '#7FB9B3' : value === 'light' ? '#0F2744' : 'conic-gradient(#0F2744 50%, #7FB9B3 50%)'
      }} />
    </div>
  );
}
