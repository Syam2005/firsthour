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

---

## Deploying to Render

### Prerequisites
- A [Render](https://render.com) account
- This repository pushed to **GitHub** or **GitLab**
- Credentials for: GitHub OAuth app, Supabase project, watsonx.ai

### Step 1 — Push to a remote repository

```bash
# create a new repo on GitHub, then:
git remote add origin https://github.com/<your-org>/firsthour.git
git push -u origin master
```

### Step 2 — Create services via Blueprint (recommended)

Render reads `render.yaml` automatically when you use the **Blueprint** workflow:

1. Go to **render.com → New → Blueprint**
2. Connect your GitHub/GitLab account and select the `firsthour` repository
3. Render detects `render.yaml` and proposes two services: `firsthour-backend` and `firsthour-frontend`
4. Click **Apply** — Render will prompt you to fill in the `sync: false` environment variables (see below)

### Step 3 — Fill in environment variables

After clicking Apply, set these **secret** variables in the Render dashboard for each service:

#### `firsthour-backend`
| Variable | Where to get it |
|---|---|
| `SESSION_SECRET` | Any long random string (e.g. `openssl rand -hex 32`) |
| `FRONTEND_ORIGIN` | The public URL of your `firsthour-frontend` service, e.g. `https://firsthour-frontend.onrender.com` |
| `GITHUB_CLIENT_ID` | GitHub → Settings → Developer settings → OAuth Apps → New |
| `GITHUB_CLIENT_SECRET` | Same OAuth App |
| `GITHUB_CALLBACK_URL` | `https://<backend-url>.onrender.com/api/auth/github/callback` |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → Personal access tokens |
| `SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `SUPABASE_SECRET_KEY` | Supabase project → Settings → API → `service_role` key |
| `WATSONX_URL` | e.g. `https://us-south.ml.cloud.ibm.com` |
| `WATSONX_PROJECT_ID` | watsonx.ai project ID |
| `WATSONX_API_KEY` | IBM Cloud API key with watsonx.ai access |

#### `firsthour-frontend`
| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_API_URL` | The public URL of your `firsthour-backend` service, e.g. `https://firsthour-backend.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project URL as above |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase project → Settings → API → `anon` key |

### Step 4 — Verify

Once both services are **Live**:

```bash
# health check
curl https://<backend-url>.onrender.com/api/health
# → {"ok":true}
```

Then open the frontend URL in a browser and sign in with GitHub.

### Notes
- Render assigns `PORT` automatically — do **not** hard-code a port.
- The free tier spins down after inactivity; upgrade to a paid instance type to keep services always-on.
- `NODE_ENV=production` is already set in `render.yaml`; the backend will require secure cookies over HTTPS.
