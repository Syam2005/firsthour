const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();

// Trust Render's reverse proxy so secure cookies work over HTTPS
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3001';

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

const isProd = process.env.NODE_ENV === 'production';
app.use(session({
  secret: process.env.SESSION_SECRET || 'firsthour-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // 'none' is required for cross-site OAuth redirects (GitHub → backend callback)
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: isProd
  }
}));

// Handle malformed JSON
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next(err);
});

app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/runs', require('./routes/runs'));

// Global error handler
app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  console.error(err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
