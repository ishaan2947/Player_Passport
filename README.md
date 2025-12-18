# Player Passport

**Turn youth basketball stats into trustworthy, parent-friendly player development reports.**

Player Passport is a full-stack web application that transforms raw basketball game statistics into actionable development insights. Built with production-grade practices, it helps parents, coaches, and players track progress through AI-powered analysis while maintaining strict safety guardrails and professional output quality.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Technical Deep Dive](#technical-deep-dive)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Player Passport addresses a common problem in youth basketball: parents and players have game stats, but lack meaningful insights about development. Traditional stat sheets don't answer questions like:

- What are my child's biggest strengths right now?
- Where should they focus practice time?
- How are they trending over the season?
- What drills will help them improve?

Player Passport solves this by:

1. **Collecting structured game data** (points, rebounds, assists, shooting percentages, etc.)
2. **Aggregating and analyzing** performance across multiple games
3. **Generating AI-powered reports** that are:
   - Parent-friendly and easy to understand
   - Actionable with specific drill recommendations
   - Safe and appropriate (no medical advice, no recruiting promises)
   - Structured and repeatable (JSON schema validation)
4. **Enabling sharing** via secure tokens for coaches and family members

### Trust & Safety First

Player Passport is designed with trust as the top priority:

- ✅ **No recruiting guarantees** or promises
- ✅ **No invented stats** or fake data
- ✅ **Age-appropriate**, practical advice
- ✅ **Supportive** and professional tone
- ✅ **Honest** about data limitations
- ✅ **No medical advice** or diagnoses
- ✅ **Structured output** with server-side validation

---

## ✨ Features

### Core Functionality

- **Player Management**: Create and manage multiple player profiles with customizable information
- **Game Tracking**: Log individual game statistics with optional notes and context
- **AI Report Generation**: Generate comprehensive development reports from game data
- **Report Sharing**: Share reports via secure, tokenized URLs (no account required for viewers)
- **Historical Tracking**: View all past reports to track development over time
- **Demo Mode**: Try the app with pre-populated demo players and game data

### Production Features

- **Structured JSON Reports**: All AI output validated against strict Pydantic schemas
- **Caching**: Report generation cached for 1 hour to reduce API costs and improve performance
- **Rate Limiting**: Protect API endpoints from abuse (60 requests/minute default)
- **Request Logging**: Structured logging with correlation IDs for request tracing
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Timeout & Retries**: OpenAI API calls with 60s timeout and exponential backoff retries
- **Authentication**: Secure JWT-based auth via Clerk (development bypass available)
- **CORS Protection**: Configured for production with environment-specific origins
- **Health Checks**: Database connectivity and service health monitoring

---

## 🛠 Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS + shadcn/ui components
- **Authentication**: Clerk (JWT-based)
- **State Management**: React hooks + server components
- **Build Tool**: Next.js built-in bundler
- **Package Manager**: npm

### Backend

- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic v2
- **Database**: PostgreSQL 16 (with pgvector extension)
- **Migrations**: Alembic
- **AI**: OpenAI GPT-4o (structured JSON output)
- **Logging**: structlog (structured JSON logs)
- **Error Tracking**: Sentry (optional)
- **Rate Limiting**: In-memory (Redis-ready for production)

### Infrastructure

- **Local Development**: Docker Compose
- **Database**: PostgreSQL 16 container
- **API**: FastAPI with Uvicorn
- **Frontend**: Next.js dev server (with Docker support)

---

## 🏗 Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Next.js Web   │  (Port 3000)
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/REST
         │ JWT Auth
         ▼
┌─────────────────┐
│   FastAPI API   │  (Port 8000)
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────────┐
│PostgreSQL│ │  OpenAI API  │
│Database │ │  (GPT-4o)    │
└─────────┘ └──────────────┘
```

### Application Flow

#### 1. Authentication Flow

```
User → Clerk (Sign In) → JWT Token → FastAPI (Verify) → Protected Routes
```

- **Frontend**: Clerk handles authentication UI and JWT token management
- **Backend**: Validates JWT tokens using Clerk's public JWKS endpoint
- **Development**: Optional bypass mode for local testing (not available in production)

#### 2. Report Generation Flow

```
User Input (Games) → Aggregate Stats → Build JSON Input
                                         │
                                         ▼
                              ┌──────────────────┐
                              │  Check Cache     │
                              └────────┬─────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    ▼                                     ▼
            Cache Hit                            Cache Miss
         (Return cached)                          │
                                                  ▼
                                    ┌──────────────────────┐
                                    │  OpenAI API Call     │
                                    │  (GPT-4o, JSON mode) │
                                    └──────────┬───────────┘
                                               │
                                               ▼
                                    ┌──────────────────────┐
                                    │  Parse & Validate    │
                                    │  (Pydantic Schema)   │
                                    └──────────┬───────────┘
                                               │
                                               ▼
                                    ┌──────────────────────┐
                                    │  Cache Result        │
                                    │  Save to Database    │
                                    └──────────┬───────────┘
                                               │
                                               ▼
                                    ┌──────────────────────┐
                                    │  Return Report JSON  │
                                    └──────────────────────┘
```

### Database Schema

```
users (id, clerk_id, email, created_at, updated_at)
  │
  └─ players (id, user_id, name, grade, position, height, team, goals, ...)
      │
      ├─ player_games (id, player_id, game_label, game_date, opponent, 
      │                 pts, reb, ast, stl, blk, tov, fgm, fga, tpm, tpa, 
      │                 ftm, fta, minutes, notes)
      │
      └─ player_reports (id, player_id, status, report_json, share_token,
                         prompt_version, model_used, report_window, 
                         error_text, created_at)
```

**Key Relationships:**
- `User` → `Player` (one-to-many)
- `Player` → `PlayerGame` (one-to-many)
- `Player` → `PlayerReport` (one-to-many)
- All relationships cascade on delete

---

## 🚀 Getting Started

### Prerequisites

- **Docker Desktop** (v4.0+) - For running the full stack locally
- **Node.js 18+** (optional) - For local frontend development
- **Python 3.11+** (optional) - For local backend development
- **OpenAI API Key** - Required for report generation
- **Clerk Account** (optional) - For authentication (dev bypass available)

### Quick Start with Docker

1. **Clone the repository**

```bash
git clone <repo-url>
cd Explain_My_Game
```

2. **Set up environment variables**

Create `apps/api/.env`:
```env
DATABASE_URL=postgresql://emg_user:emg_password@postgres:5432/explain_my_game
OPENAI_API_KEY=sk-your-openai-key-here
ENVIRONMENT=development
CLERK_SECRET_KEY=sk_test_...  # Optional for dev
CLERK_PUBLISHABLE_KEY=pk_test_...  # Optional for dev
```

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # Optional for dev
```

3. **Start all services**

```bash
docker compose up --build
```

4. **Verify installation**

- **API Health**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs
- **Web App**: http://localhost:3000

### Local Development (Without Docker)

#### Backend Setup

```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables (see above)
# Run migrations
alembic upgrade head

# Start server
uvicorn src.main:app --reload
```

#### Frontend Setup

```bash
cd apps/web
npm install
npm run dev
```

---

## 🔍 Technical Deep Dive

### Report Generation Process

#### 1. Input Preparation

When a user requests a report, the backend:

1. **Fetches player data** and associated games (minimum 3 games recommended)
2. **Aggregates statistics**:
   - Computes averages (points, rebounds, assists, etc.)
   - Calculates shooting percentages (FG%, 3P%, FT%)
   - Identifies trends across games
3. **Builds structured JSON input**:
   ```json
   {
     "player": {
       "name": "John Doe",
       "grade": "10th",
       "position": "Guard",
       "height": "5'10\"",
       "team": "Wildcats",
       "goals": ["Improve shooting", "Better defense"]
     },
     "games": [
       {
         "game_label": "Game 1",
         "date": "2024-01-15",
         "opponent": "Eagles",
         "pts": 12,
         "reb": 5,
         "ast": 4,
         // ... other stats
       }
     ],
     "context": {
       "competition_level": "JV",
       "role": "starter"
     },
     "coach_notes": "Great hustle today",
     "parent_notes": "Played through minor ankle issue"
   }
   ```

#### 2. AI Generation

The system calls OpenAI's GPT-4o API with:

- **Model**: `gpt-4o`
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Max Tokens**: 4000
- **Response Format**: `json_object` (ensures valid JSON)
- **System Prompt**: Versioned prompt file (`player_passport_v1.txt`)
- **User Message**: Serialized input JSON

**Key Safety Features:**
- Structured JSON output mode (reduces hallucinations)
- System prompt includes explicit guardrails:
  - No recruiting guarantees
  - No medical advice
  - No invented data
  - Age-appropriate language
- Server-side validation against Pydantic schema

#### 3. Validation & Storage

1. **Parse JSON response** from OpenAI
2. **Validate against Pydantic schema** (`PlayerReportContent`)
   - Ensures all required fields present
   - Validates field types and constraints
   - Checks content safety (e.g., no guarantee language)
3. **Cache result** (in-memory, 1 hour TTL)
4. **Save to database** with:
   - Status: `completed` or `failed`
   - Share token (URL-safe random string)
   - Prompt version (for tracking changes)
   - Model used (for audit trail)
   - Report window (date range of games analyzed)

#### 4. Report Schema Structure

The validated report JSON follows this structure:

```json
{
  "meta": {
    "player_name": "string",
    "report_window": "Jan 15-28, 2024",
    "confidence_level": "low|medium|high",
    "confidence_reason": "Based on 3 games...",
    "disclaimer": "This report is for development purposes only..."
  },
  "growth_summary": "Parent-friendly paragraph explaining overall progress...",
  "development_report": {
    "strengths": ["string", "string", "string"],
    "growth_areas": ["string", "string", "string"],
    "trend_insights": ["string", "string", "string"],
    "key_metrics": [
      {
        "label": "Points Per Game",
        "value": "12.5",
        "note": "Up from 10.2 last month"
      }
    ],
    "next_2_weeks_focus": ["string", "string", "string"]
  },
  "drill_plan": [
    {
      "title": "Form Shooting Drill",
      "why_this_drill": "Improves shooting mechanics...",
      "how_to_do_it": "Stand 5 feet from basket...",
      "frequency": "3x per week, 15 minutes",
      "success_metric": "Make 8/10 shots consistently"
    }
  ],
  "motivational_message": "Great progress this month...",
  "college_fit_indicator_v1": {
    "label": "Developing Guard (HS → D3 Track)",
    "reasoning": "Based on current stats...",
    "what_to_improve_to_level_up": ["string", "string"]
  },
  "player_profile": {
    "headline": "Versatile Guard with Strong Court Vision",
    "player_info": {...},
    "top_stats_snapshot": ["string", "string"],
    "strengths_short": ["string", "string"],
    "development_areas_short": ["string", "string"],
    "coach_notes_summary": "string"
  }
}
```

### Caching Strategy

- **Cache Key**: SHA256 hash of `player_id + sorted(game_ids)`
- **TTL**: 1 hour (3600 seconds)
- **Storage**: In-memory dictionary (single server)
- **Future**: Can be migrated to Redis for multi-server deployments

**Why Cache?**
- Reduces OpenAI API costs
- Improves response time for duplicate requests
- Consistent results for same input

### Rate Limiting

- **Implementation**: In-memory token bucket (per IP address)
- **Default Limit**: 60 requests per minute
- **Scope**: All endpoints except `/health`
- **Response**: 429 Too Many Requests with JSON error message
- **Future**: Migrate to Redis for distributed rate limiting

### Authentication & Authorization

#### Development Mode

- **Bypass Available**: Set `CLERK_SECRET_KEY` to empty string
- **User ID**: Defaults to a test user
- **No JWT Verification**: Allows local testing without Clerk setup

#### Production Mode

- **Provider**: Clerk (JWT-based)
- **Verification**: JWKS endpoint (public key rotation support)
- **User Identification**: `clerk_id` stored in `users` table
- **Token Validation**: Per-request JWT verification middleware
- **Authorization**: User-scoped data (users only see their own players)

### Error Handling

#### Structured Error Responses

```json
{
  "detail": "Human-readable error message",
  "error_code": "PLAYER_NOT_FOUND"  // Optional
}
```

#### Exception Hierarchy

- **HTTPException**: FastAPI standard exceptions (404, 400, etc.)
- **Custom Exceptions**: Domain-specific errors with proper status codes
- **Global Handler**: Centralized exception handling in `src/core/exceptions.py`

#### Logging

- **Library**: `structlog` (structured JSON logs)
- **Correlation IDs**: Every request gets a unique correlation ID
- **Log Levels**: INFO (normal operations), WARNING (rate limits, retries), ERROR (failures)
- **Context**: Player ID, report ID, correlation ID included in all logs

---

## 📡 API Documentation

### Base URL

- **Local**: http://localhost:8000
- **Production**: (configured via environment)

### Authentication

All endpoints (except `/health` and shared report endpoints) require authentication:

```
Authorization: Bearer <jwt_token>
```

### Core Endpoints

#### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "1.0.0"
}
```

#### Players

```http
GET /players
```
List all players for the authenticated user.

```http
POST /players
Content-Type: application/json

{
  "name": "John Doe",
  "grade": "10th",
  "position": "Guard",
  "height": "5'10\"",
  "team": "Wildcats",
  "goals": ["Improve shooting"]
}
```

```http
GET /players/{player_id}
```
Get a specific player with games and reports.

```http
PUT /players/{player_id}
```
Update player information.

```http
DELETE /players/{player_id}
```
Delete a player (cascades to games and reports).

#### Games

```http
POST /players/{player_id}/games
Content-Type: application/json

{
  "game_label": "Game 1",
  "game_date": "2024-01-15",
  "opponent": "Eagles",
  "pts": 12,
  "reb": 5,
  "ast": 4,
  "stl": 2,
  "blk": 1,
  "tov": 3,
  "fgm": 5,
  "fga": 12,
  "tpm": 2,
  "tpa": 5,
  "ftm": 0,
  "fta": 0,
  "minutes": 28,
  "notes": "Great hustle"
}
```

```http
GET /players/{player_id}/games
```
List all games for a player.

```http
DELETE /players/{player_id}/games/{game_id}
```
Delete a specific game.

#### Reports

```http
POST /players/{player_id}/reports
Content-Type: application/json

{
  "game_ids": ["uuid1", "uuid2", "uuid3"]
}
```

Generate a new report. Returns immediately with status `generating`. Poll the report endpoint to check completion.

```http
GET /players/{player_id}/reports
```
List all reports for a player.

```http
GET /players/{player_id}/reports/{report_id}
```
Get a specific report (includes full JSON content).

```http
GET /players/share/{share_token}
```
Get a shared report (public, no auth required).

#### Demo Data

```http
POST /players/seed-demo
```

Create 5 demo players with pre-populated game data for testing.

### Interactive API Documentation

When running in development mode, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 💻 Development

### Project Structure

```
/
├── apps/
│   ├── api/                          # FastAPI backend
│   │   ├── src/
│   │   │   ├── main.py               # Application entry point
│   │   │   ├── models/               # SQLAlchemy models
│   │   │   │   ├── player.py
│   │   │   │   ├── player_game.py
│   │   │   │   ├── player_report.py
│   │   │   │   └── user.py
│   │   │   ├── schemas/              # Pydantic schemas
│   │   │   │   ├── player.py
│   │   │   │   ├── player_report_content.py  # Report JSON schema
│   │   │   │   └── user.py
│   │   │   ├── routers/              # API route handlers
│   │   │   │   ├── players.py
│   │   │   │   └── users.py
│   │   │   ├── services/             # Business logic
│   │   │   │   ├── player_report_generator.py
│   │   │   │   └── prompts/          # AI prompt templates
│   │   │   │       └── player_passport_v1.txt
│   │   │   └── core/                 # Core functionality
│   │   │       ├── auth.py           # JWT verification
│   │   │       ├── config.py         # Settings management
│   │   │       ├── database.py       # DB connection
│   │   │       ├── exceptions.py     # Error handling
│   │   │       ├── rate_limit.py     # Rate limiting
│   │   │       ├── security.py       # Security utilities
│   │   │       └── validation.py     # Config validation
│   │   ├── alembic/                  # Database migrations
│   │   │   └── versions/
│   │   ├── tests/                    # Unit tests
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── env.example
│   │
│   └── web/                          # Next.js frontend
│       ├── src/
│       │   ├── app/                  # App Router pages
│       │   │   ├── dashboard/
│       │   │   │   ├── players/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [playerId]/
│       │   │   │   │       ├── page.tsx
│       │   │   │   │       └── reports/
│       │   │   │   │           └── [reportId]/page.tsx
│       │   │   │   └── page.tsx
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx          # Landing page
│       │   │   └── ...
│       │   ├── components/           # React components
│       │   │   ├── ui/               # shadcn/ui components
│       │   │   └── ...
│       │   ├── lib/                  # Utilities
│       │   │   ├── api.ts            # API client
│       │   │   ├── auth.ts           # Auth utilities
│       │   │   └── utils.ts
│       │   └── types/                # TypeScript types
│       │       └── api.ts
│       ├── public/                   # Static assets
│       ├── Dockerfile
│       ├── package.json
│       └── env.local.example
│
├── docker-compose.yml                # Local development stack
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI/CD pipeline
└── README.md
```

### Code Quality

#### Backend

**Linting & Formatting:**
```bash
cd apps/api
ruff check src/
ruff format src/
```

**Type Checking:**
```bash
mypy src/  # If mypy is configured
```

**Running Tests:**
```bash
pytest tests/ -v
```

#### Frontend

**Linting:**
```bash
cd apps/web
npm run lint
```

**Type Checking:**
```bash
npm run type-check
```

**Formatting:**
```bash
npm run format  # If configured
```

### Database Migrations

**Create a new migration:**
```bash
docker compose exec api alembic revision --autogenerate -m "description"
```

**Apply migrations:**
```bash
docker compose exec api alembic upgrade head
```

**Rollback:**
```bash
docker compose exec api alembic downgrade -1
```

### Environment Variables

#### Backend (`apps/api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key for report generation |
| `CLERK_SECRET_KEY` | No* | Clerk secret key for JWT verification |
| `CLERK_PUBLISHABLE_KEY` | No* | Clerk publishable key |
| `ENVIRONMENT` | No | `development`, `staging`, `production`, or `test` (default: development) |
| `LOG_LEVEL` | No | Logging level (default: INFO) |
| `RATE_LIMIT_ENABLED` | No | Enable rate limiting (default: true) |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | No | Max requests per minute (default: 60) |
| `FRONTEND_URL` | No | Frontend URL for CORS (default: http://localhost:3000) |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |

*Required in production, optional in development (bypass mode available)

#### Frontend (`apps/web/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No* | Clerk publishable key for auth UI |

*Optional if using dev auth bypass

---

## 🚢 Deployment

### CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:

1. **Lints and type-checks** frontend (ESLint, TypeScript)
2. **Lints and tests** backend (Ruff, pytest)
3. **Builds** both applications
4. **Runs integration tests** (Docker Compose) on main branch
5. **Deploys to staging** (develop branch) - Fly.io (backend) + Vercel (frontend)
6. **Deploys to production** (main branch) - Fly.io (backend) + Vercel (frontend)

### Deployment Checklist

See `DEPLOYMENT.md` for detailed deployment instructions and security checklist.

**Key Requirements:**
- Environment variables configured
- Database migrations run
- CORS configured for production frontend URL
- Rate limiting enabled
- Sentry configured (recommended)
- Health checks verified

### Infrastructure

**Recommended Setup:**
- **Backend**: Fly.io or similar (Docker container)
- **Frontend**: Vercel (Next.js optimized)
- **Database**: Managed PostgreSQL (e.g., Supabase, Railway, Neon)
- **Cache**: Redis (for production rate limiting and report caching)
- **Monitoring**: Sentry for error tracking

---

## 🧪 Testing

### Backend Tests

Tests are located in `apps/api/tests/`:

```bash
cd apps/api
pytest tests/ -v
```

**Test Coverage:**
- Stats aggregation logic
- Report JSON validation
- Token sharing access rules
- API endpoint behavior

### Frontend Tests

Frontend tests are minimal (as per MVP scope). To add tests:

```bash
cd apps/web
npm test  # If test framework is configured
```

---

## 📝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Code Style**: Follow existing patterns (Ruff for Python, ESLint for TypeScript)
2. **Commits**: Use descriptive commit messages
3. **PRs**: Include description of changes and test results
4. **Tests**: Add tests for new features
5. **Documentation**: Update README if needed

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Powered by [Next.js](https://nextjs.org/)
- AI reports generated by [OpenAI GPT-4o](https://openai.com/)
- Authentication by [Clerk](https://clerk.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

---

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Player Passport** - Turning stats into stories, one game at a time. 🏀
