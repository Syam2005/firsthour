# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project: FirstHour — Harbor Orders API

Node.js + Express + sql.js (pure-WASM SQLite). No native compilation needed.

## Commands

```bash
npm install      # install deps (no build step)
npm start        # node src/server.js — starts on PORT (default 3000)
```

No test runner is configured yet. Smoke-test manually:
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/orders
```

## Key Architecture Facts

- **`src/db.js`** — `better-sqlite3`-style wrapper around `sql.js`. Exports `{ db, initDb }`. `initDb()` is async and MUST be awaited before the server listens (done in `src/server.js`). After every write the in-memory database is flushed to disk via `persist()`.
- **`src/app.js`** — Express app (no `app.listen`). Imports `{ db }` from `./db`. All routes are synchronous.
- **`src/server.js`** — Calls `initDb()` then `app.listen()`.
- Database file created automatically at `DB_PATH` (default `data/harbor.db`). Directory is created if missing.
- Three seed rows are inserted only when the table is empty (idempotent restart).

## Status State Machine

Orders follow a strict one-way chain: `new` → `packed` → `shipped`.  
Any other transition returns HTTP 400. Implemented via the `STATUS_TRANSITIONS` map in `src/app.js`.

## Validation Rules (POST /api/orders)

| Field | Rule |
|-------|------|
| `customer` | non-empty string (trimmed) |
| `item` | non-empty string (trimmed) |
| `quantity` | integer, 1–20 inclusive |

Invalid JSON → 400 `{ error: "Invalid JSON" }` (handled by Express error middleware).  
Unknown order id → 404. Unknown status value → 400. No stack traces ever leaked.

## README is Intentionally Stale

`README.md` says Postgres and omits `.env` setup — this is by design (FirstHour problem scenario).  
The authoritative setup instructions are in `docs/RUNBOOK.md`.

## Environment

Copy `.env.example` → `.env` before starting. Required variables: `PORT`, `DB_PATH`.

## Sample Customer Names

Only `Harbor Cafe`, `North Dock`, `Blue Pier` — no personal data.
