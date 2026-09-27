/**
 * Synchronous SQLite wrapper using sql.js (pure WebAssembly – no native build required).
 *
 * sql.js keeps the database in memory; we flush to disk after every write using
 * db.export() so data survives restarts. Reads are in-memory (fast). Writes call
 * persist() which is synchronous FS.
 *
 * The exported object mimics the better-sqlite3 API subset used by this project:
 *   db.prepare(sql).get(...params)
 *   db.prepare(sql).all(...params)
 *   db.prepare(sql).run(...params)   → { lastInsertRowid }
 *   db.exec(sql)
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || 'data/harbor.db';
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// sql.js initialises asynchronously – we block the event loop once at startup
// using a synchronous trick: store the resolved DB in a module-level variable
// via a top-level await shim (works in CJS with a sync initialiser pattern).
let _SQL = null;
let _db = null;

function getDb() {
  if (_db) return _db;
  throw new Error('Database not yet initialised – await initDb() first');
}

async function initDb() {
  if (_db) return _db;

  _SQL = await initSqlJs();

  let fileBuffer = null;
  if (fs.existsSync(DB_PATH)) {
    fileBuffer = fs.readFileSync(DB_PATH);
  }

  _db = fileBuffer ? new _SQL.Database(fileBuffer) : new _SQL.Database();

  _db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      customer TEXT    NOT NULL,
      item     TEXT    NOT NULL,
      quantity INTEGER NOT NULL,
      status   TEXT    NOT NULL DEFAULT 'new',
      created_at TEXT  NOT NULL DEFAULT (datetime('now'))
    )
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS onboarding_tasks (
      task_id    TEXT PRIMARY KEY,
      status     TEXT NOT NULL DEFAULT 'todo',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id            TEXT PRIMARY KEY,
      github_login  TEXT,
      github_id     INTEGER,
      access_token  TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id          TEXT PRIMARY KEY,
      repo        TEXT NOT NULL,
      status      TEXT NOT NULL,
      summary     TEXT,
      source      TEXT,
      result_json TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);



  // Seed three orders if table is empty
  const count = query('SELECT COUNT(*) as n FROM orders')[0].n;
  if (count === 0) {
    run('INSERT INTO orders (customer, item, quantity, status) VALUES (?, ?, ?, ?)',
      ['Harbor Cafe', 'Cold Brew Beans', 5, 'new']);
    run('INSERT INTO orders (customer, item, quantity, status) VALUES (?, ?, ?, ?)',
      ['North Dock', 'Rope Coil', 2, 'packed']);
    run('INSERT INTO orders (customer, item, quantity, status) VALUES (?, ?, ?, ?)',
      ['Blue Pier', 'Life Jacket', 10, 'shipped']);
  }

  persist();
  return _db;
}

/** Flush in-memory DB to disk */
function persist() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/** Execute a query and return all rows as plain objects */
function query(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/** Execute a write statement and return { lastInsertRowid } */
function run(sql, params = []) {
  _db.run(sql, params);
  const lastInsertRowid = _db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] ?? null;
  persist();
  return { lastInsertRowid };
}

/** Execute raw SQL (DDL / multi-statement) */
function exec(sql) {
  _db.exec(sql);
  persist();
}

/**
 * Minimal better-sqlite3-style interface used by app.js:
 *   db.prepare(sql).get(p1, p2, ...)
 *   db.prepare(sql).all()
 *   db.prepare(sql).run(p1, p2, ...)
 *   db.exec(sql)
 */
const db = {
  prepare(sql) {
    return {
      get(...params) {
        const rows = query(sql, params.flat());
        return rows[0] ?? undefined;
      },
      all(...params) {
        return query(sql, params.flat());
      },
      run(...params) {
        return run(sql, params.flat());
      }
    };
  },
  exec,
  _persist: persist,
  _isReady() { return _db !== null; }
};

module.exports = { db, initDb };
