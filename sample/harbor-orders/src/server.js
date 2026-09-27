require('dotenv').config();
const { initDb } = require('./db');
const app = require('./app');

const PORT = process.env.PORT || 3000;

initDb().then(() => {
  app.listen(PORT, () => console.log(`Harbor Orders API on http://localhost:${PORT}`));
}).catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
