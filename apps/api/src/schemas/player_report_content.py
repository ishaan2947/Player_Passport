"""
Structured schema for Player Passport report JSON content.

This schema validates the AI-generated report JSON to ensure it matches
the expected structure and contains safe, appropriate content.
"""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ReportMeta(BaseModel):
    """Report metadata section."""

    player_name: str = Field(..., min_length=1, max_length=255)
    report_window: str = Field(..., min_length=1, max_length=100)
    confidence_level: Literal["low", "medium", "high"] = Field(...)
    confidence_reason: str = Field(..., min_length=10, max_length=500)
    disclaimer: str = Field(..., min_length=50, max_length=1000)

    @field_validator("disclaimer")
    @classmethod
    def validate_disclaimer(cls, v: str) -> str:
        """Ensure disclaimer includes safety language."""
        v_lower = v.lower()
        # Ensure disclaimer mentions no guarantees
        if "guarantee" not in v_lower and "promise" not in v_lower:
            raise ValueError("Disclaimer must mention no guarantees or promises")
        return v


class KeyMetric(BaseModel):
    """A single key metric in the development report."""

    label: str = Field(..., min_length=1, max_length=100)
    value: str = Field(..., min_length=1, max_length=50)
    note: str = Field(..., min_length=10, max_length=300)


class DevelopmentReport(BaseModel):
    """Development report section."""

    strengths: list[str] = Field(..., min_length=2, max_length=5)
    growth_areas: list[str] = Field(..., min_length=2, max_length=5)
    trend_insights: list[str] = Field(..., min_length=3, max_length=5)
    key_metrics: list[KeyMetric] = Field(..., min_length=3, max_length=6)
    next_2_weeks_focus: list[str] = Field(..., min_length=3, max_length=5)

    @field_validator("strengths", "growth_areas", "trend_insights", "next_2_weeks_focus")
    @classmethod
    def validate_list_items(cls, v: list[str]) -> list[str]:
        """Ensure list items are non-empty and reasonable length."""
        for item in v:
            if not item.strip() or len(item) > 300:
                raise ValueError("All list items must be non-empty and under 300 characters")
        return v


class Drill(BaseModel):
    """A single drill in the drill plan."""

    title: str = Field(..., min_length=5, max_length=100)
    why_this_drill: str = Field(..., min_length=20, max_length=300)
    how_to_do_it: str = Field(..., min_length=30, max_length=500)
    frequency: str = Field(..., min_length=5, max_length=100)
    success_metric: str = Field(..., min_length=10, max_length=200)


class CollegeFitIndicator(BaseModel):
    """College fit indicator section (cautious placeholder)."""

    label: str = Field(..., min_length=10, max_length=150)
    reasoning: str = Field(..., min_length=50, max_length=500)
    what_to_improve_to_level_up: list[str] = Field(..., min_length=2, max_length=5)

    @field_validator("label")
    @classmethod
    def validate_label(cls, v: str) -> str:
        """Ensure label doesn't make recruiting guarantees."""
        v_lower = v.lower()
        forbidden_terms = ["guaranteed", "definitely", "will get", "assured"]
        for term in forbidden_terms:
            if term in v_lower:
                raise ValueError(f"Label cannot contain guarantee language: '{term}'")
        return v


class PlayerInfo(BaseModel):
    """Player info in profile section."""

    name: str = Field(..., min_length=1, max_length=255)
    grade: str = Field(..., min_length=1, max_length=50)
    position: str = Field(..., min_length=1, max_length=50)
    height: str = Field(default="", max_length=20)
    team: str = Field(default="", max_length=255)
    goals: list[str] = Field(default_factory=list, max_length=10)


class PlayerProfile(BaseModel):
    """Player profile section."""

    headline: str = Field(..., min_length=10, max_length=200)
    player_info: PlayerInfo
    top_stats_snapshot: list[str] = Field(..., min_length=3, max_length=5)
    strengths_short: list[str] = Field(..., min_length=2, max_length=4)
    development_areas_short: list[str] = Field(..., min_length=2, max_length=4)
    coach_notes_summary: str = Field(..., min_length=10, max_length=500)
    highlight_summary_placeholder: str = Field(..., min_length=20, max_length=300)

    @field_validator("headline")
    @classmethod
    def validate_headline(cls, v: str) -> str:
        """Ensure headline doesn't make recruiting guarantees."""
        v_lower = v.lower()
        forbidden_terms = ["guaranteed scholarship", "will be recruited", "college bound"]
        for term in forbidden_terms:
            if term in v_lower:
                raise ValueError(f"Headline cannot contain guarantee language: '{term}'")
        return v


class PerGameSummary(BaseModel):
    """Per-game summary in structured data."""

    game_label: str = Field(..., min_length=1, max_length=100)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")  # ISO date format
    opponent: str = Field(..., min_length=1, max_length=255)
    minutes: int | None = Field(None, ge=0, le=48)
    pts: int = Field(..., ge=0, le=100)
    reb: int = Field(..., ge=0, le=50)
    ast: int = Field(..., ge=0, le=30)
    stl: int = Field(..., ge=0, le=20)
    blk: int = Field(..., ge=0, le=20)
    tov: int = Field(..., ge=0, le=20)
    fgm: int = Field(..., ge=0, le=50)
    fga: int = Field(..., ge=0, le=100)
    tpm: int = Field(..., ge=0, le=30)
    tpa: int = Field(..., ge=0, le=50)
    ftm: int = Field(..., ge=0, le=30)
    fta: int = Field(..., ge=0, le=40)
    notes: str = Field(default="", max_length=1000)


class ComputedInsights(BaseModel):
    """Computed insights in structured data."""

    games_count: int = Field(..., ge=1, le=10)
    pts_avg: float = Field(..., ge=0.0, le=100.0)
    reb_avg: float = Field(..., ge=0.0, le=50.0)
    ast_avg: float = Field(..., ge=0.0, le=30.0)
    tov_avg: float = Field(..., ge=0.0, le=20.0)
    minutes_avg: float = Field(..., ge=0.0, le=48.0)
    fg_pct: float = Field(..., ge=0.0, le=100.0)
    three_pct: float = Field(..., ge=0.0, le=100.0)
    ft_pct: float = Field(..., ge=0.0, le=100.0)
    ast_to_tov_ratio: float = Field(..., ge=0.0, le=10.0)


class StructuredData(BaseModel):
    """Structured data section."""

    per_game_summary: list[PerGameSummary] = Field(..., min_length=1, max_length=10)
    computed_insights: ComputedInsights


class PlayerReportContent(BaseModel):
    """The complete player report JSON structure."""

    meta: ReportMeta
    growth_summary: str = Field(..., min_length=100, max_length=2000)
    development_report: DevelopmentReport
    drill_plan: list[Drill] = Field(..., min_length=3, max_length=5)
    motivational_message: str = Field(..., min_length=50, max_length=500)
    college_fit_indicator_v1: CollegeFitIndicator
    player_profile: PlayerProfile
    structured_data: StructuredData

    @field_validator("growth_summary", "motivational_message")
    @classmethod
    def validate_text_content(cls, v: str) -> str:
        """Ensure text content doesn't contain inappropriate guarantees."""
        v_lower = v.lower()
        # Check for medical advice
        medical_keywords = ["diagnose", "treatment", "medication", "injury treatment", "see a doctor"]
        for keyword in medical_keywords:
            if keyword in v_lower:
                raise ValueError(f"Content cannot contain medical advice: '{keyword}'")
        
        # Check for recruiting guarantees
        guarantee_keywords = ["guaranteed scholarship", "definitely will", "assured acceptance"]
        for keyword in guarantee_keywords:
            if keyword in v_lower:
                raise ValueError(f"Content cannot contain recruiting guarantees: '{keyword}'")
        
        return v

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "meta": {
                        "player_name": "John Doe",
                        "report_window": "Dec 1-15, 2024",
                        "confidence_level": "medium",
                        "confidence_reason": "Based on 4 games with complete stats",
                        "disclaimer": "This report is based on limited data and does not guarantee future performance or recruiting outcomes."
                    },
                    "growth_summary": "...",
                    "development_report": {...},
                    "drill_plan": [...],
                    "motivational_message": "...",
                    "college_fit_indicator_v1": {...},
                    "player_profile": {...},
                    "structured_data": {...}
                }
            ]
        }
    }

