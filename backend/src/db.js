const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getClient() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set');
  }
  _client = createClient(url, key);
  return _client;
}

async function dbQuery(fn) {
  const client = getClient();
  const { data, error } = await fn(client);
  if (error) {
    const err = new Error(error.message || 'Database error');
    err.status = 503;
    throw err;
  }
  return data;
}

module.exports = { getClient, dbQuery };
