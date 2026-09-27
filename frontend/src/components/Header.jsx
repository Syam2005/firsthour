'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiFetch } from '../lib/api';

const NAV_TABS = [
  { href: '/',         label: 'Home',     icon: HomeIcon },
  { href: '/history',  label: 'History',  icon: HistoryIcon },
  { href: '/profile',  label: 'Profile',  icon: ProfileIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Header() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    apiFetch('/api/auth/me').then((d) => setUser(d.user)).catch(() => {});
  }, []);

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Top bar: logo + auth */}
      <div style={{
        padding: '0 16px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '960px',
        margin: '0 auto',
        width: '100%'
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CompassIcon size={22} />
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--navy)', letterSpacing: '-0.3px' }}>
            FirstHour
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              {user.avatar && (
                <Link href="/profile">
                  <img
                    src={user.avatar}
                    alt={user.login}
                    title={user.login}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--border)', cursor: 'pointer', display: 'block' }}
                  />
                </Link>
              )}
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{user.login}</span>
            </>
          ) : (
            <a
              href={`${API}/api/auth/github/start`}
              style={{
                background: 'var(--navy)',
                color: '#fff',
                padding: '5px 14px',
                borderRadius: '5px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              Sign in with GitHub
            </a>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <nav
        role="navigation"
        aria-label="Main tabs"
        style={{
          display: 'flex',
          borderTop: '1px solid var(--border)',
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 8px'
        }}
      >
        {NAV_TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--navy)' : 'var(--muted)',
                textDecoration: 'none',
                borderBottom: active ? '2px solid var(--navy)' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon active={active} />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

/* ── Icons ─────────────────────────────────────────────────── */

function CompassIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="var(--navy)" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="1.5" fill="var(--teal)"/>
      <polygon points="12,4 14,11 12,10.5 10,11" fill="var(--navy)"/>
      <polygon points="12,20 10,13 12,13.5 14,13" fill="var(--muted)"/>
    </svg>
  );
}

function HomeIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1 6.5L8 1l7 5.5V15H10v-4H6v4H1V6.5Z"
        stroke={active ? 'var(--navy)' : 'var(--muted)'}
        strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function HistoryIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke={active ? 'var(--navy)' : 'var(--muted)'} strokeWidth="1.3"/>
      <path d="M8 4.5V8l2.5 1.5" stroke={active ? 'var(--navy)' : 'var(--muted)'} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.5" stroke={active ? 'var(--navy)' : 'var(--muted)'} strokeWidth="1.3"/>
      <path d="M2 13.5c0-3 2.7-5 6-5s6 2 6 5"
        stroke={active ? 'var(--navy)' : 'var(--muted)'} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function SettingsIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2" stroke={active ? 'var(--navy)' : 'var(--muted)'} strokeWidth="1.3"/>
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4"
        stroke={active ? 'var(--navy)' : 'var(--muted)'} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
