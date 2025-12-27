"""
Tests for service layer logic.
"""

from datetime import date, timedelta
from unittest.mock import MagicMock

from src.services.player_report_generator import (
    _get_cache_key,
    build_input_json,
    compute_report_window,
)


class TestBuildInputJson:
    def test_basic_input(self):
        player = MagicMock()
        player.name = "Test Player"
        player.grade = "Junior"
        player.position = "PG"
        player.height = "6'0\""
        player.team = "Test Team"
        player.goals = ["Score 20 PPG"]
        player.competition_level = None
        player.role = None
        player.injuries = None
        player.minutes_context = None
        player.coach_notes = None
        player.parent_notes = None

        game = MagicMock()
        game.game_date = date(2025, 1, 1)
        game.game_label = "Game 1"
        game.opponent = "Rival"
        game.minutes = 30
        game.pts = 20
        game.reb = 5
        game.ast = 4
        game.stl = 2
        game.blk = 1
        game.tov = 3
        game.fgm = 8
        game.fga = 15
        game.tpm = 2
        game.tpa = 5
        game.ftm = 2
        game.fta = 3
        game.notes = None

        result = build_input_json(player, [game])
        assert result["player"]["name"] == "Test Player"
        assert len(result["games"]) == 1
        assert result["games"][0]["pts"] == 20
        assert "context" not in result  # No context provided

    def test_context_included_when_present(self):
        player = MagicMock()
        player.name = "Test"
        player.grade = "Senior"
        player.position = "C"
        player.height = None
        player.team = None
        player.goals = None
        player.competition_level = "Varsity"
        player.role = "Starter"
        player.injuries = None
        player.minutes_context = None
        player.coach_notes = "Great player"
        player.parent_notes = None

        result = build_input_json(player, [])
        assert "context" in result
        assert result["context"]["competition_level"] == "Varsity"
        assert result["coach_notes"] == "Great player"


class TestComputeReportWindow:
    def test_single_game(self):
        game = MagicMock()
        game.game_date = date(2025, 1, 15)
        result = compute_report_window([game])
        assert "Jan 15, 2025" in result

    def test_same_month(self):
        g1 = MagicMock()
        g1.game_date = date(2025, 1, 5)
        g2 = MagicMock()
        g2.game_date = date(2025, 1, 20)
        result = compute_report_window([g1, g2])
        assert "Jan" in result
        assert "05" in result or "5" in result
        assert "20" in result

    def test_different_months(self):
        g1 = MagicMock()
        g1.game_date = date(2025, 1, 15)
        g2 = MagicMock()
        g2.game_date = date(2025, 2, 10)
        result = compute_report_window([g1, g2])
        assert "Jan" in result
        assert "Feb" in result

    def test_no_games(self):
        result = compute_report_window([])
        assert result == "No games"


class TestCacheKey:
    def test_deterministic(self):
        key1 = _get_cache_key("player-1", ["game-a", "game-b"])
        key2 = _get_cache_key("player-1", ["game-a", "game-b"])
        assert key1 == key2

    def test_order_independent(self):
        key1 = _get_cache_key("player-1", ["game-a", "game-b"])
        key2 = _get_cache_key("player-1", ["game-b", "game-a"])
        assert key1 == key2

    def test_different_players_different_keys(self):
        key1 = _get_cache_key("player-1", ["game-a"])
        key2 = _get_cache_key("player-2", ["game-a"])
        assert key1 != key2
