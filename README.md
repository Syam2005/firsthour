# FirstHour

A new developer does not know a codebase. The README may be missing or wrong, and `.env` may be missing. **FirstHour** accepts any public GitHub repository URL or a zip of a project folder and returns one onboarding brief, setup checks, and five starter tasks. GitHub login saves history.

## Impact

| | Before | With FirstHour |
|---|---|---|
| Understand the repo | Read a stale README and guess the folders | Architecture brief from the files that are actually there |
| Run it | Discover missing `.env` or the wrong database by trial and error | Setup checks mark each gap with conflict tags |
| First change | Ask a teammate what is safe | Five starter tasks, each with a file and a proof step |
| Time | ~45 minutes guessing from a stale README | One run: brief, green checks, and one chosen task |

---

## Repository layout

```
/backend              Express API (Node 22)
/frontend             Next.js UI
/sample/harbor-orders Sample app — README says Postgres, code uses SQLite, no .env
/supabase/schema.sql  Run once in Supabase SQL editor
/render.yaml          Two-service Render deployment blueprint
/README.md
/LICENSE              MIT
```

---

## Local setup

### 1. Prerequisites

- Node 22+
- A Supabase project (free tier works)
- A GitHub OAuth app
- An IBM watsonx.ai account

### 2. Environment variables

Copy `.env.example` to `.env` in the repo root and fill in the values:

```
SESSION_SECRET=<long random string>
FRONTEND_ORIGIN=http://localhost:3001

GITHUB_CLIENT_ID=<from github.com/settings/developers>
GITHUB_CLIENT_SECRET=<from github.com/settings/developers>
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
GITHUB_TOKEN=<personal access token with no scopes, for public repo reads>

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=<service role secret key>

WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_PROJECT_ID=<project id>
WATSONX_API_KEY=<ibm cloud api key>
WATSONX_MODEL=ibm/granite-3-8b-instruct
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are optional — the frontend never calls Supabase directly (only the backend does, using the secret key).

### 3. Supabase schema

Open **Supabase → SQL editor** and paste the contents of [`supabase/schema.sql`](supabase/schema.sql).  
This creates the `users` and `runs` tables, indexes, and enables Row Level Security.

### 4. GitHub OAuth app

Go to <https://github.com/settings/developers> → OAuth Apps → New OAuth App:

- **Authorization callback URL:** `http://localhost:3000/api/auth/github/callback` (for local dev)
- After deploying, update to: `https://<backend-url>/api/auth/github/callback`

### 5. Install and start

```bash
# Backend
cd backend
npm install
npm start          # http://localhost:3000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev        # http://localhost:3001
```

For production builds:

```bash
cd frontend && npm run build && npm start   # http://localhost:3001
```

### 6. Demo — Harbor Orders sample

The sample app intentionally has a stale README (says Postgres, code uses SQLite) and no `.env`. It demonstrates exactly what FirstHour is built to catch.

```bash
cd sample/harbor-orders
npm install
npm start          # http://localhost:3000
```

---

## Render deployment

`render.yaml` defines two web services. Push the repo to GitHub, connect it in Render, and Render will ask for all secrets marked `sync: false`.

After the frontend is deployed:
1. Copy the frontend URL.
2. Update `FRONTEND_ORIGIN` in the backend service to that URL.
3. Update `GITHUB_CALLBACK_URL` to `https://<backend-url>/api/auth/github/callback`.
4. Update the GitHub OAuth app callback URL to match.

---

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/auth/github/start` | Begin GitHub OAuth |
| GET | `/api/auth/github/callback` | GitHub OAuth callback |
| POST | `/api/auth/logout` | Destroy session |
| GET | `/api/auth/me` | Current user |
| POST | `/api/analyze/github` | Start analysis from URL |
| POST | `/api/analyze/upload` | Start analysis from zip |
| GET | `/api/runs/:id/events` | SSE agent progress stream |
| GET | `/api/runs` | History (auth required) |
| GET | `/api/runs/:id` | Single run |
| PATCH | `/api/runs/:id/tasks/:taskId` | Update task status |
| POST | `/api/runs/:id/checks` | Re-run setup checks |
| POST | `/api/runs/:id/chat` | Chat with watsonx.ai |

---

## Secrets reference

| Variable | Source | Notes |
|----------|--------|-------|
| `SESSION_SECRET` | Generate randomly | Used to sign express-session cookies |
| `GITHUB_CLIENT_ID` | GitHub OAuth app | `read:user` scope only |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app | Never exposed to frontend |
| `GITHUB_CALLBACK_URL` | Your backend URL | Must match GitHub app setting |
| `GITHUB_TOKEN` | GitHub PAT | No scopes needed for public repos |
| `SUPABASE_URL` | Supabase project | URL only, no `/rest/v1/` suffix |
| `SUPABASE_SECRET_KEY` | Supabase project | Service role key — backend only |
| `WATSONX_URL` | IBM Cloud | e.g. `https://us-south.ml.cloud.ibm.com` |
| `WATSONX_PROJECT_ID` | IBM Cloud | Your watsonx.ai project |
| `WATSONX_API_KEY` | IBM Cloud | IAM API key |
| `WATSONX_MODEL` | — | Default: `ibm/granite-3-8b-instruct` |
| `FRONTEND_ORIGIN` | Your frontend URL | For CORS — backend allows this origin |
| `PORT` | — | Backend port, default 3000 |

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` may be set in the frontend environment if you need the anon Supabase client in the UI. They are not required by the current implementation.

---

## License

MIT. Sample names in Harbor Orders (`Harbor Cafe`, `North Dock`, `Blue Pier`) are fictional. Do not put personal data, client data, or real credentials in this repository.
