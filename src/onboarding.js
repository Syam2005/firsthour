const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { db } = require('./db');

const router = express.Router();

const DB_PATH = process.env.DB_PATH || 'data/harbor.db';
const PORT = process.env.PORT || 3000;

const VALID_TASK_STATUSES = ['todo', 'doing', 'done'];

// ---------------------------------------------------------------------------
// Setup checks helpers
// ---------------------------------------------------------------------------

function checkNodeVersion() {
  try {
    const major = parseInt(process.versions.node.split('.')[0], 10);
    const ok = major >= 20;
    return { id: 'node_version', label: 'Node >= 20', ok, detail: `v${process.versions.node}` };
  } catch (err) {
    return { id: 'node_version', label: 'Node >= 20', ok: false, detail: err.message };
  }
}

function checkEnvFile() {
  try {
    const exists = fs.existsSync('.env');
    return { id: 'env_file', label: '.env file exists', ok: exists, detail: exists ? 'Found' : 'Not found' };
  } catch (err) {
    return { id: 'env_file', label: '.env file exists', ok: false, detail: err.message };
  }
}

function checkPortValid() {
  try {
    const port = parseInt(process.env.PORT, 10);
    const ok = Number.isInteger(port) && port >= 1024 && port <= 65535;
    return { id: 'port_valid', label: 'PORT is 1024–65535', ok, detail: ok ? String(port) : `Invalid: ${process.env.PORT}` };
  } catch (err) {
    return { id: 'port_valid', label: 'PORT is 1024–65535', ok: false, detail: err.message };
  }
}

function checkDbWritable() {
  try {
    const dir = path.dirname(DB_PATH);
    fs.accessSync(dir, fs.constants.W_OK);
    return { id: 'db_writable', label: 'DB_PATH parent is writable', ok: true, detail: dir };
  } catch (err) {
    return { id: 'db_writable', label: 'DB_PATH parent is writable', ok: false, detail: err.message };
  }
}

function checkHealthEndpoint() {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(
      `http://localhost:${PORT}/api/health`,
      { timeout: 3000 },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const elapsed = Date.now() - start;
            if (parsed.ok === true) {
              resolve({ id: 'health_check', label: 'GET /api/health < 3 s', ok: true, detail: `${elapsed} ms` });
            } else {
              resolve({ id: 'health_check', label: 'GET /api/health < 3 s', ok: false, detail: 'Responded but ok !== true' });
            }
          } catch {
            resolve({ id: 'health_check', label: 'GET /api/health < 3 s', ok: false, detail: 'Invalid JSON response' });
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ id: 'health_check', label: 'GET /api/health < 3 s', ok: false, detail: 'Orders API did not respond in time.' });
    });
    req.on('error', (err) => {
      resolve({ id: 'health_check', label: 'GET /api/health < 3 s', ok: false, detail: err.message });
    });
  });
}

// ---------------------------------------------------------------------------
// GET /api/onboarding/checks
// ---------------------------------------------------------------------------

router.get('/api/onboarding/checks', async (req, res) => {
  const results = await Promise.all([
    Promise.resolve(checkNodeVersion()),
    Promise.resolve(checkEnvFile()),
    Promise.resolve(checkPortValid()),
    Promise.resolve(checkDbWritable()),
    checkHealthEndpoint(),
  ]);
  res.json(results);
});

// ---------------------------------------------------------------------------
// Starter tasks
// ---------------------------------------------------------------------------

const STARTER_TASKS = [
  { id: 'task_seed_customer',   title: 'Add a new valid customer name to the seed data',         file: 'src/db.js',     proof: 'Restart server; GET /api/orders returns an order for the new customer' },
  { id: 'task_max_quantity',    title: 'Change the maximum allowed quantity from 20 to 50',       file: 'src/app.js',    proof: 'POST /api/orders with quantity: 35 returns 201' },
  { id: 'task_get_order_by_id', title: 'Add a GET /api/orders/:id route',                         file: 'src/app.js',    proof: 'curl http://localhost:3000/api/orders/1 returns one order object' },
  { id: 'task_delivered_status','title': 'Add a "delivered" status and allow shipped → delivered', file: 'src/app.js',    proof: 'PATCH an order at shipped to delivered returns 200' },
  { id: 'task_startup_log',     title: 'Write the DB path and port to the console on startup',    file: 'src/server.js', proof: 'npm start prints both values before the "listening" line' },
];

// GET /api/onboarding/tasks
router.get('/api/onboarding/tasks', (req, res) => {
  const rows = db.prepare('SELECT task_id, status FROM onboarding_tasks').all();
  const statusMap = {};
  for (const row of rows) statusMap[row.task_id] = row.status;

  const tasks = STARTER_TASKS.map((t) => ({
    ...t,
    status: statusMap[t.id] || 'todo',
  }));
  res.json(tasks);
});

// PATCH /api/onboarding/tasks/:id
router.patch('/api/onboarding/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  const task = STARTER_TASKS.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (!VALID_TASK_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_TASK_STATUSES.join(', ')}` });
  }

  // "Repeating done stays done" — if already done and new status is done, no-op is fine
  db.prepare(`
    INSERT INTO onboarding_tasks (task_id, status, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(task_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at
  `).run(id, status);

  const row = db.prepare('SELECT task_id, status, updated_at FROM onboarding_tasks WHERE task_id = ?').get(id);
  res.json(row);
});

// ---------------------------------------------------------------------------
// Serve the onboarding UI at /
// ---------------------------------------------------------------------------

router.get('/harbor', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/onboarding.html'));
});

module.exports = router;
