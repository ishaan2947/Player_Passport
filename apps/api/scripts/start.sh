#!/bin/bash
set -e

echo "🚀 Starting Explain My Game API..."

# Run database migrations
echo "📦 Running database migrations..."
alembic upgrade head

# Optional: Seed database in development
if [ "$ENVIRONMENT" = "development" ] && [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database..."
    python -m src.scripts.seed
fi

# Start the API server
echo "✅ Starting uvicorn server..."
exec uvicorn src.main:app --host 0.0.0.0 --port 8000

