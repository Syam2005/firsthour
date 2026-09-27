/**
 * sql.js wrapper — synchronous API over pure-WASM SQLite.
 * Note: The README says Postgres, but this code uses SQLite.
 * This is intentional — it's the FirstHour demo pitfall.
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || 'data/harbor.db';
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let _SQL = null;
let _db = null;

async function initDb() {
  if (_db) return _db;
  _SQL = await initSqlJs();
  let fileBuffer = null;
  if (fs.existsSync(DB_PATH)) fileBuffer = fs.readFileSync(DB_PATH);
  _db = fileBuffer ? new _SQL.Database(fileBuffer) : new _SQL.Database();
  _db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      customer   TEXT    NOT NULL,
      item       TEXT    NOT NULL,
      quantity   INTEGER NOT NULL,
      status     TEXT    NOT NULL DEFAULT 'new',
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
  const count = query('SELECT COUNT(*) as n FROM orders')[0].n;
  if (count === 0) {
    run('INSERT INTO orders (customer, item, quantity, status) VALUES (?, ?, ?, ?)', ['Harbor Cafe', 'Cold Brew Beans', 5, 'new']);
    run('INSERT INTO orders (customer, item, quantity, status) VALUES (?, ?, ?, ?)', ['North Dock', 'Rope Coil', 2, 'packed']);
    run('INSERT INTO orders (customer, item, quantity, status) VALUES (?, ?, ?, ?)', ['Blue Pier', 'Life Jacket', 10, 'shipped']);
  }
  persist();
  return _db;
}

function persist() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function query(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  _db.run(sql, params);
  const lastInsertRowid = _db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] ?? null;
  persist();
  return { lastInsertRowid };
}

const db = {
  prepare(sql) {
    return {
      get(...params) { return query(sql, params.flat())[0]; },
      all(...params) { return query(sql, params.flat()); },
      run(...params) { return run(sql, params.flat()); }
    };
  }
};

module.exports = { db, initDb };
