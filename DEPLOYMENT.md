# Player Passport — Deployment Guide

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────>│   FastAPI     │────>│  PostgreSQL   │
│   (Vercel)   │     │   (Fly.io)   │     │  (Fly/Neon)   │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                     ┌─────┴─────┐
                     │  OpenAI   │
                     │  GPT-4o   │
                     └───────────┘
```

- **Frontend**: Next.js 14, deployed on Vercel
- **Backend**: FastAPI (Python 3.11), deployed on Fly.io
- **Database**: PostgreSQL 16 with pgvector
- **Auth**: Clerk (handles SSO, JWT)
- **AI**: OpenAI GPT-4o for report generation

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Fly.io CLI](https://fly.io/docs/flyctl/install/)
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)
- [Clerk](https://clerk.com) account with API keys
- [OpenAI](https://platform.openai.com) API key

## Local Development

### 1. Clone and configure

```bash
git clone https://github.com/ishaan2947/Player_Passport.git
cd Player_Passport
cp .env.example .env
# Fill in your API keys in .env
```

### 2. Start with Docker Compose

```bash
docker compose up -d --build
```

This starts:
- PostgreSQL on port 5432
- FastAPI backend on port 8000
- Next.js frontend on port 3000

### 3. Verify

```bash
curl http://localhost:8000/health
# {"status": "healthy"}

open http://localhost:3000
```

### 4. Run without Docker

**Backend:**
```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://pp_user:pp_password@localhost:5432/playerpassport
uvicorn src.main:app --reload --port 8000
```

**Frontend:**
```bash
cd apps/web
npm install --legacy-peer-deps
npm run dev
```

## Database Migrations

Migrations are managed with Alembic and run automatically on API startup via `scripts/start.sh`.

To run manually:
```bash
cd apps/api
alembic upgrade head
```

To create a new migration:
```bash
alembic revision --autogenerate -m "description"
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR:

| Job | Trigger | What it does |
|-----|---------|--------------|
| `frontend-lint` | All pushes/PRs | ESLint + TypeScript type check |
| `backend-lint` | All pushes/PRs | Ruff linter/formatter + pytest |
| `frontend-build` | After lint passes | `next build` verification |
| `backend-build` | After lint passes | Docker image build |
| `integration-tests` | Main branch only | Docker Compose up + health checks |
| `deploy-staging` | Develop branch | Fly.io + Vercel preview deploy |
| `deploy-production` | Main branch (after integration) | Fly.io + Vercel production deploy |

### Required GitHub Secrets

Add these in **Settings > Secrets and variables > Actions**:

| Secret | Required For | Description |
|--------|-------------|-------------|
| `FLY_API_TOKEN` | Deployment | Fly.io API token (`fly tokens create deploy`) |
| `FLY_APP_NAME_STAGING` | Staging | Fly.io app name for staging |
| `FLY_APP_NAME_PRODUCTION` | Production | Fly.io app name for production |
| `VERCEL_TOKEN` | Frontend deploy | Vercel access token |
| `VERCEL_ORG_ID` | Frontend deploy | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Frontend deploy | Vercel project ID |

## Production Deployment

### Backend (Fly.io)

```bash
cd apps/api

# First time setup
fly launch --name player-passport-api
fly secrets set \
  DATABASE_URL="your-production-db-url" \
  CLERK_SECRET_KEY="sk_live_..." \
  CLERK_PUBLISHABLE_KEY="pk_live_..." \
  OPENAI_API_KEY="sk-..." \
  ENVIRONMENT=production

# Deploy
fly deploy
```

### Frontend (Vercel)

```bash
cd apps/web
vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` = `https://your-api.fly.dev`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_...`
- `CLERK_SECRET_KEY` = `sk_live_...`

### Database (Fly Postgres or Neon)

**Option A: Fly Postgres**
```bash
fly postgres create --name player-passport-db
fly postgres attach player-passport-db --app player-passport-api
```

**Option B: Neon (recommended for serverless)**
1. Create a database at [neon.tech](https://neon.tech)
2. Set the `DATABASE_URL` secret in Fly.io

## Monitoring

- **API health**: `GET /health` — returns 200 or 503
- **API status**: `GET /status` — returns DB counts, config check
- **Fly.io logs**: `fly logs --app player-passport-api`
- **Vercel logs**: Vercel dashboard > Deployments > Logs

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API returns 503 | Check `DATABASE_URL` and DB connectivity |
| CORS errors | Verify `ALLOWED_ORIGINS` in API config |
| Auth failures | Verify Clerk keys match between frontend/backend |
| Report generation fails | Check `OPENAI_API_KEY` is valid and has credits |
| Migration errors | Run `alembic upgrade head` manually, check migration files |
