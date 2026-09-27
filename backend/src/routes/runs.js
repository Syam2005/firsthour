const express = require('express');
const { dbQuery, getClient } = require('../db');
const { getJob } = require('../lib/pipeline');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Sign in to view runs' });
  }
  next();
}

// GET /api/runs — history for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await dbQuery((client) =>
      client
        .from('runs')
        .select('id, source, source_label, source_url, status, summary, created_at')
        .eq('user_id', req.session.userId)
        .order('created_at', { ascending: false })
        .limit(50)
    );
    res.json(rows || []);
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// GET /api/runs/:id
router.get('/:id', async (req, res) => {
  const runId = req.params.id;
  try {
    const rows = await dbQuery((client) =>
      client.from('runs').select('*').eq('id', runId).limit(1)
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Run not found' });
    }
    const row = rows[0];
    // If authenticated, check ownership — guests can see any run by ID
    if (req.session.userId && row.user_id && row.user_id !== req.session.userId) {
      return res.status(404).json({ error: 'Run not found' });
    }
    let result = null;
    try { result = row.result_json ? JSON.parse(row.result_json) : null; } catch {}
    res.json({
      id: row.id,
      source: row.source,
      sourceLabel: row.source_label,
      sourceUrl: row.source_url,
      status: row.status,
      summary: row.summary,
      createdAt: row.created_at,
      result
    });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// GET /api/runs/:id/events — SSE
router.get('/:id/events', (req, res) => {
  const runId = req.params.id;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN || 'http://localhost:3001');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.flushHeaders();

  const job = getJob(runId);
  if (!job) {
    // Check DB for completed run
    const client = getClient();
    client.from('runs').select('*').eq('id', runId).limit(1).then(({ data }) => {
      if (!data || data.length === 0) {
        res.write(`data: ${JSON.stringify({ type: 'error', detail: 'Run not found' })}\n\n`);
        return res.end();
      }
      const row = data[0];
      if (row.status === 'done') {
        let result = null;
        try { result = JSON.parse(row.result_json); } catch {}
        res.write(`data: ${JSON.stringify({ type: 'done', result })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', detail: row.summary || 'Analysis failed' })}\n\n`);
      }
      res.end();
    }).catch(() => {
      res.write(`data: ${JSON.stringify({ type: 'error', detail: 'Database error' })}\n\n`);
      res.end();
    });
    return;
  }

  // Replay buffered events
  for (const event of job.events) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }
  if (job.status !== 'running') {
    return res.end();
  }
  job.listeners.add(res);
  req.on('close', () => job.listeners.delete(res));
});

// PATCH /api/runs/:id/tasks/:taskId
router.patch('/:id/tasks/:taskId', async (req, res) => {
  const { id: runId, taskId } = req.params;
  const { status } = req.body || {};

  const VALID = ['todo', 'doing', 'done'];
  if (!VALID.includes(status)) {
    return res.status(400).json({ error: 'status must be todo, doing, or done' });
  }

  try {
    // Fetch run — allow guest runs (no user_id) and owned runs
    const query = req.session.userId
      ? (client) => client.from('runs').select('id, result_json, user_id')
          .eq('id', runId)
          .or(`user_id.eq.${req.session.userId},user_id.is.null`)
          .limit(1)
      : (client) => client.from('runs').select('id, result_json, user_id')
          .eq('id', runId).limit(1);

    const runs = await dbQuery(query);
    if (!runs || runs.length === 0) {
      return res.status(404).json({ error: 'Run not found' });
    }

    let result;
    try { result = JSON.parse(runs[0].result_json || '{}'); } catch { result = {}; }
    const tasks = Array.isArray(result.tasks) ? result.tasks : [];
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    // "done stays done"
    if (task.status === 'done' && status !== 'done') {
      return res.json({ id: taskId, status: 'done' });
    }
    task.status = status;

    await dbQuery((client) =>
      client.from('runs').update({ result_json: JSON.stringify(result) }).eq('id', runId)
    );
    res.json({ id: taskId, status });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// POST /api/runs/:id/checks
router.post('/:id/checks', async (req, res) => {
  const runId = req.params.id;
  try {
    const rows = await dbQuery((client) =>
      client.from('runs').select('result_json, status').eq('id', runId).limit(1)
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Run not found' });
    }
    const row = rows[0];
    if (row.status !== 'done') {
      return res.status(400).json({ error: 'Run is not complete' });
    }
    let result;
    try { result = JSON.parse(row.result_json || '{}'); } catch { result = {}; }
    const setup = Array.isArray(result.setup) ? result.setup : [];
    // Simulate check responses with 3s timeout signal
    const checks = setup.map((s) => ({
      label: s.label,
      ok: Boolean(s.ok),
      detail: s.detail || ''
    }));
    res.json({ checks });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// POST /api/runs/:id/chat
router.post('/:id/chat', async (req, res) => {
  const runId = req.params.id;
  const { message } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    const rows = await dbQuery((client) =>
      client.from('runs').select('result_json, summary').eq('id', runId).limit(1)
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Run not found' });
    }
    const row = rows[0];
    let result;
    try { result = JSON.parse(row.result_json || '{}'); } catch { result = {}; }

    const pack = JSON.stringify({
      summary: result.summary || row.summary,
      architecture: result.architecture,
      setup: result.setup,
      tasks: result.tasks,
      conflicts: result.conflicts
    });

    const { chat } = require('../lib/watsonx');
    const reply = await chat(message, pack);
    res.json({ reply });
  } catch (err) {
    const msg = err.message || 'Chat unavailable';
    if (msg.includes('timed out') || msg.includes('TimeoutError')) {
      return res.status(504).json({ error: 'Did not respond in time' });
    }
    if (msg.includes('429') || msg.includes('consumption_limit')) {
      return res.status(429).json({ error: 'watsonx rate limit reached — wait a moment and try again' });
    }
    res.status(503).json({ error: msg });
  }
});

module.exports = router;
