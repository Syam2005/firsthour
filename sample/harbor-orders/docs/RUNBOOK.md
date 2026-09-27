# Harbor Orders — Runbook

> **Note:** The README says Postgres. The code uses SQLite via sql.js.
> This is a known documentation drift — a perfect FirstHour demo target.

## Actual Setup

```bash
cd sample/harbor-orders
npm install
npm start
```

No database installation needed. sqlite is embedded via sql.js (WASM).

## Environment

No `.env` file is required for the default setup.
Optional: create a `.env` with `PORT=3000` and `DB_PATH=data/harbor.db`.

## API

```
GET  /api/health
GET  /api/orders
POST /api/orders      { customer, item, quantity }
PATCH /api/orders/:id { status }
```

## Status Flow

new → packed → shipped
