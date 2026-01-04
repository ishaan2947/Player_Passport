"""
Tests for Pydantic schema validation.
"""

from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from src.schemas.player import (
    PlayerCreate,
    PlayerGameCreate,
    PlayerGameUpdate,
    PlayerUpdate,
)
from src.schemas.player_report_content import (
    CollegeFitIndicator,
    PlayerReportContent,
    ReportMeta,
)


# ============================================================================
# PlayerGameCreate validation
# ============================================================================


class TestPlayerGameCreate:
    def test_valid_game(self):
        game = PlayerGameCreate(
            game_date=date.today() - timedelta(days=1),
            opponent="Test Team",
            pts=20, reb=5, ast=4, stl=2, blk=1, tov=3,
            fgm=8, fga=15, tpm=2, tpa=5, ftm=2, fta=3,
            minutes=30,
        )
        assert game.pts == 20
        assert game.opponent == "Test Team"

    def test_fgm_exceeds_fga(self):
        with pytest.raises(ValidationError, match="fgm.*cannot exceed.*fga"):
            PlayerGameCreate(
                game_date=date.today() - timedelta(days=1),
                opponent="Test", fgm=10, fga=5,
            )

    def test_tpm_exceeds_tpa(self):
        with pytest.raises(ValidationError, match="tpm.*cannot exceed.*tpa"):
            PlayerGameCreate(
                game_date=date.today() - timedelta(days=1),
                opponent="Test", tpm=5, tpa=3, fga=10,
            )

    def test_ftm_exceeds_fta(self):
        with pytest.raises(ValidationError, match="ftm.*cannot exceed.*fta"):
            PlayerGameCreate(
                game_date=date.today() - timedelta(days=1),
                opponent="Test", ftm=5, fta=3,
            )

    def test_tpa_exceeds_fga(self):
        with pytest.raises(ValidationError, match="tpa.*cannot exceed.*fga"):
            PlayerGameCreate(
                game_date=date.today() - timedelta(days=1),
                opponent="Test", tpa=10, fga=5,
            )

    def test_future_game_date(self):
        # Grace period allows +1 day; only 2+ days in the future should be rejected
        with pytest.raises(ValidationError, match="future"):
            PlayerGameCreate(
                game_date=date.today() + timedelta(days=2),
                opponent="Test",
            )

    def test_negative_stats_rejected(self):
        with pytest.raises(ValidationError):
            PlayerGameCreate(
                game_date=date.today() - timedelta(days=1),
                opponent="Test", pts=-5,
            )

    def test_stats_exceed_max(self):
        with pytest.raises(ValidationError):
            PlayerGameCreate(
                game_date=date.today() - timedelta(days=1),
                opponent="Test", pts=200,
            )

    def test_empty_opponent_rejected(self):
        with pytest.raises(ValidationError):
            PlayerGameCreate(
                game_date=date.today() - timedelta(days=1),
                opponent="",
            )

    def test_minutes_max(self):
        with pytest.raises(ValidationError):
            PlayerGameCreate(
                game_date=date.today() - timedelta(days=1),
                opponent="Test", minutes=61,
            )

    def test_zero_stats_valid(self):
        """All-zero stats should be valid (player didn't score)."""
        game = PlayerGameCreate(
            game_date=date.today() - timedelta(days=1),
            opponent="Test",
        )
        assert game.pts == 0
        assert game.fgm == 0


class TestPlayerGameUpdate:
    def test_partial_update(self):
        update = PlayerGameUpdate(pts=25)
        assert update.pts == 25
        assert update.reb is None

    def test_fgm_exceeds_fga_on_update(self):
        with pytest.raises(ValidationError, match="fgm.*cannot exceed.*fga"):
            PlayerGameUpdate(fgm=10, fga=5)

    def test_partial_shooting_no_validation_conflict(self):
        """Only fgm provided, no fga — should pass (can't compare)."""
        update = PlayerGameUpdate(fgm=10)
        assert update.fgm == 10


# ============================================================================
# PlayerCreate validation
# ============================================================================


class TestPlayerCreate:
    def test_valid_player(self):
        player = PlayerCreate(
            name="John Doe",
            grade="Junior",
            position="PG",
        )
        assert player.name == "John Doe"

    def test_empty_name_rejected(self):
        with pytest.raises(ValidationError):
            PlayerCreate(name="", grade="Junior", position="PG")

    def test_name_too_long(self):
        with pytest.raises(ValidationError):
            PlayerCreate(name="x" * 256, grade="Junior", position="PG")

    def test_optional_fields_default_none(self):
        player = PlayerCreate(name="Test", grade="Sophomore", position="SG")
        assert player.height is None
        assert player.team is None
        assert player.goals is None


class TestPlayerUpdate:
    def test_all_none_valid(self):
        update = PlayerUpdate()
        assert update.name is None

    def test_partial_update(self):
        update = PlayerUpdate(name="New Name")
        assert update.name == "New Name"
        assert update.grade is None


# ============================================================================
# Report content schema validation
# ============================================================================


class TestReportMeta:
    def test_disclaimer_must_include_guarantee_or_promise(self):
        with pytest.raises(ValidationError, match="guarantee|promise"):
            ReportMeta(
                player_name="Test",
                report_window="Jan 1-15, 2025",
                confidence_level="medium",
                confidence_reason="Based on 4 games with complete stats.",
                disclaimer="This report is based on limited data and observations only.",
            )

    def test_valid_disclaimer(self):
        meta = ReportMeta(
            player_name="Test",
            report_window="Jan 1-15, 2025",
            confidence_level="medium",
            confidence_reason="Based on 4 games with complete stats.",
            disclaimer="This report does not guarantee future performance or recruiting outcomes.",
        )
        assert meta.confidence_level == "medium"


class TestCollegeFitIndicator:
    def test_guarantee_language_rejected(self):
        with pytest.raises(ValidationError, match="guarantee"):
            CollegeFitIndicator(
                label="Guaranteed D1 prospect",
                reasoning="This player is clearly going to be a D1 player based on stats shown.",
                what_to_improve_to_level_up=["Shooting", "Defense"],
            )

    def test_valid_label(self):
        cfi = CollegeFitIndicator(
            label="Developing Guard (HS Varsity Track)",
            reasoning="Based on current stats, this player shows potential at the high school varsity level.",
            what_to_improve_to_level_up=["Improve 3-point shooting", "Reduce turnovers"],
        )
        assert "Developing" in cfi.label
