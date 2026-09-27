# Project Documentation Context (Non-Obvious Only)

- **`README.md` is deliberately wrong**: it says Postgres and omits `.env` steps. This is the FirstHour problem scenario — do not "fix" it.
- **`docs/RUNBOOK.md` is the authoritative setup guide**: SQLite file path, PORT env var, correct startup steps.
- **`src/db.js` is not a thin wrapper** — it contains all schema DDL, seed logic, disk persistence, and the sql.js init. It is the most complex file despite its short name.
- **No test files exist yet** — there is no `__tests__` folder, no Jest/Mocha config. Do not assume tests pass.
- **`PROJECT.md`** describes the full vision (Onboarding UI, themes, etc.) but only the Harbor Orders API has been built so far.
