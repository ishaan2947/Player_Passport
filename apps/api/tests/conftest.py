"""
Shared test fixtures for Player Passport API tests.
Uses SQLite in-memory for fast, isolated testing.
"""

import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import StaticPool, create_engine
from sqlalchemy.orm import Session, sessionmaker

from src.core.database import Base, get_db
from src.main import app
from src.models import Player, PlayerGame, PlayerReport, User


# In-memory SQLite for tests
SQLALCHEMY_TEST_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    """Create tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db() -> Generator[Session, None, None]:
    """Provide a test database session."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client() -> TestClient:
    """Provide a test HTTP client."""
    return TestClient(app)


# ============================================================================
# Factory fixtures
# ============================================================================


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user."""
    user = User(
        id=uuid.uuid4(),
        clerk_user_id="user_test_001",
        email="test@example.com",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers() -> dict[str, str]:
    """Auth headers using dev token matching test_user."""
    return {"Authorization": "Bearer dev_user_test_001"}


@pytest.fixture
def test_player(db: Session, test_user: User) -> Player:
    """Create a test player."""
    player = Player(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Test Player",
        grade="Junior",
        position="PG",
        height="6'0\"",
        team="Test Team",
        goals=["Score 20+ PPG", "Make varsity"],
    )
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@pytest.fixture
def test_games(db: Session, test_player: Player) -> list[PlayerGame]:
    """Create 5 test games for a player."""
    games = []
    base_date = date.today() - timedelta(days=20)

    game_data = [
        {"pts": 18, "reb": 5, "ast": 7, "stl": 2, "blk": 0, "tov": 3, "fgm": 7, "fga": 14, "tpm": 2, "tpa": 5, "ftm": 2, "fta": 3, "minutes": 28},
        {"pts": 22, "reb": 4, "ast": 5, "stl": 1, "blk": 1, "tov": 2, "fgm": 8, "fga": 15, "tpm": 3, "tpa": 7, "ftm": 3, "fta": 4, "minutes": 30},
        {"pts": 15, "reb": 3, "ast": 8, "stl": 3, "blk": 0, "tov": 4, "fgm": 6, "fga": 13, "tpm": 1, "tpa": 4, "ftm": 2, "fta": 2, "minutes": 26},
        {"pts": 20, "reb": 6, "ast": 6, "stl": 2, "blk": 0, "tov": 2, "fgm": 8, "fga": 16, "tpm": 2, "tpa": 6, "ftm": 2, "fta": 3, "minutes": 32},
        {"pts": 25, "reb": 4, "ast": 4, "stl": 1, "blk": 0, "tov": 1, "fgm": 10, "fga": 18, "tpm": 3, "tpa": 8, "ftm": 2, "fta": 2, "minutes": 34},
    ]

    for i, gd in enumerate(game_data):
        game = PlayerGame(
            id=uuid.uuid4(),
            player_id=test_player.id,
            game_date=base_date + timedelta(days=i * 4),
            opponent=f"Opponent {i + 1}",
            game_label=f"Game {i + 1}",
            **gd,
        )
        db.add(game)
        games.append(game)

    db.commit()
    for g in games:
        db.refresh(g)
    return games


@pytest.fixture
def test_report(db: Session, test_player: Player) -> PlayerReport:
    """Create a test completed report."""
    report = PlayerReport(
        id=uuid.uuid4(),
        player_id=test_player.id,
        status="completed",
        report_window="Jan 1-20, 2025",
        report_json={"meta": {"player_name": "Test Player"}},
        model_used="gpt-4o",
        prompt_version="player_passport_v1",
        share_token="test-share-token-abc123",
        is_public=True,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
