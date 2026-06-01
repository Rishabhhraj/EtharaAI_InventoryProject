# Free deployment guide (recommended stack)

Best free setup for this project:

| Layer | Service | Why |
|-------|---------|-----|
| **Database** | [Neon](https://neon.tech) | Free PostgreSQL, no sleep, SSL, generous limits |
| **Backend API** | [Render](https://render.com) | Free web service, GitHub deploy, health checks |
| **Frontend** | [Vercel](https://vercel.com) | Free Vite/React hosting, fast CDN, preview URLs |

Repo: [github.com/Rishabhhraj/EtharaAI_InventoryProject](https://github.com/Rishabhhraj/EtharaAI_InventoryProject)

---

## Architecture

```
Browser  →  Vercel (React)  →  Render (FastAPI)  →  Neon (PostgreSQL)
```

---

## Step 1 — PostgreSQL on Neon (5 min)

1. Sign up at [neon.tech](https://neon.tech).
2. **New project** → name e.g. `ethara-inventory`.
3. Copy the **connection string** (pooled recommended), e.g.  
   `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
4. Keep this for Render `DATABASE_URL`.

Optional: run tables automatically when the API starts (already built in). After deploy, seed data:

```bash
API_URL=https://YOUR-API.onrender.com python scripts/seed_test_data.py
```

---

## Step 2 — Backend on Render (10 min)

### Option A — Blueprint (easiest)

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect GitHub repo `EtharaAI_InventoryProject`.
3. Render reads `render.yaml` and creates **ethara-inventory-api**.
4. Set environment variables when prompted:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Neon connection string (paste full URL) |
| `CORS_ORIGINS` | Your Vercel URL (set after Step 3), e.g. `https://ethara-inventory.vercel.app` |

`CORS_ORIGIN_REGEX` is pre-set to `https://.*\.vercel\.app` for preview deployments.

5. Deploy → copy API URL, e.g. `https://ethara-inventory-api.onrender.com`.

### Option B — Manual web service

1. **New** → **Web Service** → connect repo.
2. **Root directory:** `backend`
3. **Runtime:** Python 3
4. **Build:** `pip install -r requirements.txt`
5. **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. **Health check path:** `/health`
7. Add the same env vars as above.

### Verify API

- Health: `https://YOUR-API.onrender.com/health`
- Docs: `https://YOUR-API.onrender.com/docs`

**Note:** Free Render services spin down after ~15 min idle; first request may take 30–60s (cold start).

---

## Step 3 — Frontend on Vercel (5 min)

1. Sign up at [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Import `EtharaAI_InventoryProject` from GitHub.
3. Configure:

| Setting | Value |
|---------|--------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. **Environment variables:**

| Name | Value |
|------|--------|
| `VITE_API_URL` | `https://YOUR-API.onrender.com` (no trailing slash) |

5. **Deploy** → copy URL, e.g. `https://ethara-inventory.vercel.app`.

---

## Step 4 — Link CORS (required)

1. Render dashboard → your API service → **Environment**.
2. Update `CORS_ORIGINS` to your exact Vercel URL:

   ```
   https://ethara-inventory.vercel.app
   ```

   Multiple origins: comma-separated, no spaces required (spaces are trimmed).

3. **Save** → Render redeploys automatically.

Open the Vercel URL — dashboard should load products/customers without CORS errors.

---

## Step 5 — Docker Hub (assessment submission)

GitHub Actions publishes images on every push to `main` (see `.github/workflows/docker-publish.yml`).

1. GitHub repo → **Settings** → **Secrets** → add:
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN` (Docker Hub access token)

2. Push to `main` → Actions builds:
   - `YOUR_USER/ethara-inventory-api`
   - `YOUR_USER/ethara-inventory-frontend`

3. Submission link example:  
   `https://hub.docker.com/r/YOUR_USER/ethara-inventory-api`

Manual build:

```bash
docker build -t YOUR_USER/ethara-inventory-api:latest ./backend
docker build -t YOUR_USER/ethara-inventory-frontend:latest ./frontend \
  --build-arg VITE_API_URL=https://YOUR-API.onrender.com
docker push YOUR_USER/ethara-inventory-api:latest
docker push YOUR_USER/ethara-inventory-frontend:latest
```

---

## Submission checklist

| Deliverable | Where |
|-------------|--------|
| GitHub repo | https://github.com/Rishabhhraj/EtharaAI_InventoryProject |
| Docker images | Docker Hub + Actions workflow |
| Live frontend URL | Vercel project URL |
| Live API URL | Render service URL |

Add live URLs to `README.md` after deploy:

```markdown
## Live demo
- **App:** https://your-app.vercel.app
- **API:** https://your-api.onrender.com
- **API docs:** https://your-api.onrender.com/docs
```

---

## Environment reference

### Backend (Render)

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Neon connection string |
| `CORS_ORIGINS` | Yes | `https://your-app.vercel.app` |
| `CORS_ORIGIN_REGEX` | No | `https://.*\.vercel\.app` |
| `PORT` | Auto | Set by Render |
| `DEBUG` | No | `false` |

### Frontend (Vercel)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_URL` | Yes | `https://your-api.onrender.com` |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error in browser | Set `CORS_ORIGINS` on Render to exact Vercel URL; redeploy API |
| API 502 / timeout | Free tier cold start — wait 60s and retry |
| Database connection failed | Use Neon **pooled** URL; ensure `sslmode=require` in URL |
| Empty UI / network error | `VITE_API_URL` must be set **before** Vercel build; redeploy frontend after changing it |
| Render build fails | Confirm root dir `backend` and Python 3.12 |

---

## Alternative: all-in-one Docker on Render

Use `docker-compose.yml` locally only. For cloud, the Neon + Render + Vercel split avoids free-tier DB expiry and gives faster frontend CDN.

To run API as Docker on Render: **New Web Service** → **Docker** → Dockerfile path `backend/Dockerfile`.
