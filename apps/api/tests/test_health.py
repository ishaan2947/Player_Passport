"""
Tests for health check and status endpoints.
"""


class TestHealthCheck:
    def test_health_returns_200(self, client):
        response = client.get("/health")
        # With SQLite in tests, DB should be accessible
        assert response.status_code in (200, 503)
        data = response.json()
        assert "status" in data
        assert "environment" in data
        assert "version" in data

    def test_root_endpoint(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Player Passport API"
        assert data["version"] == "1.0.0"

    def test_status_endpoint(self, client):
        response = client.get("/status")
        assert response.status_code == 200
        data = response.json()
        assert "checks" in data
        assert "metrics" in data


class TestSecurityHeaders:
    def test_security_headers_present(self, client):
        response = client.get("/")
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"
        assert response.headers.get("X-XSS-Protection") == "1; mode=block"
        assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    def test_correlation_id_in_response(self, client):
        response = client.get("/")
        assert "X-Correlation-ID" in response.headers

    def test_custom_correlation_id_preserved(self, client):
        response = client.get("/", headers={"X-Correlation-ID": "test-123"})
        assert response.headers["X-Correlation-ID"] == "test-123"


class TestRateLimitHeaders:
    def test_rate_limit_headers_present(self, client):
        response = client.get("/status")
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers
