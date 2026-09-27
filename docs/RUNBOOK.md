# Harbor Orders Runbook

## Database

The API uses **SQLite**. The database file is created automatically at the path specified by `DB_PATH` (default: `data/harbor.db`). No database server is required.

## Environment Variables

Copy `.env.example` to `.env` and set values before starting:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | TCP port the server listens on |
| `DB_PATH` | `data/harbor.db` | Path to the SQLite database file |

```bash
cp .env.example .env
```

## Starting the Server

```bash
npm install
npm start
```

## Health Check

```bash
curl http://localhost:3000/api/health
# {"ok":true}
```

## Status Transitions

Orders follow a one-way state machine: `new` → `packed` → `shipped`. Reverse or skip transitions are rejected with HTTP 400.
