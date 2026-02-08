#!/bin/bash
set -e

echo "Starting Player Passport API..."

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Seed dev user in development environment (idempotent)
if [ "${ENVIRONMENT}" = "development" ]; then
    echo "Seeding dev user (user_seed_001)..."
    python -c "
from src.core.database import SessionLocal
from src.models import User
db = SessionLocal()
try:
    exists = db.query(User).filter(User.clerk_user_id == 'user_seed_001').first()
    if not exists:
        user = User(clerk_user_id='user_seed_001', email='dev@playerpassport.app')
        db.add(user)
        db.commit()
        print('Dev user created.')
    else:
        print('Dev user already exists.')
finally:
    db.close()
"
fi

# Start the API server
echo "Starting uvicorn server..."
exec uvicorn src.main:app --host 0.0.0.0 --port 8000
