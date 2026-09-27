const express = require('express');
const path = require('path');
const { db } = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Handle malformed JSON
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next(err);
});

const VALID_STATUSES = ['new', 'packed', 'shipped'];
const STATUS_TRANSITIONS = { new: 'packed', packed: 'shipped' };

// GET /api/health
app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

// GET /api/orders
app.get('/api/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY id').all();
  res.json(orders);
});

// POST /api/orders
app.post('/api/orders', (req, res) => {
  const { customer, item, quantity } = req.body || {};

  if (!customer || typeof customer !== 'string' || customer.trim() === '') {
    return res.status(400).json({ error: 'customer is required' });
  }
  if (!item || typeof item !== 'string' || item.trim() === '') {
    return res.status(400).json({ error: 'item is required' });
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return res.status(400).json({ error: 'quantity must be an integer from 1 to 20' });
  }

  const result = db
    .prepare('INSERT INTO orders (customer, item, quantity) VALUES (?, ?, ?)')
    .run(customer.trim(), item.trim(), quantity);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(order);
});

// PATCH /api/orders/:id
app.patch('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body || {};

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ error: 'order not found' });
  }

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'unknown status' });
  }

  if (STATUS_TRANSITIONS[order.status] !== status) {
    return res.status(400).json({
      error: `cannot move status from ${order.status} to ${status}`
    });
  }

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json(updated);
});

const platform = require('./platform');
app.use(platform);

const onboarding = require('./onboarding');
app.use(onboarding);

// Global error handler — no stack traces
app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
