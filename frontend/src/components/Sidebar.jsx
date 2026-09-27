'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiFetch } from '../lib/api';
import { getTheme, setTheme } from '../lib/theme';

const NAV = [
  { href: '/',         label: 'Home',     icon: HomeIcon },
  { href: '/history',  label: 'History',  icon: HistoryIcon },
  { href: '/profile',  label: 'Profile',  icon: ProfileIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [theme, setCurrentTheme] = useState('system');
  const pathname = usePathname();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    apiFetch('/api/auth/me').then((d) => setUser(d.user)).catch(() => {});
    setCurrentTheme(getTheme());
  }, []);

  function cycleTheme() {
    const order = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    setCurrentTheme(next);
  }

  function isActive(href) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/';
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
          <CompassIcon />
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--navy)', letterSpacing: '-0.3px' }}>
            FirstHour
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" role="navigation" aria-label="Main navigation"
        style={{ flex: 1, padding: '10px 10px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: '7px',
                fontSize: '13.5px',
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--navy)' : 'var(--muted)',
                textDecoration: 'none',
                background: active ? 'color-mix(in srgb, var(--navy) 8%, var(--bg))' : 'transparent',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon active={active} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom" style={{ padding: '14px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          title={`Theme: ${theme}. Click to cycle`}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: '7px', border: 'none',
            background: 'transparent', cursor: 'pointer', width: '100%',
            fontSize: '13px', color: 'var(--muted)', fontFamily: 'inherit',
            transition: 'background 0.12s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <ThemeIcon theme={theme} />
          <span style={{ textTransform: 'capitalize' }}>{theme} theme</span>
        </button>

        {/* User */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: '7px', background: 'var(--bg)' }}>
            {user.avatar
              ? <img src={user.avatar} alt={user.login} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border)', flexShrink: 0 }} />
              : <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                  {user.login?.[0]?.toUpperCase()}
                </div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.login}
              </div>
              <button onClick={logout} style={{ fontSize: '11px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <a
            href={`${API}/api/auth/github/start`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '8px 12px', borderRadius: '7px',
              background: 'var(--navy)', color: '#fff',
              textDecoration: 'none', fontSize: '13px', fontWeight: 500
            }}
          >
            <GitHubIcon />
            Sign in
          </a>
        )}
      </div>
    </aside>
  );
}

/* ── Icons ──────────────────────────────────────────────────── */

function CompassIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="var(--navy)" strokeWidth="1.6"/>
      <circle cx="12" cy="12" r="1.8" fill="var(--teal)"/>
      <polygon points="12,4 14.2,11 12,10.2 9.8,11" fill="var(--navy)"/>
      <polygon points="12,20 9.8,13 12,13.8 14.2,13" fill="var(--muted)" opacity="0.6"/>
    </svg>
  );
}

function HomeIcon({ active }) {
  const c = active ? 'var(--navy)' : 'var(--muted)';
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M2 8.5L10 2l8 6.5V18H13v-5H7v5H2V8.5Z" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}

function HistoryIcon({ active }) {
  const c = active ? 'var(--navy)' : 'var(--muted)';
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke={c} strokeWidth="1.4"/>
      <path d="M10 5.5V10l3 1.8" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ProfileIcon({ active }) {
  const c = active ? 'var(--navy)' : 'var(--muted)';
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="6.5" r="3.5" stroke={c} strokeWidth="1.4"/>
      <path d="M2.5 18c0-4 3.4-6.5 7.5-6.5S17.5 14 17.5 18" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function SettingsIcon({ active }) {
  const c = active ? 'var(--navy)' : 'var(--muted)';
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2.5" stroke={c} strokeWidth="1.4"/>
      <path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3M3.9 3.9l2.1 2.1M14 14l2.1 2.1M3.9 16.1l2.1-2.1M14 6l2.1-2.1" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function ThemeIcon({ theme }) {
  if (theme === 'dark') return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M17.5 11.5A7.5 7.5 0 0 1 8.5 2.5a7.5 7.5 0 1 0 9 9Z" stroke="var(--muted)" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
  if (theme === 'light') return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" stroke="var(--muted)" strokeWidth="1.4"/>
      <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.9 3.9l1.4 1.4M14.7 14.7l1.4 1.4M3.9 16.1l1.4-1.4M14.7 5.3l1.4-1.4" stroke="var(--muted)" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="var(--muted)" strokeWidth="1.4"/>
      <path d="M10 3v14" stroke="var(--muted)" strokeWidth="1.4"/>
      <path d="M10 3a7 7 0 0 1 0 14" fill="var(--muted)" opacity="0.25"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
    </svg>
  );
}
