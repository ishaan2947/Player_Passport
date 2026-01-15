# Player Passport

A full-stack basketball player development platform that tracks game stats, generates AI-powered coaching reports, and visualizes player progress over time.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)
![CI](https://github.com/ishaaqj/player-passport/actions/workflows/ci.yml/badge.svg)

---

## What It Does

Coaches and players log game stats after each game. The platform processes those stats through an AI report engine to produce personalized development reports — including drill plans, strengths/weaknesses analysis, and progress metrics. Everything is visualized on a per-player dashboard with season trend charts, milestone badges, and a multi-player comparison view.

---

## Features

- **Game Log** — Record pts, reb, ast, stl, blk, tov, FG%, 3PM per game with inline editing
- **AI Coaching Reports** — Generate structured development reports with drill plans and player analysis; poll for completion with animated progress bar
- **Season Trends Chart** — Interactive Recharts line chart with stat toggles and preset views (scoring, defense, efficiency)
- **Milestone Badges** — 16 computed achievements (double-doubles, hot hand streaks, triple-doubles, efficiency badges, etc.)
- **Goals Tracker** — Set personal stat targets with progress bars; persisted in localStorage
- **Practice Plan Widget** — Pulls the latest report's drill plan directly onto the player dashboard
- **Multi-Player Comparison** — Side-by-side bar chart comparison of up to 4 players across 8 key stats
- **Report Sharing** — Share read-only reports via unique token links
- **PDF Export** — Print-optimized report pages via `window.print()`
- **PWA Ready** — Web app manifest included for installability

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic |
| Database | PostgreSQL 16 |
| Auth | Clerk (production) / dev token bypass (development) |
| Infrastructure | Docker Compose, GitHub Actions CI/CD |
| Testing | pytest (77 tests), ESLint, ruff |

---

## Quick Start

**Prerequisites:** Docker Desktop

```bash
git clone https://github.com/ishaaqj/player-passport.git
cd player-passport
docker compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

**Seed demo data** (5 players, 11 games each):

```bash
curl -X POST http://localhost:8000/players/seed-demo \
  -H "Authorization: Bearer dev_user_seed_001"
```

Then open http://localhost:3000/dashboard/players to explore.

---

## Architecture

```
player-passport/
├── apps/
│   ├── api/               # FastAPI backend
│   │   ├── src/
│   │   │   ├── routers/   # players, users, reports
│   │   │   ├── schemas/   # Pydantic v2 models
│   │   │   ├── models/    # SQLAlchemy ORM models
│   │   │   └── core/      # auth, config, exceptions
│   │   └── tests/         # 77 pytest tests
│   └── web/               # Next.js frontend
│       └── src/
│           ├── app/       # App Router pages
│           └── components/ # Charts, badges, modals
└── docker-compose.yml
```

Key design decisions:
- **JSONB for goals** — Player goals stored as JSONB in PostgreSQL for flexible schema evolution
- **Dev auth bypass** — Token prefix `dev_` routes to a seeded test user; no Clerk dependency for local dev
- **Recharts SSR fix** — All chart components use a `mounted` state guard to prevent hydration mismatches
- **Timezone-safe dates** — Game dates use local timezone formatting on the frontend; API allows a 1-day grace for clock drift

---

## Running Tests

```bash
# API tests (77 tests)
docker compose exec api python -m pytest tests/ -q

# Frontend lint + type check
docker compose exec web npx next lint
docker compose exec web npx tsc --noEmit
```

---

## CI/CD

GitHub Actions pipeline runs on every push:

1. `frontend-lint` — ESLint + TypeScript check
2. `backend-lint` — ruff lint + format check
3. `frontend-build` — `next build`
4. `backend-build` — Docker image build
5. `integration-tests` — Full pytest suite against live DB

---

## License

MIT
