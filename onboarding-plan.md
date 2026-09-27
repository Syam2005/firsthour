# FirstHour Onboarding UI — Plan

## Overview

**Goal:** Build an Onboarding UI inside the existing Express + sql.js app that helps a new hire understand the architecture, verify their local setup, and complete their first real tasks — all within the first hour.

**Scope:**
- Three server-rendered HTML pages served by Express: Overview, Setup, Starter Tasks.
- A server-side `/api/onboarding/checks` endpoint that runs all five setup checks and returns JSON.
- A new `onboarding_progress` SQLite table (tracked via `db.js`).
- Dark / light / system theme toggled by the user and persisted in `localStorage`; any stored value that is not `"dark"` or `"light"` falls back to system preference.
- All UI is vanilla HTML + CSS + minimal inline JS — no new build tooling.

**Non-goals:**
- No changes to existing orders API routes.
- No authentication or user accounts.
- No external CSS frameworks or bundlers.

---

## Files to Add

| Path | Purpose |
|------|---------|
| `src/onboarding.js` | Express router — mounts all `/onboarding` page routes and `/api/onboarding/checks` |
| `public/onboarding.css` | Shared stylesheet with CSS custom-property theme tokens (dark / light) |
| `public/theme.js` | 15-line inline-able script: reads `localStorage.theme`, validates it, applies CSS class |
| `views/overview.html` | Overview page — architecture prose + diagram |
| `views/setup.html` | Setup page — triggers checks endpoint, renders results |
| `views/tasks.html` | Starter Tasks page — five tasks with file names, proof steps, and progress badges |

`src/app.js` and `src/db.js` each need **small additions** (not rewrites):
- `src/app.js` — mount the onboarding router and serve `public/` as static.
- `src/db.js` — add `CREATE TABLE IF NOT EXISTS onboarding_progress` to the schema init block and expose `PATCH /api/onboarding/progress/:task_id` on the router.

---

## Sub-Tasks

---

### Sub-task 1 — Architecture Explanation (Overview page content)

**Status:** [ ] pending

**Intent:**
Write the two-minute architecture explanation that will live in `views/overview.html`. It must accurately reflect the actual code: Node.js process → Express router → sql.js in-memory DB → disk flush via `persist()`. This is prose + a simple ASCII-style diagram, not a Mermaid chart.

**Expected Outcomes:**
- `views/overview.html` exists and contains a self-contained HTML page.
- The explanation covers: Express serving the API, sql.js loading the DB file into memory at startup, synchronous reads from RAM, every write flushing to disk via `persist()`, and the strict `new → packed → shipped` status machine.
- No jargon beyond what a junior Node.js developer knows.
- Page links to Setup and Starter Tasks pages.
- Theme class is applied by `public/theme.js` on page load.

**Todo List:**
1. Create `views/` directory.
2. Write `views/overview.html` with: nav links, architecture prose (≤ 300 words), a text-based flow diagram showing `HTTP request → Express → sql.js (RAM) → harbor.db (disk)`, and a summary of the status machine.
3. Include a `<script src="/theme.js">` tag and a theme-toggle button.

**Relevant Context:**
- `src/db.js` — `initDb()` loads the WASM module, opens `harbor.db`, runs `CREATE TABLE IF NOT EXISTS`, inserts seed rows if empty, then the module is used synchronously. `persist()` is called after every write.
- `src/app.js` lines 1–20 — imports, `VALID_STATUSES`, `STATUS_TRANSITIONS`.
- `docs/RUNBOOK.md` — canonical description of how the DB and env vars work.

---

### Sub-task 2 — Setup Checks endpoint

**Status:** [ ] pending

**Intent:**
Implement `GET /api/onboarding/checks` in `src/onboarding.js`. This endpoint runs all five checks server-side and returns a JSON array. The Setup page calls this with `fetch()` and renders the results.

**Checks (in order):**

| # | Check | Pass condition |
|---|-------|---------------|
| 1 | Node version | `process.versions.node` major ≥ 20 |
| 2 | `.env` file exists | `fs.existsSync('.env')` is true |
| 3 | `PORT` is a valid integer 1024–65535 | `process.env.PORT` parses to integer in range |
| 4 | `DB_PATH` parent directory is writable | `fs.accessSync(path.dirname(DB_PATH), fs.constants.W_OK)` succeeds |
| 5 | `GET /api/health` responds within 3 s | Internal `http.get` to `http://localhost:${PORT}/api/health` with 3000 ms timeout, parses `{ ok: true }` |

Response shape (one object per check):
```json
[
  { "id": "node_version",  "label": "Node >= 20",                 "ok": true,  "detail": "v22.1.0" },
  { "id": "env_file",      "label": ".env file exists",            "ok": false, "detail": "Not found" },
  { "id": "port_valid",    "label": "PORT is 1024–65535",          "ok": true,  "detail": "3000" },
  { "id": "db_writable",   "label": "DB_PATH parent is writable",  "ok": true,  "detail": "data/" },
  { "id": "health_check",  "label": "GET /api/health < 3 s",       "ok": true,  "detail": "42 ms" }
]
```

**Expected Outcomes:**
- `GET /api/onboarding/checks` returns HTTP 200 with the above JSON regardless of individual check results (the `ok` booleans carry the pass/fail signal).
- Each check is isolated — a crash in one check sets `ok: false` for that item and continues.
- The health check uses Node's built-in `http` module (no new deps).

**Todo List:**
1. Create `src/onboarding.js` with an Express Router.
2. Implement each of the five checks as separate helper functions.
3. Wire `GET /api/onboarding/checks` to run all five and return the JSON array.
4. Mount the router in `src/app.js` at `/` (so the path `/api/onboarding/checks` is preserved).

**Relevant Context:**
- `src/app.js` — see how existing routes use `db.prepare().get()` synchronously; the new endpoint is async because of the health HTTP call.
- `src/server.js` — `PORT` and `DB_PATH` are set from `process.env` after `dotenv.config()`.
- AGENTS.md: "health check 3 s timeout" and "no stack traces ever leaked" — wrap everything in try/catch, return `{ ok: false, detail: err.message }`.

---

### Sub-task 3 — Setup page (views/setup.html)

**Status:** [ ] pending

**Intent:**
Build `views/setup.html`. On load the page calls `GET /api/onboarding/checks` and renders each result as a status row (green tick / red cross + label + detail). A "Re-run checks" button repeats the fetch.

**Expected Outcomes:**
- Page fetches `/api/onboarding/checks` on `DOMContentLoaded`.
- Each row shows: icon (✓/✗), label, detail string.
- While loading, shows a spinner or "Checking…" message.
- On network error, shows a single error row.
- No page reload required to re-run checks.
- Theme toggle works (shared `theme.js`).

**Todo List:**
1. Write `views/setup.html` with a `<ul id="checks">` target, inline `<script>` that fetches the endpoint and populates the list, and a Re-run button.
2. Style pass/fail rows using CSS custom properties from `public/onboarding.css`.
3. Add nav links to Overview and Starter Tasks.

**Relevant Context:**
- Endpoint from Sub-task 2: `GET /api/onboarding/checks`.
- `public/onboarding.css` (created in Sub-task 5) provides `.check-pass` / `.check-fail` classes.

---

### Sub-task 4 — Starter Tasks page (views/tasks.html) + progress table

**Status:** [ ] pending

**Intent:**
Define five concrete starter tasks and build `views/tasks.html` to display them with per-task progress badges. Progress is stored in `onboarding_progress` and toggled via `PATCH /api/onboarding/progress/:task_id`.

**The five starter tasks:**

| # | Title | File to edit | How to prove it worked |
|---|-------|-------------|----------------------|
| 1 | Add a new valid customer name to the seed data | `src/db.js` | Restart server; `GET /api/orders` returns an order for the new customer |
| 2 | Change the maximum allowed quantity from 20 to 50 | `src/app.js` | `POST /api/orders` with `quantity: 35` returns 201 |
| 3 | Add a `GET /api/orders/:id` route | `src/app.js` | `curl http://localhost:3000/api/orders/1` returns one order object |
| 4 | Add a fourth valid status `"delivered"` and allow `shipped → delivered` | `src/app.js` | `PATCH` an order already at `shipped` to `delivered` returns 200 |
| 5 | Write the DB path and port to the server console on startup | `src/server.js` | `npm start` prints both values before the "listening" line |

**`onboarding_progress` table schema:**
```sql
CREATE TABLE IF NOT EXISTS onboarding_progress (
  task_id    TEXT PRIMARY KEY,
  status     TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'done'
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**`PATCH /api/onboarding/progress/:task_id`** body: `{ "status": "done" | "pending" }`.  
Returns `{ task_id, status, updated_at }` or 400 for unknown status.

**Expected Outcomes:**
- `views/tasks.html` lists all five tasks with their file and proof instructions.
- Each task card has a "Mark done / Mark pending" toggle button.
- Button calls `PATCH /api/onboarding/progress/:task_id` and updates the badge in-place.
- On page load, `GET /api/onboarding/progress` returns all five rows and pre-fills badges.
- Theme toggle works.

**Todo List:**
1. Add `onboarding_progress` table creation to `src/db.js` `initDb()` (after the existing `orders` table DDL).
2. Add `GET /api/onboarding/progress` (returns all rows) and `PATCH /api/onboarding/progress/:task_id` to `src/onboarding.js`.
3. Write `views/tasks.html` with five task cards, inline fetch logic, and badge update on response.
4. Add nav links to Overview and Setup.

**Relevant Context:**
- `src/db.js` lines 48–57 — existing `CREATE TABLE IF NOT EXISTS orders` block; add the new DDL immediately after.
- `src/app.js` — existing `PATCH /api/orders/:id` shows the pattern for status validation and `db.prepare().run()`.
- AGENTS.md: "`persist()` after every write" — the progress PATCH must call `persist()`.

---

### Sub-task 5 — Theme system + shared CSS + Express wiring

**Status:** [ ] pending

**Intent:**
Create `public/theme.js` and `public/onboarding.css`, serve the `public/` folder and `views/` pages from Express, and add nav routes so all three pages are reachable.

**Theme logic (`public/theme.js`):**
```
read localStorage.theme
if value === 'dark'   → add class 'dark'  to <html>
if value === 'light'  → add class 'light' to <html>
else (anything else, including missing) → honour prefers-color-scheme via CSS only (no class)
```
CSS uses:
```css
:root { /* light defaults */ }
:root.dark { /* dark overrides */ }
@media (prefers-color-scheme: dark) {
  :root:not(.light):not(.dark) { /* system dark overrides */ }
}
```
Toggle button cycles `light → dark → system` (removes the class for system), writes to `localStorage.theme`.

**Expected Outcomes:**
- `GET /` redirects to or renders `views/overview.html` (or a welcome redirect to `/onboarding/overview`).
- `GET /onboarding/overview`, `GET /onboarding/setup`, `GET /onboarding/tasks` each serve the correct HTML file.
- `express.static('public')` serves CSS and JS assets.
- Theme persists across page navigations.
- Any `localStorage.theme` value that is not `"dark"` or `"light"` (e.g. `"system"`, `""`, `null`) falls through to system preference — no explicit class is set.

**Todo List:**
1. Create `public/onboarding.css` with CSS custom-property tokens for background, text, card colours, and `.check-pass` / `.check-fail` states, in light, dark, and system variants.
2. Create `public/theme.js` with the validation + class-apply logic and the toggle button handler.
3. In `src/onboarding.js`, add three `GET` routes that `res.sendFile` the correct view.
4. In `src/app.js`, add `app.use(express.static('public'))` and mount the onboarding router.
5. Optionally add `GET /` → redirect to `/onboarding/overview`.

**Relevant Context:**
- `src/app.js` currently has no static middleware or view rendering — the addition is purely additive.
- `path.join(__dirname, '../views/overview.html')` pattern for `res.sendFile` (Express needs an absolute path).
- AGENTS.md: "no stack traces ever leaked" — 404 handler for unknown onboarding routes should return a plain message.

---

## Dependency Order

```
Sub-task 2 (checks endpoint)
    ↓
Sub-task 3 (setup page consumes endpoint)

Sub-task 4a (DB table + progress API)
    ↓
Sub-task 4b (tasks page consumes API)

Sub-task 5 (CSS/JS + Express wiring) — must be done before or alongside 1, 3, 4b
                                        so pages are actually reachable

Sub-task 1 (overview HTML content) — can be done at any time, no code deps
```

Recommended implementation order: **5 → 1 → 2 → 3 → 4**.

---

## Summary of All New Files

| File | New or Modified |
|------|----------------|
| `src/onboarding.js` | **New** |
| `public/onboarding.css` | **New** |
| `public/theme.js` | **New** |
| `views/overview.html` | **New** |
| `views/setup.html` | **New** |
| `views/tasks.html` | **New** |
| `src/db.js` | Modified — add `onboarding_progress` DDL |
| `src/app.js` | Modified — mount router + static middleware |
