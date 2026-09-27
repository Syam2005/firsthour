const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { dbQuery } = require('../db');
const { parseRepo } = require('../lib/repo');
const { startAnalysis } = require('../lib/pipeline');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

function requireAuth(req, res, next) {
  // Auth optional for analysis — guest runs are allowed but not saved to history
  next();
}

router.post('/github', requireAuth, async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }
  let parsed;
  try {
    parsed = parseRepo(url);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  const runId = crypto.randomUUID();
  try {
    await dbQuery((client) =>
      client.from('runs').insert({
        id: runId,
        user_id: req.session.userId || null,
        source: 'github',
        source_label: parsed.full,
        source_url: url,
        status: 'running'
      })
    );
  } catch (err) {
    return res.status(503).json({ error: 'Could not create run: ' + err.message });
  }

  startAnalysis(runId, { kind: 'github', owner: parsed.owner, name: parsed.name });
  res.status(202).json({ id: runId });
});

router.post('/upload', upload.single('file'), requireAuth, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  if (!req.file.originalname.endsWith('.zip')) {
    return res.status(400).json({ error: 'Only .zip files are accepted' });
  }

  const runId = crypto.randomUUID();
  const filename = req.file.originalname;

  try {
    await dbQuery((client) =>
      client.from('runs').insert({
        id: runId,
        user_id: req.session.userId || null,
        source: 'upload',
        source_label: filename,
        source_url: null,
        status: 'running'
      })
    );
  } catch (err) {
    return res.status(503).json({ error: 'Could not create run: ' + err.message });
  }

  startAnalysis(runId, { kind: 'upload', buffer: req.file.buffer, filename });
  res.status(202).json({ id: runId });
});

module.exports = router;
