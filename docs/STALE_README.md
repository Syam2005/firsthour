# Harbor Orders

A simple order management API for Harbor Cafe, North Dock, and Blue Pier.

## Requirements

- Node.js 18+
- PostgreSQL 14+

## Setup

```bash
npm install
npm start
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/orders | List all orders |
| POST | /api/orders | Create an order |
| PATCH | /api/orders/:id | Update order status |

## Database

This project uses **PostgreSQL**. Create a database and configure the connection string in your environment before starting.

## License

MIT
