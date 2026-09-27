// Load .env only in local dev — on Render env vars are injected directly
const dotenvPath = require('path').join(__dirname, '../../.env');
require('dotenv').config({ path: dotenvPath });

const app = require('./app');
const PORT = process.env.PORT || 3000;

const requiredEnv = ['SESSION_SECRET', 'SUPABASE_URL', 'SUPABASE_SECRET_KEY'];
const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`FirstHour backend listening on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }
  console.error(err.message);
  process.exit(1);
});
