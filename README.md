# Player Passport

Turn youth basketball stats into trustworthy, parent-friendly player development reports.

## Overview

Player Passport helps parents, coaches, and players transform raw game statistics into actionable development insights. Enter your player's game stats and receive:

- **Development Report**: Strengths, growth areas, and trend insights
- **Drill Plan**: 3-5 position-specific drills with success metrics  
- **Player Profile**: Shareable summary with key stats
- **Motivational Message**: Encouraging, age-appropriate feedback
- **College Fit Indicator**: Cautious, stats-based development tracking

### Trust & Safety First

Player Passport is designed with trust as the top priority:
- **No recruiting guarantees** or promises
- **No invented stats** or fake data
- **Age-appropriate**, practical advice
- **Supportive** and professional tone
- **Honest** about data limitations

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, Clerk Auth
- **Backend**: FastAPI, Python 3.11+, SQLAlchemy 2.0, Pydantic v2
- **Database**: PostgreSQL 16
- **AI**: OpenAI GPT-4o for report generation
- **Infrastructure**: Docker Compose for local development

## Quick Start

### Prerequisites

- Docker Desktop (v4.0+)
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)
- OpenAI API key

### 1. Clone and Setup Environment

```bash
git clone <repo-url>
cd player-passport

# Copy environment files
cp apps/api/env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 2. Configure Environment Variables

Edit `apps/api/.env`:
```env
DATABASE_URL=postgresql://emg_user:emg_password@postgres:5432/explain_my_game
OPENAI_API_KEY=sk-your-openai-key
ENVIRONMENT=development
```

Edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start Services

```bash
# Build and start all services
docker compose up --build

# Or run in detached mode
docker compose up --build -d
```

### 4. Verify Installation

- **API Health**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs
- **Web App**: http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/players` | Create a player profile |
| GET | `/players` | List all players |
| GET | `/players/{id}` | Get player with games |
| PUT | `/players/{id}` | Update player profile |
| DELETE | `/players/{id}` | Delete player |
| POST | `/players/{id}/games` | Add a game to player |
| GET | `/players/{id}/games` | List player's games |
| DELETE | `/players/{id}/games/{game_id}` | Delete a game |
| POST | `/players/{id}/reports` | Generate AI development report |
| GET | `/players/{id}/reports` | List player's reports |
| GET | `/players/{id}/reports/{report_id}` | Get specific report |
| GET | `/players/share/{share_token}` | Get shared report (public) |

## Project Structure

```
/
├── apps/
│   ├── api/                 # FastAPI backend
│   │   ├── src/
│   │   │   ├── main.py      # Application entry point
│   │   │   ├── models/      # SQLAlchemy models
│   │   │   │   ├── player.py        # Player profile
│   │   │   │   ├── player_game.py   # Individual game stats
│   │   │   │   └── player_report.py # Development reports
│   │   │   ├── schemas/     # Pydantic schemas
│   │   │   ├── routers/     # API route handlers
│   │   │   │   └── players.py       # Player Passport API
│   │   │   ├── services/    # Business logic
│   │   │   │   ├── player_report_generator.py
│   │   │   │   └── prompts/ # AI prompt templates
│   │   │   └── core/        # Config, auth, database
│   │   ├── alembic/         # Database migrations
│   │   └── requirements.txt
│   │
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   │   └── dashboard/
│       │   │       └── players/  # Player management
│       │   ├── components/  # React components
│       │   ├── lib/         # Utilities, API client
│       │   └── types/       # TypeScript types
│       └── package.json
│
├── docker-compose.yml       # Local development
└── README.md
```

## How Reports Are Generated

1. **Data Collection**: User enters player info and game stats (min 3 games)
2. **Input Preparation**: Backend aggregates stats and computes averages
3. **AI Generation**: GPT-4o generates structured JSON report using a versioned prompt
4. **Validation**: Response is validated against Pydantic schema
5. **Caching**: Reports are cached for 1 hour to avoid redundant API calls
6. **Display**: Frontend renders the structured report with print-friendly styling

### Report Schema

```json
{
  "meta": {
    "player_name": "string",
    "report_window": "Dec 15-28, 2024",
    "confidence_level": "low|medium|high",
    "disclaimer": "string"
  },
  "growth_summary": "Parent-friendly paragraph...",
  "development_report": {
    "strengths": ["string", "string", "string"],
    "growth_areas": ["string", "string", "string"],
    "trend_insights": ["string", "string", "string"],
    "key_metrics": [{"label": "string", "value": "string", "note": "string"}],
    "next_2_weeks_focus": ["string", "string", "string"]
  },
  "drill_plan": [{
    "title": "string",
    "why_this_drill": "string",
    "how_to_do_it": "string",
    "frequency": "string",
    "success_metric": "string"
  }],
  "motivational_message": "string",
  "college_fit_indicator_v1": {
    "label": "Developing Guard (HS → D3 Track)",
    "reasoning": "string",
    "what_to_improve_to_level_up": ["string", "string"]
  }
}
```

## Development

### Backend
```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --reload
```

### Frontend
```bash
cd apps/web
npm install
npm run dev
```

### Database Migrations
```bash
# Run migrations
docker compose exec api alembic upgrade head

# Create new migration
docker compose exec api alembic revision --autogenerate -m "description"
```

## Linting & Formatting

### Backend
```bash
cd apps/api
ruff check src/
ruff format src/
```

### Frontend
```bash
cd apps/web
npm run lint
npm run type-check
```

## Environment Variables

### Backend (`apps/api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key for report generation |
| `ENVIRONMENT` | No | `development` or `production` (default: development) |
| `RATE_LIMIT_ENABLED` | No | Enable rate limiting (default: true) |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | No | Max requests per minute (default: 60) |

### Frontend (`apps/web/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |

## License

MIT
