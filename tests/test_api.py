"""API tests for 3D Snake Game - minimal server side."""

import pytest
from fastapi.testclient import TestClient

from src.main import app

# Magic value constants
HTTP_OK = 200
GRID_SIZE = 20
INITIAL_SCORE = 0


@pytest.fixture
def client() -> TestClient:
    """Create test client for API endpoints."""
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for /api/health endpoint."""

    def test_health_check(self, client: TestClient) -> None:
        """Test health check returns healthy status."""
        response = client.get("/api/health")
        assert response.status_code == HTTP_OK
        data = response.json()
        assert data["status"] == "healthy"
        assert data["grid_size"] == GRID_SIZE


class TestAppleGenerationEndpoint:
    """Tests for /api/apple endpoint."""

    def test_generate_apple_not_on_snake(self, client: TestClient) -> None:
        """Test apple generates at valid position."""
        snake_points = [{"x": 10, "y": 10}, {"x": 10, "y": 11}, {"x": 10, "y": 12}]
        response = client.post("/api/apple", json={"snake_points": snake_points})
        assert response.status_code == HTTP_OK
        data = response.json()
        # Should have x and y coordinates
        assert "x" in data
        assert "y" in data
        # Should not be on the snake
        point_tuple = (data["x"], data["y"])
        snake_tuples = [(p["x"], p["y"]) for p in snake_points]
        assert point_tuple not in snake_tuples

    def test_generate_apple_empty_snake(self, client: TestClient) -> None:
        """Test apple generates with empty snake."""
        response = client.post("/api/apple", json={"snake_points": []})
        assert response.status_code == HTTP_OK
        data = response.json()
        assert "x" in data
        assert "y" in data


class TestScorePersistenceEndpoint:
    """Tests for /api/score endpoint."""

    def test_save_score(self, client: TestClient) -> None:
        """Test saving a score."""
        test_score = 50
        response = client.post("/api/score", params={"game_id": "test-123", "score": test_score})
        assert response.status_code == HTTP_OK
        data = response.json()
        assert data["game_id"] == "test-123"
        assert data["best_score"] == test_score

    def test_save_higher_score_updates_best(self, client: TestClient) -> None:
        """Test saving a higher score updates the best."""
        initial = 30
        higher = 100
        # Save initial score
        client.post("/api/score", params={"game_id": "test-456", "score": initial})

        # Save higher score
        response = client.post("/api/score", params={"game_id": "test-456", "score": higher})
        assert response.status_code == HTTP_OK
        data = response.json()
        assert data["best_score"] == higher

    def test_save_lower_score_keeps_best(self, client: TestClient) -> None:
        """Test saving a lower score keeps the existing best."""
        best = 150
        lower = 100
        # Save initial score
        client.post("/api/score", params={"game_id": "test-789", "score": best})

        # Try to save lower score
        response = client.post("/api/score", params={"game_id": "test-789", "score": lower})
        assert response.status_code == HTTP_OK
        data = response.json()
        assert data["best_score"] == best


class TestGetBestScoreEndpoint:
    """Tests for /api/score/{game_id} endpoint."""

    def test_get_best_score_exists(self, client: TestClient) -> None:
        """Test getting best score when it exists."""
        saved = 75
        # First save a score
        client.post("/api/score", params={"game_id": "get-test-1", "score": saved})

        response = client.get("/api/score/get-test-1")
        assert response.status_code == HTTP_OK
        data = response.json()
        assert data["game_id"] == "get-test-1"
        assert data["best_score"] == saved

    def test_get_best_score_not_exists(self, client: TestClient) -> None:
        """Test getting best score for non-existent game returns 0."""
        response = client.get("/api/score/nonexistent-game")
        assert response.status_code == HTTP_OK
        data = response.json()
        assert data["game_id"] == "nonexistent-game"
        assert data["best_score"] == INITIAL_SCORE
