"""
Pydantic schemas for Player Passport.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


# ============================================================================
# Player Game Schemas
# ============================================================================


class PlayerGameCreate(BaseModel):
    """Input for creating a player game record."""

    game_date: date
    opponent: str = Field(min_length=1, max_length=255)
    game_label: str | None = Field(default=None, max_length=100)
    minutes: int = Field(ge=0, le=60, default=0)
    pts: int = Field(ge=0, le=150, default=0)
    reb: int = Field(ge=0, le=50, default=0)
    ast: int = Field(ge=0, le=50, default=0)
    stl: int = Field(ge=0, le=30, default=0)
    blk: int = Field(ge=0, le=30, default=0)
    tov: int = Field(ge=0, le=30, default=0)
    fgm: int = Field(ge=0, le=60, default=0)
    fga: int = Field(ge=0, le=60, default=0)
    tpm: int = Field(ge=0, le=30, default=0)
    tpa: int = Field(ge=0, le=40, default=0)
    ftm: int = Field(ge=0, le=40, default=0)
    fta: int = Field(ge=0, le=40, default=0)
    notes: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_shooting_stats(self) -> "PlayerGameCreate":
        """Ensure shooting stats are logically consistent."""
        if self.fgm > self.fga:
            raise ValueError("Field goals made (fgm) cannot exceed field goals attempted (fga)")
        if self.tpm > self.tpa:
            raise ValueError("Three pointers made (tpm) cannot exceed three pointers attempted (tpa)")
        if self.ftm > self.fta:
            raise ValueError("Free throws made (ftm) cannot exceed free throws attempted (fta)")
        if self.tpa > self.fga:
            raise ValueError("Three point attempts (tpa) cannot exceed total field goal attempts (fga)")
        if self.game_date > date.today() + timedelta(days=1):
            raise ValueError("Game date cannot be more than 1 day in the future")
        return self


class PlayerGameUpdate(BaseModel):
    """Input for updating a player game record."""

    game_date: date | None = None
    opponent: str | None = Field(default=None, min_length=1, max_length=255)
    game_label: str | None = Field(default=None, max_length=100)
    minutes: int | None = Field(ge=0, le=60, default=None)
    pts: int | None = Field(ge=0, le=150, default=None)
    reb: int | None = Field(ge=0, le=50, default=None)
    ast: int | None = Field(ge=0, le=50, default=None)
    stl: int | None = Field(ge=0, le=30, default=None)
    blk: int | None = Field(ge=0, le=30, default=None)
    tov: int | None = Field(ge=0, le=30, default=None)
    fgm: int | None = Field(ge=0, le=60, default=None)
    fga: int | None = Field(ge=0, le=60, default=None)
    tpm: int | None = Field(ge=0, le=30, default=None)
    tpa: int | None = Field(ge=0, le=40, default=None)
    ftm: int | None = Field(ge=0, le=40, default=None)
    fta: int | None = Field(ge=0, le=40, default=None)
    notes: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_shooting_stats(self) -> "PlayerGameUpdate":
        """Ensure shooting stats are logically consistent when provided."""
        if self.fgm is not None and self.fga is not None and self.fgm > self.fga:
            raise ValueError("Field goals made (fgm) cannot exceed field goals attempted (fga)")
        if self.tpm is not None and self.tpa is not None and self.tpm > self.tpa:
            raise ValueError("Three pointers made (tpm) cannot exceed three pointers attempted (tpa)")
        if self.ftm is not None and self.fta is not None and self.ftm > self.fta:
            raise ValueError("Free throws made (ftm) cannot exceed free throws attempted (fta)")
        if self.tpa is not None and self.fga is not None and self.tpa > self.fga:
            raise ValueError("Three point attempts (tpa) cannot exceed total field goal attempts (fga)")
        if self.game_date is not None and self.game_date > date.today():
            raise ValueError("Game date cannot be in the future")
        return self


class PlayerGameResponse(BaseModel):
    """Response for a player game record."""

    id: UUID
    player_id: UUID
    game_date: date
    opponent: str
    game_label: str | None
    minutes: int
    pts: int
    reb: int
    ast: int
    stl: int
    blk: int
    tov: int
    fgm: int
    fga: int
    tpm: int
    tpa: int
    ftm: int
    fta: int
    notes: str | None
    fg_pct: float | None
    three_pct: float | None
    ft_pct: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# Player Schemas
# ============================================================================


class PlayerCreate(BaseModel):
    """Input for creating a player profile."""

    name: str = Field(min_length=1, max_length=255)
    grade: str = Field(min_length=1, max_length=50)  # e.g., "9th", "10th"
    position: str = Field(min_length=1, max_length=50)  # Guard, Wing, Big
    height: str | None = Field(default=None, max_length=20)  # e.g., "5'10"
    team: str | None = Field(default=None, max_length=255)
    goals: list[str] | None = None
    competition_level: str | None = None  # JV, Varsity, AAU
    role: str | None = None  # starter, rotation
    injuries: str | None = None
    minutes_context: str | None = None
    coach_notes: str | None = None
    parent_notes: str | None = None


class PlayerUpdate(BaseModel):
    """Input for updating a player profile."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    grade: str | None = Field(default=None, min_length=1, max_length=50)
    position: str | None = Field(default=None, min_length=1, max_length=50)
    height: str | None = Field(default=None, max_length=20)
    team: str | None = None
    goals: list[str] | None = None
    competition_level: str | None = None
    role: str | None = None
    injuries: str | None = None
    minutes_context: str | None = None
    coach_notes: str | None = None
    parent_notes: str | None = None


class PlayerResponse(BaseModel):
    """Response for a player profile."""

    id: UUID
    user_id: UUID
    name: str
    grade: str
    position: str
    height: str | None
    team: str | None
    goals: list[str] | None
    competition_level: str | None
    role: str | None
    injuries: str | None
    minutes_context: str | None
    coach_notes: str | None
    parent_notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlayerWithGamesResponse(PlayerResponse):
    """Player profile with games and reports included."""

    games: list[PlayerGameResponse] = []
    reports: list["PlayerReportResponse"] = []  # Forward reference


# ============================================================================
# Player Report Schemas
# ============================================================================

ReportStatus = Literal["pending", "generating", "completed", "failed"]


class PlayerReportCreate(BaseModel):
    """Input for generating a player report."""

    # Optional: specify which games to include (defaults to all recent games)
    game_ids: list[UUID] | None = None


class PlayerReportResponse(BaseModel):
    """Response for a player report."""

    id: UUID
    player_id: UUID
    status: ReportStatus
    report_window: str | None
    report_json: dict | None
    model_used: (
        str | None
    )  # Note: This conflicts with Pydantic's protected namespace but matches DB schema
    prompt_version: str | None
    error_text: str | None
    share_token: str | None
    is_public: bool
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "protected_namespaces": (),  # Allow model_used field
    }


class PlayerReportWithPlayerResponse(PlayerReportResponse):
    """Report with player info included."""

    player: PlayerResponse


# ============================================================================
# Report JSON Schema Types (for frontend parsing)
# ============================================================================


class ReportMeta(BaseModel):
    """Report metadata section."""

    player_name: str
    report_window: str
    confidence_level: Literal["low", "medium", "high"]
    confidence_reason: str
    disclaimer: str


class KeyMetric(BaseModel):
    """A single key metric."""

    label: str
    value: str
    note: str


class DevelopmentReport(BaseModel):
    """Development report section."""

    strengths: list[str]
    growth_areas: list[str]
    trend_insights: list[str]
    key_metrics: list[KeyMetric]
    next_2_weeks_focus: list[str]


class Drill(BaseModel):
    """A single drill in the drill plan."""

    title: str
    why_this_drill: str
    how_to_do_it: str
    frequency: str
    success_metric: str


class CollegeFitIndicator(BaseModel):
    """College fit indicator section."""

    label: str
    reasoning: str
    what_to_improve_to_level_up: list[str]


class PlayerInfo(BaseModel):
    """Player info in profile section."""

    name: str
    grade: str
    position: str
    height: str
    team: str
    goals: list[str]


class PlayerProfile(BaseModel):
    """Player profile section."""

    headline: str
    player_info: PlayerInfo
    top_stats_snapshot: list[str]
    strengths_short: list[str]
    development_areas_short: list[str]
    coach_notes_summary: str
    highlight_summary_placeholder: str


class PerGameSummary(BaseModel):
    """Per-game summary in structured data."""

    game_label: str
    date: str
    opponent: str
    minutes: int
    pts: int
    reb: int
    ast: int
    stl: int
    blk: int
    tov: int
    fgm: int
    fga: int
    tpm: int
    tpa: int
    ftm: int
    fta: int
    notes: str


class ComputedInsights(BaseModel):
    """Computed insights in structured data."""

    games_count: int
    pts_avg: float
    reb_avg: float
    ast_avg: float
    tov_avg: float
    minutes_avg: float
    fg_pct: float
    three_pct: float
    ft_pct: float
    ast_to_tov_ratio: float


class StructuredData(BaseModel):
    """Structured data section."""

    per_game_summary: list[PerGameSummary]
    computed_insights: ComputedInsights


class FullPlayerReport(BaseModel):
    """The complete player report JSON structure."""

    meta: ReportMeta
    growth_summary: str
    development_report: DevelopmentReport
    drill_plan: list[Drill]
    motivational_message: str
    college_fit_indicator_v1: CollegeFitIndicator
    player_profile: PlayerProfile
    structured_data: StructuredData
