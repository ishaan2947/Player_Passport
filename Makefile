.PHONY: up down build logs test seed lint format

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose up --build -d

logs:
	docker compose logs -f

test:
	docker compose exec api python -m pytest tests/ -q

seed:
	curl -s -X POST http://localhost:8000/players/seed-demo \
		-H "Authorization: Bearer dev_user_seed_001" | python3 -m json.tool

lint:
	docker compose exec api ruff check src/
	docker compose exec web npx next lint

format:
	docker compose exec api ruff format src/

migrate:
	docker compose exec api alembic upgrade head

shell-api:
	docker compose exec api bash

shell-db:
	docker compose exec postgres psql -U pp_user -d playerpassport
