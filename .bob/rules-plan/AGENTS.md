# Project Architecture Rules (Non-Obvious Only)

- **sql.js is in-memory + manual flush**: all reads hit RAM, all writes call `persist()` → `fs.writeFileSync`. There is no connection pooling, no WAL mode, no transactions wrapping the seed. Concurrent writes are safe only because Node.js is single-threaded.
- **`initDb()` is the single async seam**: the rest of the codebase is synchronous. Any future background jobs or scheduled tasks must await this before touching `db`.
- **`app.js` has no knowledge of the DB lifecycle** — it imports `{ db }` and uses it synchronously, relying on `server.js` to guarantee `initDb()` ran first. This coupling is intentional and must be preserved.
- **`STATUS_TRANSITIONS` is the authoritative state machine** — adding new statuses requires updating this map and `VALID_STATUSES` array; both must stay in sync.
- **`PROJECT.md` describes future work**: Onboarding UI, dark/light/system theme, health check 3 s timeout. None of these exist yet — plan new features against this spec.
- **`README.md` staleness is a feature, not a bug**: the FirstHour scenario requires a broken README to demonstrate the onboarding problem. Any future Onboarding UI work depends on this existing mismatch.
