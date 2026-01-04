"""
Tests for player CRUD endpoints.
"""

import uuid
from datetime import date, timedelta

import pytest
from sqlalchemy.orm import Session

from src.models import Player, User


class TestCreatePlayer:
    def test_create_player_success(self, client, test_user, auth_headers):
        response = client.post(
            "/players",
            json={
                "name": "New Player",
                "grade": "Sophomore",
                "position": "SG",
                "height": "5'11\"",
                "team": "Test Team",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Player"
        assert data["grade"] == "Sophomore"
        assert data["position"] == "SG"

    def test_create_player_minimal(self, client, test_user, auth_headers):
        response = client.post(
            "/players",
            json={"name": "Min Player", "grade": "Junior", "position": "PG"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["height"] is None
        assert data["team"] is None

    def test_create_player_no_auth(self, client):
        response = client.post(
            "/players",
            json={"name": "No Auth", "grade": "Junior", "position": "PG"},
        )
        assert response.status_code == 401

    def test_create_player_empty_name(self, client, test_user, auth_headers):
        response = client.post(
            "/players",
            json={"name": "", "grade": "Junior", "position": "PG"},
            headers=auth_headers,
        )
        assert response.status_code == 422


class TestListPlayers:
    def test_list_players_empty(self, client, test_user, auth_headers):
        response = client.get("/players", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_list_players_with_data(self, client, test_user, test_player, auth_headers):
        response = client.get("/players", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test Player"

    def test_list_players_no_auth(self, client):
        response = client.get("/players")
        assert response.status_code == 401


class TestGetPlayer:
    def test_get_player_success(self, client, test_user, test_player, auth_headers):
        response = client.get(f"/players/{test_player.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Player"
        assert "games" in data

    def test_get_player_not_found(self, client, test_user, auth_headers):
        fake_id = uuid.uuid4()
        response = client.get(f"/players/{fake_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_get_other_users_player(self, client, db, test_player):
        """Users should not see other users' players."""
        other_user = User(
            id=uuid.uuid4(),
            clerk_user_id="user_other_002",
            email="other@example.com",
        )
        db.add(other_user)
        db.commit()

        response = client.get(
            f"/players/{test_player.id}",
            headers={"Authorization": "Bearer dev_user_other_002"},
        )
        assert response.status_code == 404


class TestUpdatePlayer:
    def test_update_player_name(self, client, test_user, test_player, auth_headers):
        response = client.patch(
            f"/players/{test_player.id}",
            json={"name": "Updated Name"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"

    def test_update_player_not_found(self, client, test_user, auth_headers):
        fake_id = uuid.uuid4()
        response = client.patch(
            f"/players/{fake_id}",
            json={"name": "Ghost"},
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestDeletePlayer:
    def test_delete_player_success(self, client, test_user, test_player, auth_headers):
        response = client.delete(f"/players/{test_player.id}", headers=auth_headers)
        assert response.status_code == 204

        # Verify deleted
        response = client.get(f"/players/{test_player.id}", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_player_not_found(self, client, test_user, auth_headers):
        fake_id = uuid.uuid4()
        response = client.delete(f"/players/{fake_id}", headers=auth_headers)
        assert response.status_code == 404


# ============================================================================
# Game CRUD
# ============================================================================


class TestCreateGame:
    def test_create_game_success(self, client, test_user, test_player, auth_headers):
        response = client.post(
            f"/players/{test_player.id}/games",
            json={
                "game_date": str(date.today() - timedelta(days=1)),
                "opponent": "Rival Team",
                "pts": 20, "reb": 5, "ast": 4, "stl": 2, "blk": 1, "tov": 3,
                "fgm": 8, "fga": 15, "tpm": 2, "tpa": 5, "ftm": 2, "fta": 3,
                "minutes": 30,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["pts"] == 20
        assert data["opponent"] == "Rival Team"

    def test_create_game_validation_fgm_gt_fga(self, client, test_user, test_player, auth_headers):
        response = client.post(
            f"/players/{test_player.id}/games",
            json={
                "game_date": str(date.today() - timedelta(days=1)),
                "opponent": "Test",
                "fgm": 10, "fga": 5,
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_create_game_future_date(self, client, test_user, test_player, auth_headers):
        # Grace period allows +1 day; 2+ days in the future should be rejected
        response = client.post(
            f"/players/{test_player.id}/games",
            json={
                "game_date": str(date.today() + timedelta(days=2)),
                "opponent": "Future Team",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_create_game_for_nonexistent_player(self, client, test_user, auth_headers):
        fake_id = uuid.uuid4()
        response = client.post(
            f"/players/{fake_id}/games",
            json={
                "game_date": str(date.today() - timedelta(days=1)),
                "opponent": "Test",
            },
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestListGames:
    def test_list_games_empty(self, client, test_user, test_player, auth_headers):
        response = client.get(f"/players/{test_player.id}/games", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_list_games_with_data(self, client, test_user, test_player, test_games, auth_headers):
        response = client.get(f"/players/{test_player.id}/games", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5


class TestDeleteGame:
    def test_delete_game_success(self, client, test_user, test_player, test_games, auth_headers):
        game_id = test_games[0].id
        response = client.delete(
            f"/players/{test_player.id}/games/{game_id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

    def test_delete_game_not_found(self, client, test_user, test_player, auth_headers):
        fake_id = uuid.uuid4()
        response = client.delete(
            f"/players/{test_player.id}/games/{fake_id}",
            headers=auth_headers,
        )
        assert response.status_code == 404


# ============================================================================
# Reports
# ============================================================================


class TestCreateReport:
    def test_create_report_not_enough_games(self, client, test_user, test_player, auth_headers):
        """Report generation requires at least 3 games."""
        response = client.post(
            f"/players/{test_player.id}/reports",
            json={},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "3 games" in response.json()["detail"]

    def test_create_report_returns_202(self, client, test_user, test_player, test_games, auth_headers):
        """With enough games, should return 202 (accepted for background processing)."""
        response = client.post(
            f"/players/{test_player.id}/reports",
            json={},
            headers=auth_headers,
        )
        assert response.status_code == 202
        data = response.json()
        assert data["status"] == "pending"
        assert data["player_id"] == str(test_player.id)


class TestListReports:
    def test_list_reports_empty(self, client, test_user, test_player, auth_headers):
        response = client.get(f"/players/{test_player.id}/reports", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_list_reports_with_data(self, client, test_user, test_player, test_report, auth_headers):
        response = client.get(f"/players/{test_player.id}/reports", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "completed"


class TestGetReport:
    def test_get_report_success(self, client, test_user, test_player, test_report, auth_headers):
        response = client.get(
            f"/players/{test_player.id}/reports/{test_report.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["report_json"] is not None


class TestSharedReport:
    def test_get_shared_report_success(self, client, test_report):
        response = client.get(f"/players/share/{test_report.share_token}")
        assert response.status_code == 200
        data = response.json()
        assert "player" in data

    def test_get_shared_report_not_found(self, client):
        response = client.get("/players/share/nonexistent-token")
        assert response.status_code == 404

    def test_private_report_not_accessible(self, client, db, test_report):
        """Non-public reports should not be accessible via share link."""
        test_report.is_public = False
        db.commit()
        response = client.get(f"/players/share/{test_report.share_token}")
        assert response.status_code == 404
