# Harbor Orders

A REST API for managing harbor orders.

## Setup

You need PostgreSQL 14+ installed and running.

```bash
psql -U postgres -c "CREATE DATABASE harbor_orders;"
npm install
npm start
```

## Environment Variables

Create a `.env` file:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/harbor_orders
PORT=3000
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/orders | List all orders |
| POST | /api/orders | Create order |
| PATCH | /api/orders/:id | Advance status |

## Status flow

new → packed → shipped
