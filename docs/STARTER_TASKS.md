# Harbor Orders — Starter Tasks

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
