'use client';
import { useState } from 'react';
import { apiBase } from '../lib/api';
import ChecklistIcon from './ChecklistIcon';

export default function BriefView({ runId, result }) {
  const [tasks, setTasks] = useState(result.tasks || []);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [checks, setChecks] = useState(result.setup || []);
  const [checksLoading, setChecksLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const BASE = apiBase();

  const brief = result.summaryBrief || {};
  const conflicts = result.conflicts || [];

  async function patchTask(taskId, status) {
    try {
      const res = await fetch(`${BASE}/api/runs/${runId}/tasks/${taskId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status } : t));
      }
    } catch {}
  }

  async function runChecks() {
    setChecksLoading(true);
    try {
      const res = await fetch(`${BASE}/api/runs/${runId}/checks`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setChecks(data.checks || []);
      }
    } catch {}
    setChecksLoading(false);
  }

  async function sendChat(e) {
    e.preventDefault();
    if (!chatMsg.trim() || chatLoading) return;
    const msg = chatMsg.trim();
    setChatHistory((h) => [...h, { role: 'user', text: msg }]);
    setChatMsg('');
    setChatLoading(true);
    try {
      const res = await fetch(`${BASE}/api/runs/${runId}/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      if (res.ok) {
        setChatHistory((h) => [...h, { role: 'assistant', text: data.reply }]);
      } else if (res.status === 504) {
        setChatHistory((h) => [...h, { role: 'error', text: 'Did not respond in time' }]);
      } else {
        setChatHistory((h) => [...h, { role: 'error', text: data.error || 'Chat unavailable' }]);
      }
    } catch {
      setChatHistory((h) => [...h, { role: 'error', text: 'Cannot reach the server' }]);
    }
    setChatLoading(false);
  }

  function copyCmd(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const setupOk = checks.filter((c) => c.ok).length;

  return (
    <div className="container">
      {/* Summary */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {result.source === 'upload' ? '📁 Upload' : '📦 GitHub'} · {result.language || 'Unknown'} · {result.fileCount || 0} files
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy)', marginTop: 4 }}>
              {result.repo || result.sourceLabel}
            </h1>
          </div>
          {result.url && <a href={result.url} target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: '13px' }}>View on GitHub</a>}
        </div>
        <p style={{ color: 'var(--text)', lineHeight: 1.7 }}>{brief.what || result.summary}</p>
        {conflicts.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {conflicts.map((c, i) => (
              <span key={i} className={`badge ${c.tag === 'conflict' ? 'conflict' : c.tag === 'from code' ? 'from-code' : 'from-docs'}`} style={{ marginRight: 6, marginBottom: 4 }}>
                {c.tag}: {c.note}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 60-min timeline */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 14 }}>60-minute first hour</h2>
        {[
          { time: '0–10 min', label: 'Read this brief', icon: '📖' },
          { time: '10–25 min', label: brief.howToRun || 'Run the setup checks', icon: '⚙️' },
          { time: '25–45 min', label: brief.howBuilt || 'Explore the architecture', icon: '🗺️' },
          { time: '45–60 min', label: brief.firstTask ? `Start: ${brief.firstTask}` : 'Pick a starter task', icon: '✅' }
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ minWidth: 70, fontSize: '12px', color: 'var(--muted)', fontWeight: 500, paddingTop: 2 }}>{item.time}</div>
            <div style={{ fontSize: '15px' }}>{item.icon}</div>
            <div style={{ fontSize: '14px', color: 'var(--text)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Architecture */}
      {Array.isArray(result.architecture) && result.architecture.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 14 }}>Architecture</h2>
          {result.architecture.map((a, i) => (
            <div key={i} style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
              <span style={{ fontWeight: 600, minWidth: 120, color: 'var(--navy)', fontSize: '14px' }}>{a.name}</span>
              <span style={{ color: 'var(--text)', fontSize: '14px' }}>{a.detail}</span>
            </div>
          ))}
        </div>
      )}

      {/* File map */}
      {result.fileCount > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 14 }}>File map</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: 8 }}>{result.fileCount} files scanned{result.truncated ? ' (truncated)' : ''}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(result.topFolders || []).map(([folder, count]) => (
              <span key={folder} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '3px 8px', fontSize: '13px', color: 'var(--muted)' }}>
                {folder} <strong style={{ color: 'var(--text)' }}>{count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pitfalls */}
      {Array.isArray(result.pitfalls) && result.pitfalls.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 14 }}>First-day pitfalls</h2>
          {result.pitfalls.map((p, i) => (
            <div key={i} style={{ marginBottom: 10, paddingLeft: 12, borderLeft: '3px solid var(--warning)' }}>
              <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text)' }}>{p.issue}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{p.fix}</div>
            </div>
          ))}
        </div>
      )}

      {/* Setup checks */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)' }}>Setup checks {setupOk}/{checks.length}</h2>
          <button className="btn" onClick={runChecks} disabled={checksLoading} style={{ fontSize: '13px' }}>
            {checksLoading ? 'Running…' : 'Re-run checks'}
          </button>
        </div>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: '16px', lineHeight: 1.4, flexShrink: 0 }}>{c.ok ? '✅' : '❌'}</span>
            <div>
              <div style={{ fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {c.label}
                {c.tag && <span className={`badge ${c.tag === 'conflict' ? 'conflict' : c.tag === 'from code' ? 'from-code' : 'from-docs'}`}>{c.tag}</span>}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{c.detail}</div>
            </div>
          </div>
        ))}

        {/* Copyable setup commands */}
        {result.document?.envVarsFound?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: 8, color: 'var(--navy)' }}>Environment variables found in code</div>
            <pre style={{ fontSize: '13px' }}>
              {result.document.envVarsFound.map((v) => `${v}=`).join('\n')}
              <button
                onClick={() => copyCmd(result.document.envVarsFound.map((v) => `${v}=`).join('\n'), 'env')}
                style={{ position: 'absolute', top: 8, right: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', color: 'var(--muted)' }}
              >
                {copied === 'env' ? 'Copied!' : 'Copy'}
              </button>
            </pre>
          </div>
        )}
      </div>

      {/* Starter tasks */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)' }}>
            Starter tasks <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{doneCount}/{tasks.length} done</span>
          </h2>
          <ChecklistIcon progress={doneCount / Math.max(tasks.length, 1)} />
        </div>
        {tasks.map((task) => (
          <div key={task.id} style={{
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '14px',
            marginBottom: 10,
            opacity: task.status === 'done' ? 0.7 : 1,
            background: task.status === 'done' ? 'color-mix(in srgb, var(--success) 5%, var(--surface))' : 'var(--surface)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {task.title}
                  {!task.verified && <span className="badge" title="File path could not be verified in the tree" style={{ fontSize: '11px' }}>unverified</span>}
                  <span className="badge">{task.difficulty}</span>
                  <span className="badge">{task.minutes} min</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 4 }}>
                  <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: '3px' }}>{task.file}</code> · {task.why}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)' }}>
                  <strong>Proof:</strong> {task.proof}
                </div>
              </div>
              <div role="group" aria-label={`Task status: ${task.title}`} style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {['todo', 'doing', 'done'].map((s) => (
                  <button
                    key={s}
                    onClick={() => patchTask(task.id, s)}
                    aria-pressed={task.status === s}
                    className="btn"
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      background: task.status === s ? 'var(--navy)' : 'var(--surface)',
                      color: task.status === s ? '#fff' : 'var(--muted)',
                      borderColor: task.status === s ? 'var(--navy)' : 'var(--border)'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Onboarding checklist */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 14 }}>Onboarding checklist</h2>
        {[
          { label: 'Pack ready', done: true, desc: 'Architecture brief generated' },
          { label: 'Setup passed', done: setupOk === checks.length && checks.length > 0, desc: `${setupOk}/${checks.length} checks green` },
          { label: 'First task chosen', done: tasks.some((t) => t.status === 'doing' || t.status === 'done'), desc: 'Mark a task as doing or done' }
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: '16px' }}>{item.done ? '✅' : '⬜'}</span>
            <div>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.label}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 14 }}>Ask about this project</h2>
        <div style={{ minHeight: chatHistory.length ? 80 : 0, maxHeight: 320, overflowY: 'auto', marginBottom: 12 }}>
          {chatHistory.map((msg, i) => (
            <div key={i} style={{
              marginBottom: 10,
              padding: '10px 12px',
              borderRadius: '5px',
              fontSize: '14px',
              background: msg.role === 'user' ? 'var(--bg)' : msg.role === 'error' ? '#fef2f2' : 'color-mix(in srgb, var(--teal) 8%, var(--surface))',
              color: msg.role === 'error' ? 'var(--error)' : 'var(--text)',
              textAlign: msg.role === 'user' ? 'right' : 'left',
              border: '1px solid var(--border)'
            }}>
              {msg.text}
            </div>
          ))}
          {chatLoading && <div style={{ color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic' }}>Thinking…</div>}
        </div>
        <form onSubmit={sendChat} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Ask something about this project…"
            value={chatMsg}
            onChange={(e) => setChatMsg(e.target.value)}
            disabled={chatLoading}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn primary" disabled={chatLoading || !chatMsg.trim()} style={{ whiteSpace: 'nowrap' }}>
            {chatLoading ? '…' : 'Send'}
          </button>
        </form>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 6 }}>
          Answers are based only on the project pack. Powered by IBM watsonx.ai.
        </p>
      </div>
    </div>
  );
}
