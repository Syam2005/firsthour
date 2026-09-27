const express = require('express');
const { db } = require('./db');

const app = express();
app.use(express.json());

const STATUS_TRANSITIONS = { new: 'packed', packed: 'shipped' };

app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.get('/api/orders', (req, res) => {
  res.json(db.prepare('SELECT * FROM orders ORDER BY id').all());
});

app.post('/api/orders', (req, res) => {
  const { customer, item, quantity } = req.body || {};
  if (!customer || typeof customer !== 'string' || customer.trim() === '')
    return res.status(400).json({ error: 'customer is required' });
  if (!item || typeof item !== 'string' || item.trim() === '')
    return res.status(400).json({ error: 'item is required' });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20)
    return res.status(400).json({ error: 'quantity must be an integer from 1 to 20' });
  const result = db.prepare('INSERT INTO orders (customer, item, quantity) VALUES (?, ?, ?)').run(customer.trim(), item.trim(), quantity);
  res.status(201).json(db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid));
});

app.patch('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body || {};
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'order not found' });
  if (!['new', 'packed', 'shipped'].includes(status))
    return res.status(400).json({ error: 'unknown status' });
  if (STATUS_TRANSITIONS[order.status] !== status)
    return res.status(400).json({ error: `cannot move from ${order.status} to ${status}` });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
});

app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
