# Project Coding Rules (Non-Obvious Only)

- **sql.js not better-sqlite3**: `package.json` lists `sql.js` as the runtime dep. `better-sqlite3` is in the spec description but requires native compilation (no C++ toolset on this machine). The wrapper in `src/db.js` exposes the same `.prepare().get/all/run()` API.
- **`initDb()` is async** — do NOT call any `db.prepare(...)` before `await initDb()` resolves. The `db` object exists but `_db` is null until then.
- **Every write calls `persist()`** which does a synchronous `fs.writeFileSync`. Do not skip this or data will be lost on restart.
- **App and server are split**: `src/app.js` exports the Express `app` without calling `listen`. `src/server.js` owns the lifecycle. Tests should `require('./app')` directly without starting a port.
- **Error middleware order matters**: The JSON parse error handler (`err.type === 'entity.parse.failed'`) must appear both as a 4-arg middleware registered after `express.json()` AND in the global error handler at the bottom of `app.js` — Express can deliver the parse error to either location depending on version.
- **Status transitions are enforced via `STATUS_TRANSITIONS` map** in `src/app.js` — not a list, a map `{ new: 'packed', packed: 'shipped' }`. Adding `shipped` as a key would allow a cycle; don't.
- **`quantity` must pass `Number.isInteger()`** — `"3"` (string) and `3.5` (float) are both rejected.
