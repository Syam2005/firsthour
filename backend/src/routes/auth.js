const express = require('express');
const crypto = require('crypto');
const { dbQuery } = require('../db');
const router = express.Router();

const GITHUB_CLIENT_ID = () => process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = () => process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = () => process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback';
const FRONTEND_ORIGIN = () => process.env.FRONTEND_ORIGIN || 'http://localhost:3001';

router.get('/github/start', (req, res) => {
  if (!GITHUB_CLIENT_ID() || !GITHUB_CLIENT_SECRET()) {
    return res.status(400).json({ error: 'GitHub OAuth is not configured' });
  }
  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', GITHUB_CLIENT_ID());
  url.searchParams.set('redirect_uri', GITHUB_CALLBACK_URL());
  url.searchParams.set('scope', 'read:user');
  url.searchParams.set('state', state);
  res.redirect(url.toString());
});

router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || state !== req.session.oauthState) {
    return res.redirect(`${FRONTEND_ORIGIN()}/?error=oauth_failed`);
  }
  delete req.session.oauthState;
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID(),
        client_secret: GITHUB_CLIENT_SECRET(),
        code,
        redirect_uri: GITHUB_CALLBACK_URL()
      })
    });
    const tokenPayload = await tokenRes.json();
    if (!tokenPayload.access_token) {
      return res.redirect(`${FRONTEND_ORIGIN()}/?error=no_token`);
    }
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'FirstHour-Onboarding'
      },
      signal: AbortSignal.timeout(12000)
    });
    const ghUser = await userRes.json();
    const githubId = String(ghUser.id || 0);
    const login = ghUser.login || 'github-user';
    const avatar = ghUser.avatar_url || '';

    // Upsert user
    await dbQuery((client) =>
      client.from('users').upsert(
        { github_id: githubId, login, avatar_url: avatar },
        { onConflict: 'github_id' }
      )
    );
    // Get user record
    const users = await dbQuery((client) =>
      client.from('users').select('id').eq('github_id', githubId).limit(1)
    );
    const userId = users[0]?.id;
    req.session.userId = userId;
    req.session.login = login;
    req.session.avatar = avatar;
    res.redirect(`${FRONTEND_ORIGIN()}/`);
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.redirect(`${FRONTEND_ORIGIN()}/?error=oauth_error`);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }
  res.json({
    user: {
      id: req.session.userId,
      login: req.session.login,
      avatar: req.session.avatar
    }
  });
});

module.exports = router;
