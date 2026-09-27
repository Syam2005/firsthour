# Implement the plan. Add the onboarding UI served at /.

Pages in one polished screen with three sections: Overview, Setup, Starter tasks.
Theme control: Light, Dark, System. Persist in localStorage under firsthour-theme. Invalid values fall back to System.

Setup section calls GET /api/onboarding/checks and shows pass or fail per check.
Timeouts: health check aborts at 3 seconds and shows "Orders API did not respond in time."
If the server is down, the page shows a retry banner, not a blank screen.

Starter tasks come from GET /api/onboarding/tasks.
PATCH /api/onboarding/tasks/:id accepts only todo, doing, or done.
Unknown id returns 404 { error: "Task not found" }.
Repeating done stays done.

Escape all text in the UI. Empty task list shows "No starter tasks yet."
Loading state shows "Checking setup…"
Add docs/ARCHITECTURE.md and docs/STARTER_TASKS.md from the real code.
Update README so a new developer can run the app. Keep the old stale instructions in docs/STALE_README.md so the demo can show the before state.

---

**Status:** active  **Date:** 2026-09-25

---

### 👤 User

Implement the plan. Add the onboarding UI served at /.

Pages in one polished screen with three sections: Overview, Setup, Starter tasks.
Theme control: Light, Dark, System. Persist in localStorage under firsthour-theme. Invalid values fall back to System.

Setup section calls GET /api/onboarding/checks and shows pass or fail per check.
Timeouts: health check aborts at 3 seconds and shows "Orders API did not respond in time."
If the server is down, the page shows a retry banner, not a blank screen.

Starter tasks come from GET /api/onboarding/tasks.
PATCH /api/onboarding/tasks/:id accepts only todo, doing, or done.
Unknown id returns 404 { error: "Task not found" }.
Repeating done stays done.

Escape all text in the UI. Empty task list shows "No starter tasks yet."
Loading state shows "Checking setup…"
Add docs/ARCHITECTURE.md and docs/STARTER_TASKS.md from the real code.
Update README so a new developer can run the app. Keep the old stale instructions in docs/STALE_README.md so the demo can show the before state.

---

### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[-] Read existing codebase to understand current structure
[ ] Add GET /api/onboarding/checks endpoint
[ ] Add GET /api/onboarding/tasks and PATCH /api/onboarding/tasks/:id endpoints
[ ] Build the onboarding UI served at /
[ ] Add docs/ARCHITECTURE.md
[ ] Add docs/STARTER_TASKS.md
[ ] Update README.md (move stale content to docs/STALE_README.md)


### 🤖 Assistant

> 🔧 called: list_files



> 🔧 **list_files** — .

### 🤖 Assistant

> 🔧 called: read_file, read_file, read_file



> 🔧 **read_file** — onboarding-plan.md

> 🔧 **read_file** — src/app.js

> 🔧 **read_file** — src/db.js

### 🤖 Assistant

> 🔧 called: read_file, read_file, read_file



> 🔧 **read_file** — src/server.js

> 🔧 **read_file** — README.md

> 🔧 **read_file** — docs/RUNBOOK.md

### 🤖 Assistant

> 🔧 called: read_file

Now I have a complete picture. Let me also check the `.env.example`:

> 🔧 **read_file** — .env.example

### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[x] Read existing codebase to understand current structure
[-] Add GET /api/onboarding/checks endpoint + tasks endpoints (src/onboarding.js)
[ ] Update src/db.js to add onboarding_progress table
[ ] Update src/app.js to mount router and static middleware
[ ] Build the onboarding UI served at / (single polished screen with 3 sections)
[ ] Add docs/ARCHITECTURE.md
[ ] Add docs/STARTER_TASKS.md
[ ] Update README.md (move stale content to docs/STALE_README.md)


### 🤖 Assistant

> 🔧 called: write_file

Now I'll implement everything. Let me start with all the files in parallel:

> 🔧 **write_file** — src/onboarding.js

### 🤖 Assistant

> 🔧 called: apply_diff

Now update `src/db.js` to add the `onboarding_tasks` table, and `src/app.js` to mount the router:

> 🔧 **apply_diff** — src/db.js

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — src/db.js

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — src/db.js

### 🤖 Assistant

> 🔧 called: search_and_replace



> 🔧 **search_and_replace** — src/db.js

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — src/db.js

### 🤖 Assistant

> 🔧 called: insert_content



> 🔧 **insert_content** — src/db.js

### 🤖 Assistant

> 🔧 called: apply_diff

Now update `src/app.js` to mount the router and serve static files:

> 🔧 **apply_diff** — src/app.js

### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[x] Read existing codebase to understand current structure
[x] Add GET /api/onboarding/checks endpoint + tasks endpoints (src/onboarding.js)
[x] Update src/db.js to add onboarding_progress table
[x] Update src/app.js to mount router and static middleware
[-] Build the onboarding UI served at / (single polished screen with 3 sections)
[ ] Add docs/ARCHITECTURE.md
[ ] Add docs/STARTER_TASKS.md
[ ] Update README.md (move stale content to docs/STALE_README.md)


### 🤖 Assistant

> 🔧 called: execute_command

Now build the single-page onboarding UI, the CSS, and the theme JS:

> 🔧 **execute_command** — New-Item -ItemType Directory -Force -Path public, views | Out-Null; Write-Host "dirs created"

### 🤖 Assistant

> 🔧 called: write_file



> 🔧 **write_file** — public/theme.js

### 🤖 Assistant

> 🔧 called: write_file



> 🔧 **write_file** — /* ============================================================
   FirstHour — Onboarding CSS
   Light / dark / system theme via CSS custom properties.
   ============================================================ */

/* ---------- token layer (light defaults) ---------- */
:root {
  --bg:            #ffffff;
  --bg-surface:    #f7f8fa;
  --bg-card:       #ffffff;
  --border:        #e5e7eb;
  --text:          #1f2328;
  --text-muted:    #57606a;
  --accent:        #3b82d4;
  --accent-hover:  #2563b5;
  --success-bg:    #ecfdf5;
  --success-text:  #166534;
  --success-border:#bbf7d0;
  --fail-bg:       #fef2f2;
  --fail-text:     #991b1b;
  --fail-border:   #fecaca;
  --todo-bg:       #f7f8fa;
  --todo-text:     #374151;
  --doing-bg:      #eff6ff;
  --doing-text:    #1e40af;
  --done-bg:       #ecfdf5;
  --done-text:     #166534;
  --btn-bg:        #f3f4f6;
  --btn-text:      #374151;
  --btn-border:    #d1d5db;
  --btn-hover-bg:  #e5e7eb;
  --retry-bg:      #fffbeb;
  --retry-border:  #fbbf24;
  --retry-text:    #92400e;
}

/* ---------- explicit dark class ---------- */
:root.dark {
  --bg:            #0d1117;
  --bg-surface:    #161b22;
  --bg-card:       #21262d;
  --border:        #30363d;
  --text:          #e6edf3;
  --text-muted:    #8b949e;
  --accent:        #58a6ff;
  --accent-hover:  #79b8ff;
  --success-bg:    #0d1f12;
  --success-text:  #3fb950;
  --success-border:#1a3726;
  --fail-bg:       #1f0d0d;
  --fail-text:     #f85149;
  --fail-border:   #3d1212;
  --todo-bg:       #161b22;
  --todo-text:     #c9d1d9;
  --doing-bg:      #0d1926;
  --doing-text:    #79b8ff;
  --done-bg:       #0d1f12;
  --done-text:     #3fb950;
  --btn-bg:        #21262d;
  --btn-text:      #c9d1d9;
  --btn-border:    #30363d;
  --btn-hover-bg:  #30363d;
  --retry-bg:      #1c1700;
  --retry-border:  #d29922;
  --retry-text:    #e3b341;
}

/* ---------- system dark (no explicit class set) ---------- */
@media (prefers-color-scheme: dark) {
  :root:not(.light):not(.dark) {
    --bg:            #0d1117;
    --bg-surface:    #161b22;
    --bg-card:       #21262d;
    --border:        #30363d;
    --text:          #e6edf3;
    --text-muted:    #8b949e;
    --accent:        #58a6ff;
    --accent-hover:  #79b8ff;
    --success-bg:    #0d1f12;
    --success-text:  #3fb950;
    --success-border:#1a3726;
    --fail-bg:       #1f0d0d;
    --fail-text:     #f85149;
    --fail-border:   #3d1212;
    --todo-bg:       #161b22;
    --todo-text:     #c9d1d9;
    --doing-bg:      #0d1926;
    --doing-text:    #79b8ff;
    --done-bg:       #0d1f12;
    --done-text:     #3fb950;
    --btn-bg:        #21262d;
    --btn-text:      #c9d1d9;
    --btn-border:    #30363d;
    --btn-hover-bg:  #30363d;
    --retry-bg:      #1c1700;
    --retry-border:  #d29922;
    --retry-text:    #e3b341;
  }
}

/* ============================================================
   Base reset & typography
   ============================================================ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 15px; }

body {
  font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; color: var(--accent-hover); }

code {
  font-family: ui-monospace, "Cascadia Code", "Fira Mono", monospace;
  font-size: 0.875em;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 5px;
}

pre {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 16px;
  overflow-x: auto;
  font-size: 0.875em;
  font-family: ui-monospace, "Cascadia Code", "Fira Mono", monospace;
  line-height: 1.5;
}

/* ============================================================
   Layout
   ============================================================ */
.page-wrap {
  max-width: 780px;
  margin: 0 auto;
  padding: 0 20px 60px;
}

/* ============================================================
   Top bar
   ============================================================ */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 32px;
}
.topbar-brand {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
}
.topbar-brand span { color: var(--accent); }

.topbar-actions { display: flex; gap: 8px; }

/* ============================================================
   Section headings
   ============================================================ */
.section { margin-bottom: 48px; }

.section-heading {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.section-heading h2 {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text);
}
.section-num {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1px 8px;
  line-height: 1.6;
}

/* ============================================================
   Overview section
   ============================================================ */
.overview-prose p { margin-bottom: 12px; color: var(--text); }
.overview-prose p:last-child { margin-bottom: 0; }

.arch-diagram {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px 20px;
  margin: 18px 0;
  overflow-x: auto;
}
.arch-diagram pre {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.status-machine {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.state-badge {
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 4px;
  padding: 3px 10px;
}
.state-new    { background: var(--todo-bg);  color: var(--todo-text);  border: 1px solid var(--border); }
.state-packed { background: var(--doing-bg); color: var(--doing-text); border: 1px solid var(--border); }
.state-shipped{ background: var(--done-bg);  color: var(--done-text);  border: 1px solid var(--border); }
.state-arrow  { color: var(--text-muted); font-size: 0.9rem; }

/* ============================================================
   Setup section
   ============================================================ */
.checks-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.checks-summary {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.check-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-card);
}
.check-item.check-pass {
  background: var(--success-bg);
  border-color: var(--success-border);
}
.check-item.check-fail {
  background: var(--fail-bg);
  border-color: var(--fail-border);
}

.check-icon {
  flex-shrink: 0;
  font-size: 1rem;
  margin-top: 1px;
}
.check-pass .check-icon { color: var(--success-text); }
.check-fail .check-icon { color: var(--fail-text); }

.check-body { flex: 1; }
.check-label { font-weight: 500; font-size: 0.9rem; }
.check-pass .check-label { color: var(--success-text); }
.check-fail .check-label { color: var(--fail-text); }
.check-detail { font-size: 0.8rem; color: var(--text-muted); margin-top: 1px; }

.loading-row {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* ============================================================
   Retry / error banner
   ============================================================ */
.retry-banner {
  display: none;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid var(--retry-border);
  background: var(--retry-bg);
  color: var(--retry-text);
  margin-bottom: 14px;
  font-size: 0.88rem;
}
.retry-banner.visible { display: flex; }
.retry-banner-msg { flex: 1; }

/* ============================================================
   Tasks section
   ============================================================ */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.task-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  padding: 14px 16px;
}
.task-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.task-title {
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--text);
  flex: 1;
}
.task-status-badge {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 4px;
  padding: 2px 8px;
}
.badge-todo   { background: var(--todo-bg);  color: var(--todo-text);  border: 1px solid var(--border); }
.badge-doing  { background: var(--doing-bg); color: var(--doing-text); border: 1px solid var(--border); }
.badge-done   { background: var(--done-bg);  color: var(--done-text);  border: 1px solid var(--border); }

.task-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.task-meta code { font-size: 0.78rem; }
.task-proof {
  font-size: 0.8rem;
  color: var(--text-muted);
  border-left: 3px solid var(--border);
  padding-left: 10px;
  margin-bottom: 10px;
}
.task-actions { display: flex; gap: 8px; }

/* ============================================================
   Buttons
   ============================================================ */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.82rem;
  font-family: inherit;
  font-weight: 500;
  background: var(--btn-bg);
  color: var(--btn-text);
  border: 1px solid var(--btn-border);
  border-radius: 6px;
  padding: 5px 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s, color 0.12s;
}
.btn:hover { background: var(--btn-hover-bg); }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }

.empty-state {
  font-size: 0.88rem;
  color: var(--text-muted);
  padding: 14px 0;
}


### 🤖 Assistant

> 🔧 called: write_file

Now build the single-page onboarding HTML:

> 🔧 **write_file** — <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FirstHour — Harbor Orders Onboarding</title>
  <link rel="stylesheet" href="/onboarding.css" />
  <script src="/theme.js"></script>
</head>
<body>
<div class="page-wrap">

  <!-- ── Top bar ─────────────────────────────────────────────────── -->
  <header class="topbar">
    <div class="topbar-brand">First<span>Hour</span> &mdash; Harbor Orders</div>
    <div class="topbar-actions">
      <button class="btn" data-theme-btn onclick="__cycleTheme()" id="theme-toggle">Theme: System</button>
    </div>
  </header>

  <!-- ══════════════════════════════════════════════════════════════
       Section 1 — Overview
       ══════════════════════════════════════════════════════════════ -->
  <section class="section" id="overview">
    <div class="section-heading">
      <span class="section-num">1</span>
      <h2>Overview</h2>
    </div>

    <div class="overview-prose">
      <p>
        <strong>Harbor Orders</strong> is a small Express + SQLite API for managing
        orders across three harbour customers: Harbor Cafe, North Dock, and Blue Pier.
        There is no database server — SQLite runs entirely in-process via
        <code>sql.js</code> (pure WebAssembly).
      </p>

      <div class="arch-diagram" aria-label="Architecture flow diagram">
        <pre>
HTTP Request
    │
    ▼
Express Router  (src/app.js)
    │  validates input, calls db.prepare().get/.all/.run()
    ▼
sql.js in-memory DB  (RAM — fast synchronous reads)
    │  every write calls persist()
    ▼
harbor.db  (disk — survives restarts)
        </pre>
      </div>

      <p>
        <strong>Startup sequence:</strong> <code>src/server.js</code> calls
        <code>initDb()</code> which loads the WASM module, opens
        <code>harbor.db</code> from disk into memory, creates the orders table if it
        does not exist, and inserts three seed rows when the table is empty.
        Only after that promise resolves does Express begin listening.
      </p>

      <p>
        <strong>Reads</strong> are synchronous against the in-memory copy —
        effectively RAM speed. <strong>Writes</strong> call <code>persist()</code>
        which serialises the whole database and writes it to disk with
        <code>fs.writeFileSync</code>. This keeps the API simple with no async
        transaction management.
      </p>

      <p>
        <strong>Order status machine</strong> &mdash; one-way, no skipping, no reversal:
      </p>
      <div class="status-machine" aria-label="Status transitions: new to packed to shipped">
        <span class="state-badge state-new">new</span>
        <span class="state-arrow">&#8594;</span>
        <span class="state-badge state-packed">packed</span>
        <span class="state-arrow">&#8594;</span>
        <span class="state-badge state-shipped">shipped</span>
      </div>
      <p style="margin-top:10px">
        The transition map is a plain object in <code>src/app.js</code>:
        <code>{ new: 'packed', packed: 'shipped' }</code>.
        Any other transition returns HTTP&nbsp;400.
      </p>

      <p>
        <strong>Key files at a glance:</strong>
      </p>
      <ul style="padding-left:20px;color:var(--text)">
        <li><code>src/server.js</code> &mdash; process entry point, loads env + starts server</li>
        <li><code>src/app.js</code> &mdash; Express routes, validation, status machine</li>
        <li><code>src/db.js</code> &mdash; sql.js wrapper, <code>initDb()</code>, <code>persist()</code></li>
        <li><code>src/onboarding.js</code> &mdash; this onboarding UI + its API endpoints</li>
        <li><code>docs/RUNBOOK.md</code> &mdash; authoritative setup instructions</li>
        <li><code>docs/ARCHITECTURE.md</code> &mdash; architecture deep-dive</li>
      </ul>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════════
       Section 2 — Setup checks
       ══════════════════════════════════════════════════════════════ -->
  <section class="section" id="setup">
    <div class="section-heading">
      <span class="section-num">2</span>
      <h2>Setup</h2>
    </div>

    <div class="retry-banner" id="retry-banner" role="alert">
      <span class="retry-banner-msg" id="retry-msg">Could not reach the server.</span>
      <button class="btn" onclick="runChecks()">Retry</button>
    </div>

    <div class="checks-controls">
      <button class="btn btn-primary" id="rerun-btn" onclick="runChecks()">Re-run checks</button>
      <span class="checks-summary" id="checks-summary"></span>
    </div>

    <ul class="check-list" id="checks" aria-live="polite" aria-label="Setup checks">
      <li class="loading-row" id="checks-loading">Checking setup&hellip;</li>
    </ul>
  </section>

  <!-- ══════════════════════════════════════════════════════════════
       Section 3 — Starter Tasks
       ══════════════════════════════════════════════════════════════ -->
  <section class="section" id="tasks">
    <div class="section-heading">
      <span class="section-num">3</span>
      <h2>Starter Tasks</h2>
    </div>

    <div id="tasks-container" aria-live="polite" aria-label="Starter tasks">
      <p class="loading-row">Loading tasks&hellip;</p>
    </div>
  </section>

</div><!-- /.page-wrap -->

<script>
/* ================================================================
   Utilities
   ================================================================ */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ================================================================
   Theme button initial label
   ================================================================ */
document.getElementById('theme-toggle').textContent = __themeLabel();

/* ================================================================
   Section 2 — Setup checks
   ================================================================ */
var checksRunning = false;

async function runChecks() {
  if (checksRunning) return;
  checksRunning = true;

  var btn = document.getElementById('rerun-btn');
  var list = document.getElementById('checks');
  var summary = document.getElementById('checks-summary');
  var banner = document.getElementById('retry-banner');
  var retryMsg = document.getElementById('retry-msg');

  btn.disabled = true;
  btn.textContent = 'Running\u2026';
  banner.classList.remove('visible');
  list.innerHTML = '<li class="loading-row">Checking setup\u2026</li>';
  summary.textContent = '';

  try {
    var controller = new AbortController();
    var tid = setTimeout(function () { controller.abort(); }, 3000);
    var resp;
    try {
      resp = await fetch('/api/onboarding/checks', { signal: controller.signal });
    } finally {
      clearTimeout(tid);
    }

    if (!resp.ok) {
      throw new Error('Server returned ' + resp.status);
    }

    var checks = await resp.json();
    banner.classList.remove('visible');

    var passCount = checks.filter(function (c) { return c.ok; }).length;
    summary.textContent = passCount + ' / ' + checks.length + ' passed';

    list.innerHTML = checks.map(function (c) {
      var cls = c.ok ? 'check-pass' : 'check-fail';
      var icon = c.ok ? '\u2713' : '\u2717';
      return '<li class="check-item ' + cls + '">'
        + '<span class="check-icon" aria-hidden="true">' + icon + '</span>'
        + '<div class="check-body">'
        + '<div class="check-label">' + esc(c.label) + '</div>'
        + '<div class="check-detail">' + esc(c.detail) + '</div>'
        + '</div></li>';
    }).join('');

  } catch (err) {
    var msg = err.name === 'AbortError'
      ? 'Orders API did not respond in time.'
      : 'Could not reach the server: ' + err.message;
    retryMsg.textContent = msg;
    banner.classList.add('visible');
    list.innerHTML = '';
    summary.textContent = '';
  } finally {
    checksRunning = false;
    btn.disabled = false;
    btn.textContent = 'Re-run checks';
  }
}

/* ================================================================
   Section 3 — Starter tasks
   ================================================================ */
var taskState = {};

async function loadTasks() {
  var container = document.getElementById('tasks-container');
  try {
    var resp = await fetch('/api/onboarding/tasks');
    if (!resp.ok) throw new Error('Server returned ' + resp.status);
    var tasks = await resp.json();
    renderTasks(tasks);
  } catch (err) {
    container.innerHTML = '<p class="loading-row" style="color:var(--fail-text)">Failed to load tasks: ' + esc(err.message) + '</p>';
  }
}

function renderTasks(tasks) {
  var container = document.getElementById('tasks-container');

  if (!tasks || tasks.length === 0) {
    container.innerHTML = '<p class="empty-state">No starter tasks yet.</p>';
    return;
  }

  tasks.forEach(function (t) { taskState[t.id] = t.status; });

  container.innerHTML = '<div class="task-list">'
    + tasks.map(function (t) { return renderTaskCard(t); }).join('')
    + '</div>';
}

function renderTaskCard(t) {
  var status = taskState[t.id] || 'todo';
  var badgeCls = 'badge-' + status;
  var statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  var actions = '';
  if (status !== 'todo') {
    actions += '<button class="btn" onclick="patchTask(' + JSON.stringify(esc(t.id)) + ',\'todo\')" data-task-action="' + esc(t.id) + '-todo">Mark todo</button>';
  }
  if (status !== 'doing') {
    actions += '<button class="btn" onclick="patchTask(' + JSON.stringify(esc(t.id)) + ',\'doing\')" data-task-action="' + esc(t.id) + '-doing">Mark doing</button>';
  }
  if (status !== 'done') {
    actions += '<button class="btn btn-primary" onclick="patchTask(' + JSON.stringify(esc(t.id)) + ',\'done\')" data-task-action="' + esc(t.id) + '-done">Mark done</button>';
  }

  return '<div class="task-card" id="task-card-' + esc(t.id) + '">'
    + '<div class="task-card-header">'
    + '<div class="task-title">' + esc(t.title) + '</div>'
    + '<span class="task-status-badge ' + badgeCls + '" id="badge-' + esc(t.id) + '">' + esc(statusLabel) + '</span>'
    + '</div>'
    + '<div class="task-meta">File: <code>' + esc(t.file) + '</code></div>'
    + '<div class="task-proof">Proof: ' + esc(t.proof) + '</div>'
    + '<div class="task-actions" id="actions-' + esc(t.id) + '">' + actions + '</div>'
    + '</div>';
}

async function patchTask(id, newStatus) {
  // Disable all action buttons on that card immediately
  var actionsEl = document.getElementById('actions-' + id);
  if (actionsEl) {
    actionsEl.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
  }

  try {
    var resp = await fetch('/api/onboarding/tasks/' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!resp.ok) {
      var body = await resp.json().catch(function () { return {}; });
      throw new Error(body.error || 'Server returned ' + resp.status);
    }

    var row = await resp.json();
    taskState[id] = row.status;

    // Re-render just this card in place
    var card = document.getElementById('task-card-' + id);
    if (card) {
      var task = { id: id, title: card.querySelector('.task-title').textContent,
                   file: card.querySelector('.task-meta code').textContent,
                   proof: card.querySelector('.task-proof').textContent.replace(/^Proof: /, ''),
                   status: row.status };
      card.outerHTML = renderTaskCard(task);
    }
  } catch (err) {
    alert('Could not update task: ' + err.message);
    if (actionsEl) {
      actionsEl.querySelectorAll('button').forEach(function (b) { b.disabled = false; });
    }
  }
}

/* ================================================================
   Initialise on load
   ================================================================ */
document.addEventListener('DOMContentLoaded', function () {
  runChecks();
  loadTasks();
});
</script>
</body>
</html>


### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[x] Read existing codebase to understand current structure
[x] Add GET /api/onboarding/checks endpoint + tasks endpoints (src/onboarding.js)
[x] Update src/db.js to add onboarding_progress table
[x] Update src/app.js to mount router and static middleware
[x] Build the onboarding UI served at / (single polished screen with 3 sections)
[-] Add docs/ARCHITECTURE.md
[ ] Add docs/STARTER_TASKS.md
[ ] Update README.md (move stale content to docs/STALE_README.md)


### 🤖 Assistant

> 🔧 called: write_file



> 🔧 **write_file** — # Harbor Orders — Architecture

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


### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[x] Read existing codebase to understand current structure
[x] Add GET /api/onboarding/checks endpoint + tasks endpoints (src/onboarding.js)
[x] Update src/db.js to add onboarding_progress table
[x] Update src/app.js to mount router and static middleware
[x] Build the onboarding UI served at / (single polished screen with 3 sections)
[x] Add docs/ARCHITECTURE.md
[-] Add docs/STARTER_TASKS.md
[ ] Update README.md (move stale content to docs/STALE_README.md)


### 🤖 Assistant

> 🔧 called: write_file



> 🔧 **write_file** — # Harbor Orders — Starter Tasks

Five hands-on tasks to get familiar with the codebase. Each one targets a real file and requires a real code change. Complete them in order — each builds on knowledge from the last.

---

## Task 1 — Add a new customer to the seed data

**File:** `src/db.js`

**What to do:**  
Inside `initDb()`, after the three existing `run(...)` seed inserts, add a fourth insert for a new customer. Choose any name that fits the harbour theme (e.g. `"East Wharf"`).

**How to prove it worked:**  
Restart the server (Ctrl-C, then `npm start`), then run:

```bash
curl http://localhost:3000/api/orders
```

The response should include an order for your new customer with status `"new"`.

**Hint:**  
The seed block runs only when the `orders` table is empty. Delete `data/harbor.db` before restarting so the seed block executes again.

---

## Task 2 — Raise the maximum quantity to 50

**File:** `src/app.js`

**What to do:**  
Find the `POST /api/orders` validation block. Change `quantity > 20` to `quantity > 50`.

**How to prove it worked:**

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customer":"Harbor Cafe","item":"Test Item","quantity":35}'
```

Should return HTTP 201 with the new order. Before your change it returned 400.

---

## Task 3 — Add a GET /api/orders/:id route

**File:** `src/app.js`

**What to do:**  
Add a new route between the existing `GET /api/orders` and `POST /api/orders` handlers:

```js
app.get('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'order not found' });
  res.json(order);
});
```

**How to prove it worked:**

```bash
curl http://localhost:3000/api/orders/1
```

Should return a single order object. `curl http://localhost:3000/api/orders/999` should return 404.

---

## Task 4 — Add a "delivered" status

**File:** `src/app.js`

**What to do:**  
1. Add `'delivered'` to the `VALID_STATUSES` array.  
2. Add `shipped: 'delivered'` to the `STATUS_TRANSITIONS` map.

**How to prove it worked:**  
First, advance an order to `shipped`:

```bash
# Advance order 1: new → packed
curl -X PATCH http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"packed"}'

# Advance order 1: packed → shipped
curl -X PATCH http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"shipped"}'

# Now advance to delivered
curl -X PATCH http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"delivered"}'
```

The last call should return 200 with `"status": "delivered"`.

---

## Task 5 — Log DB path and port on startup

**File:** `src/server.js`

**What to do:**  
Inside the `.then()` callback (just before or after `app.listen`), add two `console.log` calls:

```js
console.log(`DB path : ${process.env.DB_PATH || 'data/harbor.db'}`);
console.log(`Port    : ${PORT}`);
```

**How to prove it worked:**  
Run `npm start`. The terminal should print both lines before (or alongside) the `listening` line:

```
DB path : data/harbor.db
Port    : 3000
Harbor Orders API listening on port 3000
```

---

## Tracking your progress

Use the **Starter Tasks** section on the onboarding page (`http://localhost:3000`) to mark each task `todo`, `doing`, or `done`. The status is stored in the database and persists across restarts.


### 🤖 Assistant

> 🔧 called: execute_command

Now move the stale README and write the new one:

> 🔧 **execute_command** — Copy-Item README.md docs/STALE_README.md

### 🤖 Assistant

> 🔧 called: write_file



> 🔧 **write_file** — # Harbor Orders

A small Express + SQLite API for managing orders across three harbour customers.
No database server required — SQLite runs entirely in-process via [sql.js](https://sql-js.github.io/sql.js/) (pure WebAssembly).

## Requirements

- Node.js 20 or later
- No other runtime dependencies (no PostgreSQL, no Redis, no native addons)

## Quick Start

```bash
# 1. Clone the repo and install dependencies
npm install

# 2. Create your local env file
cp .env.example .env

# 3. Start the server
npm start
```

Open **http://localhost:3000** — the onboarding page walks you through the setup and offers five starter tasks.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | TCP port the server listens on |
| `DB_PATH` | `data/harbor.db` | Path to the SQLite database file |

The database file is created automatically on first run. The `data/` directory is created if it does not exist.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check — returns `{ "ok": true }` |
| GET | `/api/orders` | List all orders |
| POST | `/api/orders` | Create an order |
| PATCH | `/api/orders/:id` | Advance order status |
| GET | `/api/onboarding/checks` | Run five local setup checks |
| GET | `/api/onboarding/tasks` | List starter tasks with progress |
| PATCH | `/api/onboarding/tasks/:id` | Update starter task status |

### Order status machine

Orders follow a strict one-way chain:

```
new  →  packed  →  shipped
```

Any other transition returns HTTP 400.

### Validation (POST /api/orders)

| Field | Rule |
|-------|------|
| `customer` | Non-empty string |
| `item` | Non-empty string |
| `quantity` | Integer, 1–20 inclusive |

## Docs

| File | Purpose |
|------|---------|
| [`docs/RUNBOOK.md`](docs/RUNBOOK.md) | Operational setup and startup instructions |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Architecture deep-dive |
| [`docs/STARTER_TASKS.md`](docs/STARTER_TASKS.md) | Five starter tasks for new developers |
| [`docs/STALE_README.md`](docs/STALE_README.md) | Original (stale) README — kept for reference |

## License

MIT


### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[x] Read existing codebase to understand current structure
[x] Add GET /api/onboarding/checks endpoint + tasks endpoints (src/onboarding.js)
[x] Update src/db.js to add onboarding_progress table
[x] Update src/app.js to mount router and static middleware
[x] Build the onboarding UI served at / (single polished screen with 3 sections)
[x] Add docs/ARCHITECTURE.md
[x] Add docs/STARTER_TASKS.md
[x] Update README.md (move stale content to docs/STALE_README.md)


### 🤖 Assistant

> 🔧 called: execute_command

Now let's validate by starting the server and running a quick smoke test:

> 🔧 **execute_command** — npm start

### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — Start-Sleep -Seconds 3; Write-Host "waited"

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — C:\Users\yasar\AppData\Local\Temp\bob-task-outputs\4943c29985c7a0f561a7799be6654d37\processes\bob_execute_command_7f1618c0-8764-4969-a415-79c1fd5e4a3c.log

### 🤖 Assistant

> 🔧 called: execute_command

The process exited immediately. Let me check for startup errors:

> 🔧 **execute_command** — node src/server.js 2>&1 | Select-Object -First 30

### 🤖 Assistant

> 🔧 called: execute_command

Port 3000 is still in use by the background process — so the server actually started successfully (EADDRINUSE means something is already listening). Let me verify it's healthy:

> 🔧 **execute_command** — $r = Invoke-WebRequest -Uri http://localhost:3000/api/health -UseBasicParsing; Write-Host "Status: $($r.StatusCode)"; Write-Host $r.Content

### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — $r = Invoke-WebRequest -Uri http://localhost:3000/api/onboarding/checks -UseBasicParsing; Write-Host "Status: $($r.StatusCode)"; $r.Content | ConvertFrom-Json | Format-Table id, ok, detail

### 🤖 Assistant

> 🔧 called: execute_command

The old server instance (started before the new code) is still running. Let me kill it and restart:

> 🔧 **execute_command** — Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess) -Force -ErrorAction SilentlyContinue; Write-Host "killed"

### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — Start-Sleep -Seconds 1; node src/server.js

### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — Start-Sleep -Seconds 3; Invoke-WebRequest -Uri http://localhost:3000/api/health -UseBasicParsing | Select-Object -ExpandProperty Content

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — C:\Users\yasar\AppData\Local\Temp\bob-task-outputs\4943c29985c7a0f561a7799be6654d37\processes\bob_execute_command_c8796d66-9444-49b1-b70d-00893362a670.log

### 🤖 Assistant

> 🔧 called: execute_command

The log is empty — process exited immediately. Let me run it directly to see the error:

> 🔧 **execute_command** — node -e "require('./src/app')" 2>&1

### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — node -e "require('dotenv').config(); const {initDb}=require('./src/db'); initDb().then(()=>console.log('DB OK')).catch(e=>console.error('DB fail',e.message))"

### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — node src/server.js 2>&1; Write-Host "exit: $LASTEXITCODE"

---

### 👤 User

is it completed or still running ?

---

### 🤖 Assistant

> 🔧 called: execute_command

The server is running — it printed `Harbor Orders API listening on port 3000` and is still active. The command was cancelled by the timeout.

Let me do a proper end-to-end smoke test to confirm everything is working:

> 🔧 **execute_command** — true

### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — Start-Sleep -Seconds 3; Write-Host "--- health ---"; (Invoke-WebRequest http://localhost:3000/api/health -UseBasicParsing).Content; Write-Host "--- checks ---"; (Invoke-WebRequest http://localhost:3000/api/onboarding/checks -UseBasicParsing).Content; Write-Host "--- tasks ---"; (Invoke-WebRequest http://localhost:3000/api/onboarding/tasks -UseBasicParsing).Content; Write-Host "--- / (UI) ---"; $r=(Invoke-WebRequest http://localhost:3000/ -UseBasicParsing); Write-Host "Status: $($r.StatusCode), bytes: $($r.RawContentLength)"

### 🤖 Assistant

> 🔧 called: execute_command

Everything is working. Let me also verify the PATCH endpoint and 404 behaviour:

> 🔧 **execute_command** — true

### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — Start-Sleep -Seconds 3; Write-Host "--- PATCH task_max_quantity → doing ---"; $b='{"status":"doing"}'; (Invoke-WebRequest http://localhost:3000/api/onboarding/tasks/task_max_quantity -Method PATCH -Body $b -ContentType 'application/json' -UseBasicParsing).Content; Write-Host "--- PATCH unknown id → 404 ---"; try { Invoke-WebRequest http://localhost:3000/api/onboarding/tasks/nonexistent -Method PATCH -Body $b -ContentType 'application/json' -UseBasicParsing } catch { $_.Exception.Response.StatusCode.value__; $_.ErrorDetails.Message }; Write-Host "--- PATCH bad status → 400 ---"; $b2='{"status":"invalid"}'; try { Invoke-WebRequest http://localhost:3000/api/onboarding/tasks/task_max_quantity -Method PATCH -Body $b2 -ContentType 'application/json' -UseBasicParsing } catch { $_.Exception.Response.StatusCode.value__; $_.ErrorDetails.Message }

### 🤖 Assistant

All endpoints are verified. The implementation is **complete**. Here's a summary of everything that was built:

---

## What was implemented

### New files

| File | Purpose |
|------|---------|
| [`src/onboarding.js`](src/onboarding.js) | Express router — all onboarding API endpoints + serves `GET /` |
| [`public/theme.js`](public/theme.js) | Theme controller: reads `localStorage` key `firsthour-theme`, applies `dark`/`light` class to `<html>`, cycles Light→Dark→System |
| [`public/onboarding.css`](public/onboarding.css) | Full CSS with custom-property tokens for light, dark, and system themes |
| [`views/onboarding.html`](views/onboarding.html) | Single-page UI — Overview, Setup, Starter Tasks sections |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Architecture deep-dive from real code |
| [`docs/STARTER_TASKS.md`](docs/STARTER_TASKS.md) | Five starter tasks with hints |
| [`docs/STALE_README.md`](docs/STALE_README.md) | Original stale README preserved for the demo |

### Modified files

| File | Change |
|------|--------|
| [`src/db.js`](src/db.js) | Added `onboarding_tasks` table DDL in `initDb()` |
| [`src/app.js`](src/app.js) | Mounted `express.static('public')` + `onboarding` router |
| [`README.md`](README.md) | Rewritten with accurate Node 20+/sql.js setup, new API table, links to docs |

### Smoke test results (all passing ✓)

- `GET /api/health` → `{"ok":true}`
- `GET /api/onboarding/checks` → 5/5 checks pass, health check measured at 30 ms
- `GET /api/onboarding/tasks` → all 5 tasks returned with `"todo"` status
- `PATCH /api/onboarding/tasks/task_max_quantity` with `{status:"doing"}` → 200 with updated row
- `PATCH /api/onboarding/tasks/nonexistent` → **404** `{"error":"Task not found"}`
- `PATCH` with invalid status → **400** with error message
- `GET /` → 200, 13 KB HTML (the onboarding page)