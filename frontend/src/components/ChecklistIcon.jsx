export default function ChecklistIcon({ progress = 0, size = 32 }) {
  const pct = Math.min(Math.max(progress, 0), 1);
  const r = 12;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={`${Math.round(pct * 100)}% complete`} role="img">
      <circle cx="16" cy="16" r={r} stroke="var(--border)" strokeWidth="2.5" />
      <circle
        cx="16" cy="16" r={r}
        stroke="var(--teal)"
        strokeWidth="2.5"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 16 16)"
        style={{ transition: 'stroke-dashoffset 0.4s' }}
      />
      <polyline points="10,16 14,20 22,12" stroke={pct === 1 ? 'var(--teal)' : 'var(--border)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
