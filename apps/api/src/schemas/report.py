"""Report schemas for API request/response validation."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class KeyInsight(BaseModel):
    """A key insight from the game analysis."""

    title: str = Field(..., description="Brief title of the insight")
    description: str = Field(..., description="Detailed description of the insight")
    evidence: str = Field(
        ..., description="Stats or observations supporting this insight"
    )
    confidence: Literal["high", "medium", "low"] = Field(
        ..., description="Confidence level based on available data"
    )


class ActionItem(BaseModel):
    """An actionable recommendation for improvement."""

    title: str = Field(..., description="Brief title of the action item")
    description: str = Field(..., description="Detailed description of what to do")
    metric: str = Field(..., description="How to measure success")
    priority: Literal["high", "medium", "low"] = Field(
        ..., description="Priority level"
    )


class QuestionForNextGame(BaseModel):
    """A question to consider for the next game."""

    question: str = Field(..., description="The question to ask")
    context: str = Field(..., description="Why this question matters")


class ReportContent(BaseModel):
    """Structured content of a game report stored in report_json."""

    summary: str = Field(
        ...,
        description="2-4 sentence game overview",
        min_length=50,
        max_length=500,
    )
    key_insights: list[KeyInsight] = Field(
        ...,
        description="3 key insights from the game",
        min_length=3,
        max_length=3,
    )
    action_items: list[ActionItem] = Field(
        ...,
        description="2 specific action items for improvement",
        min_length=2,
        max_length=2,
    )
    practice_focus: str = Field(
        ...,
        description="One theme to focus on in the next practice",
        min_length=20,
        max_length=300,
    )
    questions_for_next_game: list[QuestionForNextGame] = Field(
        ...,
        description="2-3 questions to consider for the next game",
        min_length=2,
        max_length=3,
    )
    # Metadata stored with content
    model_used: str | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    generation_time_ms: int | None = None
    risk_flags: list[str] = Field(default_factory=list)


class ReportOut(BaseModel):
    """Report response schema."""

    id: UUID
    game_id: UUID
    status: str

    # Report content (from report_json)
    summary: str | None = None
    key_insights: list[KeyInsight] = Field(default_factory=list)
    action_items: list[ActionItem] = Field(default_factory=list)
    practice_focus: str | None = None
    questions_for_next_game: list[QuestionForNextGame] = Field(default_factory=list)

    # Metadata
    model_used: str | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    generation_time_ms: int | None = None
    risk_flags: list[str] = Field(default_factory=list)

    created_at: datetime

    class Config:
        from_attributes = True


class GenerateReportRequest(BaseModel):
    """Request schema for generating a report."""

    force_regenerate: bool = Field(
        default=False,
        description="Force regeneration even if a report already exists",
    )
    additional_context: str | None = Field(
        None,
        max_length=1000,
        description="Additional context to include in the analysis",
    )


class GenerateReportResponse(BaseModel):
    """Response schema for report generation."""

    report: ReportOut
    was_regenerated: bool = Field(
        ..., description="Whether this was a new generation or existing report"
    )
