'use client';
import { apiBase } from '../../lib/api';

export default function SignInPage() {
  const BASE = apiBase();
  return (
    <div className="container" style={{ maxWidth: 400, paddingTop: 80, textAlign: 'center' }}>
      <div className="card">
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Sign in</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: '14px' }}>
          Sign in to save your analysis history across sessions.
        </p>
        <a href={`${BASE}/api/auth/github/start`} className="btn primary" style={{ display: 'block', textAlign: 'center' }}>
          Continue with GitHub
        </a>
        <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: 16 }}>
          Public repositories can be analyzed without signing in. Signing in saves your history.
        </p>
      </div>
    </div>
  );
}
