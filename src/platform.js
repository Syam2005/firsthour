const crypto = require('crypto');
const express = require('express');
const path = require('path');
const { db } = require('./db');
const { parseRepo } = require('./repo');
const { loadGitHubRepo } = require('./github');
const { loadLocalRepo } = require('./localRepo');
const { runAgents } = require('./agents');
const { provider } = require('./llm');

const router = express.Router();
const jobs = new Map();
let running = 0;

function secret() {
  return process.env.SESSION_SECRET || 'firsthour-dev-secret';
}

function sign(value) {
  const mac = crypto.createHmac('sha256', secret()).update(value).digest('hex');
  return `${value}.${mac}`;
}

function readSession(req) {
  const header = req.headers.cookie || '';
  const pair = header.split(';').map((part) => part.trim()).find((part) => part.startsWith('firsthour='));
  if (!pair) return null;
  const token = decodeURIComponent(pair.slice('firsthour='.length));
  const split = token.lastIndexOf('.');
  if (split === -1) return null;
  const id = token.slice(0, split);
  const mac = token.slice(split + 1);
  const expected = crypto.createHmac('sha256', secret()).update(id).digest('hex');
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  return db.prepare('SELECT id, github_login, access_token FROM sessions WHERE id = ?').get(id) || null;
}

function setSessionCookie(res, id) {
  res.setHeader('Set-Cookie', `firsthour=${encodeURIComponent(sign(id))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'firsthour=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
}

function emit(job, event) {
  job.events.push(event);
  const line = `data: ${JSON.stringify(event)}\n\n`;
  for (const response of job.listeners) response.write(line);
}

function publicJob(row) {
  let result = null;
  try {
    result = row.result_json ? JSON.parse(row.result_json) : null;
  } catch {
    result = null;
  }
  return {
    id: row.id,
    repo: row.repo,
    status: row.status,
    summary: row.summary,
    source: row.source,
    createdAt: row.created_at,
    result
  };
}

async function execute(job, token) {
  running += 1;
  try {
    emit(job, { type: 'status', state: 'reading', detail: `Opening ${job.repo}` });
    const snapshot = job.local
      ? loadLocalRepo((detail) => emit(job, { type: 'status', state: 'reading', detail }))
      : await loadGitHubRepo(job.owner, job.name, token, (detail) => emit(job, { type: 'status', state: 'reading', detail }));

    emit(job, { type: 'status', state: 'agents', detail: 'Three agents are reading the repository in parallel' });
    const result = await runAgents(snapshot, (event) => emit(job, event));
    result.repo = snapshot.repo;
    result.url = snapshot.url;
    result.language = snapshot.language;
    result.fileCount = snapshot.files.length;

    db.prepare(`UPDATE analyses SET status = ?, summary = ?, source = ?, result_json = ? WHERE id = ?`)
      .run('done', result.summary, result.source, JSON.stringify(result), job.id);
    job.status = 'done';
    emit(job, { type: 'done', result });
  } catch (err) {
    const message = err.message || 'Onboarding failed';
    db.prepare(`UPDATE analyses SET status = ?, summary = ? WHERE id = ?`).run('error', message, job.id);
    job.status = 'error';
    emit(job, { type: 'error', detail: message });
  } finally {
    running -= 1;
    setTimeout(() => jobs.delete(job.id), 10 * 60 * 1000);
  }
}

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/platform.html'));
});

router.get('/api/me', (req, res) => {
  const session = readSession(req);
  res.json({
    login: session?.github_login || null,
    githubOAuth: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    llm: provider()
  });
});

router.get('/auth/github', (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(400).send('Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to .env, then restart.');
  }
  const state = crypto.randomBytes(16).toString('hex');
  res.setHeader('Set-Cookie', `firsthour_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`);
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', `http://localhost:${process.env.PORT || 3000}/auth/github/callback`);
  url.searchParams.set('scope', 'read:user');
  url.searchParams.set('state', state);
  res.redirect(url.toString());
});

router.get('/auth/github/callback', async (req, res) => {
  const stateCookie = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('firsthour_state='));
  const expected = stateCookie ? stateCookie.slice('firsthour_state='.length) : '';
  if (!req.query.code || !req.query.state || req.query.state !== expected) {
    return res.status(400).send('GitHub sign-in was interrupted. Start again from the home page.');
  }
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: req.query.code,
        redirect_uri: `http://localhost:${process.env.PORT || 3000}/auth/github/callback`
      })
    });
    const tokenPayload = await tokenResponse.json();
    if (!tokenPayload.access_token) {
      return res.status(401).send('GitHub did not return an access token.');
    }
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'FirstHour-Onboarding'
      },
      signal: AbortSignal.timeout(12000)
    });
    const user = await userResponse.json();
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO sessions (id, github_login, github_id, access_token) VALUES (?, ?, ?, ?)')
      .run(id, user.login || 'github-user', user.id || 0, tokenPayload.access_token);
    setSessionCookie(res, id);
    res.redirect('/');
  } catch (err) {
    res.status(504).send(err.name === 'TimeoutError' ? 'GitHub sign-in timed out.' : 'GitHub sign-in failed.');
  }
});

router.post('/auth/logout', (req, res) => {
  const session = readSession(req);
  if (session) db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id);
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/api/analyses', (req, res) => {
  const rows = db.prepare(`SELECT id, repo, status, summary, source, created_at FROM analyses ORDER BY created_at DESC LIMIT 12`).all();
  res.json(rows.map((row) => ({
    id: row.id,
    repo: row.repo,
    status: row.status,
    summary: row.summary,
    source: row.source,
    createdAt: row.created_at
  })));
});

router.get('/api/analyses/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM analyses WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Analysis not found' });
  res.json(publicJob(row));
});

router.post('/api/analyses', (req, res) => {
  if (running >= 2) {
    return res.status(429).json({ error: 'Two onboardings are already running. Wait for one to finish.' });
  }
  const raw = req.body?.repo;
  const local = raw === 'local/firsthour';
  let owner = '';
  let name = '';
  let full = 'local/firsthour';
  if (!local) {
    try {
      const parsed = parseRepo(raw);
      owner = parsed.owner;
      name = parsed.name;
      full = parsed.full;
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  }

  const id = crypto.randomUUID();
  db.prepare('INSERT INTO analyses (id, repo, status, summary, source) VALUES (?, ?, ?, ?, ?)')
    .run(id, full, 'running', 'Reading the repository', provider());
  const job = { id, repo: full, owner, name, local, status: 'running', events: [], listeners: new Set() };
  jobs.set(id, job);
  const session = readSession(req);
  execute(job, session?.access_token || process.env.GITHUB_TOKEN || '');
  res.status(202).json({ id, repo: full });
});

router.get('/api/analyses/:id/events', (req, res) => {
  const job = jobs.get(req.params.id);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!job) {
    const row = db.prepare('SELECT * FROM analyses WHERE id = ?').get(req.params.id);
    if (!row) {
      res.write(`data: ${JSON.stringify({ type: 'error', detail: 'Analysis not found' })}\n\n`);
      return res.end();
    }
    if (row.status === 'done') {
      res.write(`data: ${JSON.stringify({ type: 'done', result: JSON.parse(row.result_json) })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', detail: row.summary || 'Onboarding failed' })}\n\n`);
    }
    return res.end();
  }

  for (const event of job.events) res.write(`data: ${JSON.stringify(event)}\n\n`);
  if (job.status === 'running') job.listeners.add(res);
  else res.end();

  req.on('close', () => job.listeners.delete(res));
});

module.exports = router;
