"""REST API routes for 3D Snake Game."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from src.config.settings import settings
from src.game.engine import SnakeGameEngine
from src.game.models import Point
from src.services.high_scores import high_score_service

router = APIRouter(prefix="/api", tags=["game"])

# In-memory game storage for WebSocket sessions only (clients manage their own state)
ws_games: dict[str, SnakeGameEngine] = {}
engine = SnakeGameEngine(grid_size=settings.grid_size)


class SnakePoints(BaseModel):
    """Request body for apple generation - list of snake points."""

    snake_points: list[Point]


class ScoreResponse(BaseModel):
    """Response model for score endpoints."""

    game_id: str
    best_score: int


@router.get("/health")
def health_check() -> dict[str, int | str]:
    """
    Health check endpoint.

    Returns:
        Status indicating the server is running.
    """
    return {"status": "healthy", "grid_size": settings.grid_size}


@router.post("/apple")
async def generate_apple(snake_points: SnakePoints) -> Point:
    """
    Generate a new food position not on the snake body.

    Args:
        snake_points: List of current snake positions to avoid.

    Returns:
        New food point that doesn't overlap with the snake.
    """
    return engine._spawn_food(snake_points.snake_points)


@router.post("/score")
async def save_score(game_id: str, score: int) -> ScoreResponse:
    """
    Save a score and return the best score for this game.

    Args:
        game_id: Unique identifier for the game session.
        score: Score to save.

    Returns:
        ScoreResponse with current best score for the game.
    """
    best = high_score_service.save_score(game_id, score)
    return ScoreResponse(game_id=game_id, best_score=best)


@router.get("/score/{game_id}")
async def get_best_score(game_id: str) -> ScoreResponse:
    """
    Get the best score for a given game ID.

    Args:
        game_id: Unique identifier for the game session.

    Returns:
        ScoreResponse with best score for the game.
    """
    best = high_score_service.get_best(game_id)
    return ScoreResponse(game_id=game_id, best_score=best)


@router.websocket("/ws/game")
async def game_websocket(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for minimal server coordination.

    The client manages all game state locally. This websocket only handles:
        - Apple position requests when snake eats food
        - Score reporting on game over

    Events accepted from client:
        - "request_apple": {"snake_points": [{x, y}, ...]}
            Response: "apple_position": {x, y}
        - "report_score": {"game_id": str, "score": int, "final_snake_length": int}
            Response: "score_saved": {game_id, best_score}
        - "reset_request": Triggered on client reset
    """
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "request_apple":
                # Client needs new apple position after eating
                snake_points = [Point(x=p["x"], y=p["y"]) for p in data.get("snake_points", [])]
                new_food = engine._spawn_food(snake_points)
                await websocket.send_json(
                    {
                        "type": "apple_position",
                        "apple_position": {"x": new_food.x, "y": new_food.y},
                    }
                )

            elif message_type == "report_score":
                # Client reports game over score
                game_id = data.get("game_id", "unknown")
                score = data.get("score", 0)
                best = high_score_service.save_score(game_id, score)

                await websocket.send_json(
                    {
                        "type": "score_saved",
                        "game_id": game_id,
                        "score": score,
                        "best_score": best,
                    }
                )

            elif message_type == "reset_request":
                # Client is resetting - acknowledge
                await websocket.send_json({"type": "reset_acknowledged"})

    except WebSocketDisconnect:
        pass  # Client disconnected gracefully
