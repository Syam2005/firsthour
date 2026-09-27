'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiBase } from '../../../lib/api';
import BriefView from '../../../components/BriefView';

const AGENT_LABELS = {
  document: 'Document',
  architecture: 'Architecture',
  setup: 'Setup',
  pitfall: 'Pitfall',
  tasks: 'Starter Tasks',
  summary: 'Summary'
};

export default function RunPage() {
  const { id } = useParams();
  const [phase, setPhase] = useState('loading'); // loading | running | done | error
  const [agents, setAgents] = useState({});
  const [statusDetail, setStatusDetail] = useState('Reading the project…');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const esRef = useRef(null);
  const BASE = apiBase();

  useEffect(() => {
    if (!id) return;
    setPhase('running');
    const es = new EventSource(`${BASE}/api/runs/${id}/events`, { withCredentials: true });
    esRef.current = es;

    es.onmessage = (e) => {
      let evt;
      try { evt = JSON.parse(e.data); } catch { return; }

      if (evt.type === 'status') {
        setStatusDetail(evt.detail || '');
      } else if (evt.type === 'agent') {
        setAgents((prev) => ({ ...prev, [evt.agent]: { state: evt.state, detail: evt.detail } }));
      } else if (evt.type === 'done') {
        setResult(evt.result);
        setPhase('done');
        es.close();
      } else if (evt.type === 'error') {
        setErrorMsg(evt.detail || 'Analysis failed');
        setPhase('error');
        es.close();
      }
    };

    es.onerror = () => {
      setErrorMsg('Lost connection to the server. Try refreshing.');
      setPhase('error');
      es.close();
    };

    return () => es.close();
  }, [id, BASE]);

  if (phase === 'done' && result) {
    return <BriefView runId={id} result={result} />;
  }

  return (
    <div className="container">
      {phase === 'error' ? (
        <div className="card">
          <h2 style={{ color: 'var(--error)', marginBottom: 12 }}>Analysis failed</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>{errorMsg}</p>
          <a href="/" className="btn primary">Try another repository</a>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
              Analyzing repository
            </h1>
            <p style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spinner />
              {statusDetail}
            </p>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, color: 'var(--navy)' }}>Agent progress</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(AGENT_LABELS).map(([key, label]) => {
                const ag = agents[key];
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AgentDot state={ag?.state || 'pending'} />
                    <div>
                      <span style={{ fontWeight: 500, fontSize: '14px' }}>{label}</span>
                      {ag?.detail && <span style={{ color: 'var(--muted)', fontSize: '13px', marginLeft: 8 }}>{ag.detail}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AgentDot({ state }) {
  const colors = { pending: 'var(--border)', running: 'var(--teal)', done: 'var(--success)', error: 'var(--error)' };
  return (
    <div style={{
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: colors[state] || colors.pending,
      flexShrink: 0,
      boxShadow: state === 'running' ? '0 0 0 3px color-mix(in srgb, var(--teal) 25%, transparent)' : 'none'
    }} />
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite', display: 'inline' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle cx="8" cy="8" r="6" stroke="var(--border)" strokeWidth="2"/>
      <path d="M14 8a6 6 0 0 0-6-6" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
