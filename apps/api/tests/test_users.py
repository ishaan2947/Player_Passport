"""
Tests for user endpoints.
"""


class TestGetCurrentUser:
    def test_get_me(self, client, test_user, auth_headers):
        response = client.get("/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["player_count"] == 0

    def test_get_me_with_players(self, client, test_user, test_player, auth_headers):
        response = client.get("/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["player_count"] == 1

    def test_get_me_no_auth(self, client):
        response = client.get("/users/me")
        assert response.status_code == 401


class TestDataExport:
    def test_export_data_empty(self, client, test_user, auth_headers):
        response = client.get("/users/me/data-export", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "test@example.com"
        assert data["players"] == []
        assert "exported_at" in data

    def test_export_data_with_players(self, client, test_user, test_player, test_games, auth_headers):
        response = client.get("/users/me/data-export", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["players"]) == 1
        assert len(data["players"][0]["games"]) == 5


class TestDeleteAccount:
    def test_delete_account(self, client, test_user, auth_headers):
        response = client.delete("/users/me", headers=auth_headers)
        assert response.status_code == 204

    def test_delete_account_cascades(self, client, test_user, test_player, test_games, auth_headers):
        """Deleting a user should cascade to players and games."""
        response = client.delete("/users/me", headers=auth_headers)
        assert response.status_code == 204
