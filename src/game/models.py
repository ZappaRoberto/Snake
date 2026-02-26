"""Data models for the 3D Snake Game."""

from enum import StrEnum

from pydantic import BaseModel


class Direction(StrEnum):
    """Possible movement directions for the snake."""

    UP = "UP"
    DOWN = "DOWN"
    LEFT = "LEFT"
    RIGHT = "RIGHT"

    def to_offset(self) -> tuple[int, int]:
        """Convert direction to (dx, dy) offset."""
        offsets: dict[Direction, tuple[int, int]] = {
            Direction.UP: (0, -1),
            Direction.DOWN: (0, 1),
            Direction.LEFT: (-1, 0),
            Direction.RIGHT: (1, 0),
        }
        return offsets[self]


class Point(BaseModel):
    """A point on the game grid."""

    x: int
    y: int

    def __hash__(self) -> int:
        return hash((self.x, self.y))

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Point):
            return False
        return self.x == other.x and self.y == other.y


class GameState(StrEnum):
    """Current state of the game."""

    RUNNING = "running"
    PAUSED = "paused"
    GAME_OVER = "game_over"


class SnakeGameModel(BaseModel):
    """Complete snake game state."""

    id: str
    snake: list[Point]
    food: Point
    direction: Direction
    score: int
    grid_size: tuple[int, int]
    state: GameState
