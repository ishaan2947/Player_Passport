"""Game schemas for API request/response validation."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class GameCreate(BaseModel):
    """Schema for creating a new game."""

    opponent_name: str = Field(
        ..., min_length=1, max_length=100, description="Name of the opposing team"
    )
    game_date: date = Field(..., description="Date of the game")
    location: str | None = Field(
        None, max_length=200, description="Game location (optional)"
    )
    notes: str | None = Field(None, description="Additional notes about the game")


class GameUpdate(BaseModel):
    """Schema for updating a game."""

    opponent_name: str | None = Field(
        None, min_length=1, max_length=100, description="Name of the opposing team"
    )
    game_date: date | None = Field(None, description="Date of the game")
    location: str | None = Field(None, max_length=200, description="Game location")
    notes: str | None = Field(None, description="Additional notes")


class GameOut(BaseModel):
    """Game response schema."""

    id: UUID
    team_id: UUID
    opponent_name: str
    game_date: date
    location: str | None = None
    notes: str | None = None
    created_at: datetime
    has_stats: bool = False
    has_report: bool = False

    class Config:
        from_attributes = True


class BasketballStatsBasic(BaseModel):
    """Basic basketball stats for embedding in game response."""

    id: UUID
    points_for: int
    points_against: int

    class Config:
        from_attributes = True


class GameWithStats(BaseModel):
    """Game with stats response schema."""

    id: UUID
    team_id: UUID
    opponent_name: str
    game_date: date
    location: str | None = None
    notes: str | None = None
    created_at: datetime
    basketball_stats: BasketballStatsBasic | None = None

    class Config:
        from_attributes = True
