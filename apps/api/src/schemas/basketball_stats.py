"""Basketball stats schemas for API request/response validation."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class BasketballStatsCreate(BaseModel):
    """Schema for creating basketball game stats."""

    # Score
    points_for: int = Field(..., ge=0, description="Points scored by our team")
    points_against: int = Field(..., ge=0, description="Points scored by opponent")

    # Shooting
    fg_made: int = Field(default=0, ge=0, description="Field goals made")
    fg_att: int = Field(default=0, ge=0, description="Field goals attempted")
    three_made: int = Field(default=0, ge=0, description="Three-pointers made")
    three_att: int = Field(default=0, ge=0, description="Three-pointers attempted")
    ft_made: int = Field(default=0, ge=0, description="Free throws made")
    ft_att: int = Field(default=0, ge=0, description="Free throws attempted")

    # Rebounds
    rebounds_off: int = Field(default=0, ge=0, description="Offensive rebounds")
    rebounds_def: int = Field(default=0, ge=0, description="Defensive rebounds")

    # Other stats
    assists: int = Field(default=0, ge=0, description="Assists")
    steals: int = Field(default=0, ge=0, description="Steals")
    blocks: int = Field(default=0, ge=0, description="Blocks")
    turnovers: int = Field(default=0, ge=0, description="Turnovers")
    fouls: int = Field(default=0, ge=0, description="Team fouls")

    # Advanced (optional)
    pace_estimate: int | None = Field(None, ge=0, description="Estimated game pace")

    @model_validator(mode="after")
    def validate_shooting_stats(self) -> "BasketballStatsCreate":
        """Validate that made shots don't exceed attempted shots."""
        if self.fg_made > self.fg_att:
            raise ValueError("Field goals made cannot exceed field goals attempted")

        if self.three_made > self.three_att:
            raise ValueError(
                "Three-pointers made cannot exceed three-pointers attempted"
            )

        if self.ft_made > self.ft_att:
            raise ValueError("Free throws made cannot exceed free throws attempted")

        return self


class BasketballStatsUpdate(BaseModel):
    """Schema for updating basketball game stats."""

    # All fields optional for partial updates
    points_for: int | None = Field(None, ge=0)
    points_against: int | None = Field(None, ge=0)
    fg_made: int | None = Field(None, ge=0)
    fg_att: int | None = Field(None, ge=0)
    three_made: int | None = Field(None, ge=0)
    three_att: int | None = Field(None, ge=0)
    ft_made: int | None = Field(None, ge=0)
    ft_att: int | None = Field(None, ge=0)
    rebounds_off: int | None = Field(None, ge=0)
    rebounds_def: int | None = Field(None, ge=0)
    assists: int | None = Field(None, ge=0)
    steals: int | None = Field(None, ge=0)
    blocks: int | None = Field(None, ge=0)
    turnovers: int | None = Field(None, ge=0)
    fouls: int | None = Field(None, ge=0)
    pace_estimate: int | None = Field(None, ge=0)


class BasketballStatsOut(BaseModel):
    """Basketball stats response schema."""

    id: UUID
    game_id: UUID

    # Score
    points_for: int
    points_against: int

    # Shooting
    fg_made: int
    fg_att: int
    three_made: int
    three_att: int
    ft_made: int
    ft_att: int

    # Rebounds
    rebounds_off: int
    rebounds_def: int

    # Other stats
    assists: int
    steals: int
    blocks: int
    turnovers: int
    fouls: int

    # Advanced
    pace_estimate: int | None = None

    # Computed properties
    total_rebounds: int | None = None
    fg_percentage: float | None = None
    three_percentage: float | None = None
    ft_percentage: float | None = None

    created_at: datetime

    class Config:
        from_attributes = True

    @model_validator(mode="after")
    def compute_stats(self) -> "BasketballStatsOut":
        """Compute derived statistics."""
        # Total rebounds
        self.total_rebounds = self.rebounds_off + self.rebounds_def

        # Field goal percentage
        if self.fg_att > 0:
            self.fg_percentage = round((self.fg_made / self.fg_att) * 100, 1)

        # Three-point percentage
        if self.three_att > 0:
            self.three_percentage = round((self.three_made / self.three_att) * 100, 1)

        # Free throw percentage
        if self.ft_att > 0:
            self.ft_percentage = round((self.ft_made / self.ft_att) * 100, 1)

        return self
