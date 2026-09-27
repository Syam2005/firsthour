require('dotenv').config({ path: '.env' });

const { initDb } = require('./db');
const app = require('./app');

const PORT = process.env.PORT || 3000;

initDb().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`FirstHour listening on http://localhost:${PORT}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other FirstHour window, then run npm start once.`);
      process.exit(1);
    }
    console.error(err.message);
    process.exit(1);
  });
}).catch((err) => {
  console.error('Failed to initialise database:', err.message);
  process.exit(1);
});
