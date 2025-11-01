"""
Database seed script.

Creates initial data for development:
- 1 user
- 1 team
- 1 game with basketball stats

Usage:
    python -m src.scripts.seed
"""

import sys
from datetime import date
from uuid import uuid4

from sqlalchemy.orm import Session

from src.core.database import SessionLocal
from src.models import (
    User,
    Team,
    TeamMember,
    Game,
    BasketballGameStats,
)


def seed_database(db: Session) -> None:
    """Seed the database with initial data."""

    print("🌱 Starting database seed...")

    # Check if data already exists
    existing_user = db.query(User).first()
    if existing_user:
        print("⚠️  Database already has data. Skipping seed.")
        print(f"   Existing user: {existing_user.email}")
        return

    # Create user
    user = User(
        id=uuid4(),
        clerk_user_id="user_seed_001",
        email="coach@example.com",
    )
    db.add(user)
    db.flush()
    print(f"✅ Created user: {user.email}")

    # Create team
    team = Team(
        id=uuid4(),
        owner_user_id=user.id,
        name="Demo Warriors",
        sport="basketball",
    )
    db.add(team)
    db.flush()
    print(f"✅ Created team: {team.name}")

    # Add user as team owner member
    team_member = TeamMember(
        id=uuid4(),
        team_id=team.id,
        user_id=user.id,
        role="owner",
    )
    db.add(team_member)
    print(f"✅ Added team member: {user.email} as owner")

    # Create game
    game = Game(
        id=uuid4(),
        team_id=team.id,
        opponent_name="Riverside Eagles",
        game_date=date(2024, 1, 15),
        location="Home Court",
        notes="Season opener. Good energy from the team, but need to work on free throws.",
    )
    db.add(game)
    db.flush()
    print(f"✅ Created game: vs {game.opponent_name}")

    # Create basketball stats
    stats = BasketballGameStats(
        id=uuid4(),
        game_id=game.id,
        points_for=72,
        points_against=68,
        fg_made=28,
        fg_att=62,
        three_made=6,
        three_att=18,
        ft_made=10,
        ft_att=16,
        rebounds_off=12,
        rebounds_def=28,
        assists=18,
        steals=8,
        blocks=4,
        turnovers=14,
        fouls=18,
        pace_estimate=72,
    )
    db.add(stats)
    print(f"✅ Created basketball stats: {stats.points_for}-{stats.points_against}")

    # Commit all changes
    db.commit()

    print("\n🎉 Database seeded successfully!")
    print(f"   User ID: {user.id}")
    print(f"   Team ID: {team.id}")
    print(f"   Game ID: {game.id}")


def main() -> None:
    """Main entry point for seed script."""
    print("=" * 50)
    print("Explain My Game - Database Seed")
    print("=" * 50)

    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
