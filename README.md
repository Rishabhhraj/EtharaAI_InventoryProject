# Inventory & Order Management System

A full-stack application for managing **products**, **customers**, **orders**, and **inventory tracking**, built per assessment requirements.

## Features

| Requirement | Implementation |
|-------------|----------------|
| Python API (FastAPI) | REST API under `/api` with OpenAPI docs at `/docs` |
| React frontend | Responsive SPA with dashboard, CRUD, and order placement |
| PostgreSQL | Persistent storage for products, customers, orders |
| Unique SKU | `products.sku` unique constraint + 409 on duplicate |
| Unique email | `customers.email` unique constraint + 409 on duplicate |
| Inventory validation | Stock checked before order commit |
| Auto stock reduction | Stock decremented atomically on order placement |
| Block insufficient stock | Order rejected with 400 if quantity exceeds stock |
| Docker + Compose | Multi-service `docker-compose.yml` |
| Environment variables | No hardcoded credentials; see `.env.example` |

## Project structure

```
├── backend/          # FastAPI + SQLAlchemy
├── frontend/         # React + Vite + TypeScript
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick start (Docker Compose)

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

2. Start all services:

   ```bash
   docker compose up --build
   ```

3. Open the app:

   - **Frontend:** http://localhost
   - **API:** http://localhost:8000
   - **API docs:** http://localhost:8000/docs
   - **Health:** http://localhost:8000/health

## Local development (without Docker)

### Database

Run PostgreSQL and set `DATABASE_URL` in `backend/.env` (see `backend/.env.example`).

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173 (API URL defaults to `http://localhost:8000`).

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/products` | List / create products |
| GET/PATCH/DELETE | `/api/products/{id}` | Product detail / update / delete |
| GET/POST | `/api/customers` | List / create customers |
| GET/PATCH/DELETE | `/api/customers/{id}` | Customer detail / update / delete |
| GET/POST | `/api/orders` | List / place order (validates & reduces stock) |
| GET | `/api/orders/{id}` | Order detail |
| GET | `/api/inventory` | Inventory snapshot with low-stock flags |

### Place order example

```json
POST /api/orders
{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 2 }
  ]
}
```

If stock is insufficient, the API returns `400` with a clear message and **does not** create the order.

## Docker image (submission)

Build and push to Docker Hub (replace `yourusername`):

```bash
docker build -t yourusername/inventory-api:latest ./backend
docker build -t yourusername/inventory-frontend:latest ./frontend --build-arg VITE_API_URL=https://your-api.onrender.com

docker push yourusername/inventory-api:latest
docker push yourusername/inventory-frontend:latest
```

**Docker image link format:** `https://hub.docker.com/r/yourusername/inventory-api`

## Live demo

Deploy with **[DEPLOYMENT.md](./DEPLOYMENT.md)** — recommended free stack: **Neon** (database) + **Render** (API) + **Vercel** (frontend).

| | URL |
|---|-----|
| **App** | _Add your Vercel URL after deploy_ |
| **API** | _Add your Render URL after deploy_ |
| **API docs** | `https://YOUR-API.onrender.com/docs` |
| **GitHub** | https://github.com/Rishabhhraj/EtharaAI_InventoryProject |

## Submission checklist

- [x] **GitHub repository** — [EtharaAI_InventoryProject](https://github.com/Rishabhhraj/EtharaAI_InventoryProject)
- [ ] **Docker image link** — GitHub Actions → Docker Hub (see [DEPLOYMENT.md](./DEPLOYMENT.md))
- [ ] **Live URLs** — fill in the table above after deploy

## Tech stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** React 18, TypeScript, Vite, React Router
- **DevOps:** Docker, Docker Compose, environment-based configuration

## License

MIT
