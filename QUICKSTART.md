# Player Passport - Quick Start Guide

## Prerequisites

- **Docker Desktop** (v4.0+) installed and running
- **OpenAI API Key** (get one from https://platform.openai.com/api-keys)
- **Clerk Account** (optional for local dev, required for production)

## Quick Start (5 minutes)

### 1. Clone and Navigate

```bash
cd C:\Users\ishaa\OneDrive\Documents\Coach_AI\Explain_My_Game
```

### 2. Set Up Environment Variables

**Backend (`apps/api/.env`)**:
```env
DATABASE_URL=postgresql://emg_user:emg_password@postgres:5432/explain_my_game
OPENAI_API_KEY=sk-your-openai-key-here
CLERK_SECRET_KEY=sk_test_your-clerk-secret  # Optional for local dev
CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-key  # Optional for local dev
ENVIRONMENT=development
```

**Frontend (`apps/web/.env.local`)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-key  # Optional for local dev
CLERK_SECRET_KEY=sk_test_your-clerk-secret  # Optional for local dev
```

> **Note**: For local development, you can skip Clerk keys and use dev auth bypass.

### 3. Start All Services

```bash
docker compose up --build
```

This will:
- Start PostgreSQL database
- Start FastAPI backend (port 8000)
- Start Next.js frontend (port 3000)
- Run database migrations automatically

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 5. Stop Services

Press `Ctrl+C` or run:
```bash
docker compose down
```

## Development Workflow

### Running in Detached Mode

```bash
docker compose up -d
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f web
```

### Rebuild After Changes

```bash
docker compose up --build
```

## Manual Start (Without Docker)

### Backend

```bash
cd apps/api

# Install dependencies
pip install -r requirements.txt

# Set environment variables (see above)

# Run migrations
alembic upgrade head

# Start server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd apps/web

# Install dependencies
npm install

# Set environment variables in .env.local

# Start dev server
npm run dev
```

## Troubleshooting

### Port Already in Use

If ports 3000 or 8000 are already in use:
- Stop the conflicting application, or
- Change ports in `docker-compose.yml`

### Database Connection Issues

Make sure Docker Desktop is running and PostgreSQL container is healthy:
```bash
docker compose ps
```

### OpenAI API Errors

Verify your API key is correct in `apps/api/.env`:
```bash
# Test API key
curl https://api.openai.com/v1/models -H "Authorization: Bearer sk-your-key"
```

### Migration Errors

Reset database (⚠️ deletes all data):
```bash
docker compose down -v
docker compose up --build
```

## Next Steps

1. **Create your first player**: Navigate to http://localhost:3000/dashboard/players
2. **Add games**: Add at least 3 games to a player
3. **Generate report**: Click "Generate Report" to create your first AI report
4. **Share report**: Use the share button to get a shareable link

## Environment Variables Reference

See `apps/api/env.example` and `apps/web/env.local.example` for all available options.

