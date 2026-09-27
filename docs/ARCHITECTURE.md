# Harbor Orders — Architecture

## Process Overview

```
npm start
  └─ src/server.js
       ├─ dotenv.config()          loads .env into process.env
       ├─ initDb()                 async — loads sql.js WASM, opens harbor.db
       └─ app.listen(PORT)         only called after DB is ready
```

The entry point is [`src/server.js`](../src/server.js). It loads environment variables, awaits database initialisation, then starts the HTTP server. If `initDb()` rejects, the process exits with code 1.

---

## Request Lifecycle

```
HTTP Request
    │
    ▼
express.static('public/')      ← serves CSS, JS assets (no auth)
    │
    ▼
express.json()                 ← parses application/json body
    │  parse error → 400 { error: "Invalid JSON" }
    ▼
Route handlers  (src/app.js, src/onboarding.js)
    │  validation errors → 400
    │  not found         → 404
    │  success           → 200 / 201
    ▼
db.prepare(sql).get/all/run()  ← synchronous, against in-memory DB
    │  every write calls persist()
    ▼
persist()                      ← fs.writeFileSync(DB_PATH, db.export())
```

All route handlers in `src/app.js` are **synchronous** except `GET /api/onboarding/checks`, which fires an internal HTTP request to `/api/health` to verify the server is reachable.

---

## Database Layer (`src/db.js`)

**Technology:** [sql.js](https://sql-js.github.io/sql.js/) — SQLite compiled to WebAssembly. No native addon, no C++ toolchain required.

**Startup sequence:**

1. `initSqlJs()` resolves the WASM binary (async, done once at startup).
2. If `DB_PATH` exists on disk, its bytes are loaded into a new `Database` object.
3. `CREATE TABLE IF NOT EXISTS` DDL runs for `orders` and `onboarding_tasks`.
4. Three seed rows are inserted into `orders` if the table is empty (idempotent).
5. `persist()` flushes the initial state to disk.

**Read path:** `db.prepare(sql).get(...params)` / `.all(...params)` query the in-memory copy — no disk I/O.

**Write path:** `db.prepare(sql).run(...params)` executes the statement, then `persist()` serialises the full database with `_db.export()` and writes it atomically via `fs.writeFileSync`. This is synchronous and blocks the event loop briefly, but keeps the code simple and guarantees durability.

**API exposed by `src/db.js`:**

| Method | Behaviour |
|--------|-----------|
| `db.prepare(sql).get(p1, p2, …)` | Returns first row as plain object, or `undefined` |
| `db.prepare(sql).all(p1, p2, …)` | Returns all rows as array of plain objects |
| `db.prepare(sql).run(p1, p2, …)` | Executes write; returns `{ lastInsertRowid }` |
| `db.exec(sql)` | Raw DDL / multi-statement execution |

---

## Schema

```sql
CREATE TABLE IF NOT EXISTS orders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  customer   TEXT    NOT NULL,
  item       TEXT    NOT NULL,
  quantity   INTEGER NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'new',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  task_id    TEXT PRIMARY KEY,
  status     TEXT NOT NULL DEFAULT 'todo',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## Orders API (`src/app.js`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Returns `{ ok: true }` if DB is accessible |
| GET | `/api/orders` | List all orders, ordered by id |
| POST | `/api/orders` | Create a new order |
| PATCH | `/api/orders/:id` | Advance order status |

### Validation rules (POST /api/orders)

| Field | Rule |
|-------|------|
| `customer` | Non-empty string (trimmed) |
| `item` | Non-empty string (trimmed) |
| `quantity` | Integer, 1–20 inclusive; `Number.isInteger()` enforced |

### Status machine

Orders follow a strict one-way chain — no skipping, no reversal:

```
new  →  packed  →  shipped
```

Implemented as a transition map: `{ new: 'packed', packed: 'shipped' }`.  
Any transition not in the map returns HTTP 400.

---

## Onboarding API (`src/onboarding.js`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Serves the onboarding UI (single HTML page) |
| GET | `/api/onboarding/checks` | Runs five setup checks, returns JSON array |
| GET | `/api/onboarding/tasks` | Returns all starter tasks with current status |
| PATCH | `/api/onboarding/tasks/:id` | Updates task status (`todo` / `doing` / `done`) |

### Setup checks

| Check | Pass condition |
|-------|---------------|
| Node >= 20 | `process.versions.node` major ≥ 20 |
| `.env` file exists | `fs.existsSync('.env')` |
| PORT is 1024–65535 | `parseInt(process.env.PORT)` in range |
| DB_PATH parent writable | `fs.accessSync(dir, W_OK)` succeeds |
| GET /api/health < 3 s | Internal HTTP GET with 3000 ms timeout returns `{ ok: true }` |

Each check is isolated: a failure in one does not prevent the others from running.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | TCP port |
| `DB_PATH` | `data/harbor.db` | SQLite file path |

Copy `.env.example` to `.env` before starting:

```bash
cp .env.example .env
```

---

## File Map

```
src/
  server.js          process entry, env + DB init, app.listen
  app.js             Express app, orders routes, error handlers
  db.js              sql.js wrapper, initDb(), persist()
  onboarding.js      onboarding UI route + API endpoints
public/
  onboarding.css     CSS custom-property theme (light / dark / system)
  theme.js           theme apply/toggle logic (runs before body paint)
views/
  onboarding.html    single-page onboarding UI
docs/
  RUNBOOK.md         operational setup instructions
  ARCHITECTURE.md    this file
  STARTER_TASKS.md   starter task descriptions and hints
data/
  harbor.db          SQLite file (auto-created, git-ignored)
```
