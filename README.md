# Explain My Game

Turn basketball game stats into clear coaching insights using AI.

## Overview

Explain My Game helps coaches, team captains, and parents transform raw game statistics into actionable coaching advice. Enter your game stats and notes, and receive a structured post-game report with:

- **Summary**: 2-4 sentence game overview
- **Key Insights**: Stats-backed observations with confidence levels
- **Action Items**: Specific, measurable improvements
- **Practice Focus**: One theme for next practice
- **Questions**: Prompts for next game discussion

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, shadcn/ui, Clerk Auth
- **Backend**: FastAPI, Python 3.11+, SQLAlchemy 2.0, Pydantic v2
- **Database**: PostgreSQL 16 with pgvector extension
- **AI**: OpenAI GPT-4 for report generation
- **Infrastructure**: Docker Compose for local development

## Prerequisites

- Docker Desktop (v4.0+)
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)
- OpenAI API key
- Clerk account (for authentication)

## Quick Start (Docker Compose)

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <repo-url>
cd explain-my-game

# Copy environment files
cp apps/api/env.example apps/api/.env
cp apps/web/env.example apps/web/.env
cp apps/web/env.local.example apps/web/.env.local
```

### 2. Configure Environment Variables

Edit `apps/api/.env`:
```env
DATABASE_URL=postgresql://emg_user:emg_password@postgres:5432/explain_my_game
OPENAI_API_KEY=sk-your-openai-key
CLERK_SECRET_KEY=sk_test_your-clerk-secret
CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable
```

Edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable
CLERK_SECRET_KEY=sk_test_your-clerk-secret
```

### 3. Start Services

```bash
# Build and start all services
docker compose up --build

# Or run in detached mode
docker compose up --build -d
```

The API will automatically:
1. Run database migrations (Alembic)
2. Seed the database with demo data (1 user, 1 team, 1 game)

### 4. Verify Installation

- **API Health**: http://localhost:8000/health (should return `{"status": "healthy"}`)
- **API Docs**: http://localhost:8000/docs
- **Web App**: http://localhost:3000

### 5. Database Management

```bash
# Run migrations manually
docker compose exec api alembic upgrade head

# Create a new migration
docker compose exec api alembic revision --autogenerate -m "description"

# Seed database (if not auto-seeded)
docker compose exec api python -m src.scripts.seed

# Connect to database
docker compose exec postgres psql -U emg_user -d explain_my_game
```

## Local Development (Without Docker)

### Backend

```bash
cd apps/api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your values

# Run database migrations
alembic upgrade head

# Start development server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd apps/web

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
cp .env.local.example .env.local
# Edit .env.local with your values

# Start development server
npm run dev
```

## Project Structure

```
/
├── apps/
│   ├── api/                 # FastAPI backend
│   │   ├── src/
│   │   │   ├── main.py      # Application entry point
│   │   │   ├── models/      # SQLAlchemy models
│   │   │   ├── schemas/     # Pydantic schemas
│   │   │   ├── routers/     # API route handlers
│   │   │   ├── services/    # Business logic
│   │   │   └── core/        # Config, auth, database
│   │   ├── alembic/         # Database migrations
│   │   ├── tests/           # Backend tests
│   │   └── requirements.txt
│   │
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   ├── components/  # React components
│       │   ├── lib/         # Utilities
│       │   └── types/       # TypeScript types
│       └── package.json
│
├── docker-compose.yml       # Local development orchestration
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/teams` | Create a team |
| GET | `/teams` | List user's teams |
| GET | `/teams/{team_id}` | Get team details |
| POST | `/teams/{team_id}/games` | Create a game |
| GET | `/teams/{team_id}/games` | List team's games |
| GET | `/games/{game_id}` | Get game details |
| POST | `/games/{game_id}/stats/basketball` | Add basketball stats |
| POST | `/games/{game_id}/generate-report` | Generate AI report |
| GET | `/reports/{report_id}` | Get report |
| GET | `/games/{game_id}/report` | Get report by game |
| POST | `/reports/{report_id}/feedback` | Submit feedback |

## Authentication

This project uses [Clerk](https://clerk.com) for authentication. To set up:

1. Create a Clerk application at https://dashboard.clerk.com
2. Copy your API keys to the environment files
3. Configure sign-in/sign-up URLs in Clerk dashboard

### Development Authentication Bypass

For local development without Clerk, you can use development tokens:

```bash
# Use the seeded user (after running seed script)
curl -H "Authorization: Bearer dev_user_seed_001" http://localhost:8000/teams

# The format is: dev_<clerk_user_id>
# This only works when ENVIRONMENT=development
```

### Role-Based Access Control (RBAC)

Team membership roles:
- **owner**: Full access, can delete team, manage members
- **coach**: Can create games, generate reports, add stats
- **member**: Can view team, games, and reports

Access is enforced server-side:
- User ID is derived from JWT, never from client input
- Team membership is checked on every team/game/report access
- Minimum role requirements are enforced per endpoint

### Swapping to Supabase Auth (Future)

To migrate to Supabase Auth:

1. Replace Clerk SDK with `@supabase/auth-helpers-nextjs` in frontend
2. Update backend JWT validation to use Supabase JWT secret
3. Update middleware to extract user from Supabase session
4. See `docs/SUPABASE_AUTH_MIGRATION.md` for detailed steps (TODO)

## Environment Variables

### Backend (`apps/api/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for report generation | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key for JWT validation | Yes |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes |
| `ENVIRONMENT` | `development` or `production` | No |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, etc.) | No |

### Frontend (`apps/web/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes |

## Testing

```bash
# Backend tests
cd apps/api
pytest

# Frontend tests
cd apps/web
npm run test
```

## Linting & Formatting

```bash
# Backend
cd apps/api
ruff check .
ruff format .

# Frontend
cd apps/web
npm run lint
npm run format
```

## License

MIT

