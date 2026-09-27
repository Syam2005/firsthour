const express = require('express');
const { getClient } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const client = getClient();
    await client.from('runs').select('id').limit(1);
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, error: 'Database unavailable' });
  }
});

module.exports = router;
