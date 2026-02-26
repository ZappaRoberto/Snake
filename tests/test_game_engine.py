"""Unit tests for the Snake Game Engine."""

import pytest

from src.game.engine import SnakeGameEngine
from src.game.models import Direction, GameState, Point, SnakeGameModel

# Magic value constants
INITIAL_SNAKE_LENGTH = 3
DEFAULT_GRID_SIZE = 20
SCORE_PER_FOOD = 10


class TestSnakeGameEngine:
    """Tests for SnakeGameEngine core functionality."""

    @pytest.fixture
    def engine(self) -> SnakeGameEngine:
        """Create a game engine with default grid size."""
        return SnakeGameEngine(grid_size=DEFAULT_GRID_SIZE)

    def test_create_new_game_initial_state(self, engine: SnakeGameEngine) -> None:
        """Test that a new game starts with correct initial values."""
        game = engine.create_new_game("test-game-1")

        assert game.id == "test-game-1"
        assert len(game.snake) == INITIAL_SNAKE_LENGTH
        assert game.score == 0
        assert game.direction == Direction.RIGHT
        assert game.state == GameState.RUNNING
        assert game.grid_size == (DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE)
        # Food should be on grid
        assert 0 <= game.food.x < DEFAULT_GRID_SIZE
        assert 0 <= game.food.y < DEFAULT_GRID_SIZE

    def test_create_new_game_snake_position(self, engine: SnakeGameEngine) -> None:
        """Test that snake starts centered and pointing right."""
        game = engine.create_new_game("test")

        center = 10  # grid_size // 2
        expected_positions = [Point(x=center - i, y=center) for i in range(3)]

        assert game.snake == expected_positions

    def test_move_snake_right(self, engine: SnakeGameEngine) -> None:
        """Test moving snake right."""
        game = engine.create_new_game("test")
        initial_head = game.snake[0]

        # Move right
        new_game = engine.move_snake(game, Direction.RIGHT)

        expected_head = Point(x=initial_head.x + 1, y=initial_head.y)
        assert new_game.snake[0] == expected_head
        assert new_game.direction == Direction.RIGHT

    def test_move_snake_up(self, engine: SnakeGameEngine) -> None:
        """Test moving snake up."""
        game = engine.create_new_game("test")
        # Change direction to UP first
        new_game = engine.move_snake(game, Direction.UP)

        assert new_game.direction == Direction.UP
        head = new_game.snake[0]
        # Should move from center to center-1 in y
        expected_y = 10 - 1  # center - 1
        assert head.y == expected_y

    def test_prevent_reverse_direction(self, engine: SnakeGameEngine) -> None:
        """Test that snake cannot reverse direction."""
        game = engine.create_new_game("test")
        assert game.direction == Direction.RIGHT

        # Try to move left (opposite of right)
        new_game = engine.move_snake(game, Direction.LEFT)

        # Should ignore the invalid move
        assert new_game.direction == Direction.RIGHT
        # Snake should have moved right instead
        assert new_game.snake[0].x > game.snake[0].x

    def test_wall_collision_detection(self, engine: SnakeGameEngine) -> None:
        """Test that hitting a wall results in game over."""
        # Create a small grid for easier testing
        tiny_engine = SnakeGameEngine(grid_size=5)
        game = tiny_engine.create_new_game("test")

        # Move snake to edge and then into wall
        for _ in range(4):  # Move towards right edge
            game = tiny_engine.move_snake(game, Direction.RIGHT)

        # Now at x=4 (edge), next move should hit wall
        new_game = tiny_engine.move_snake(game, Direction.RIGHT)
        assert new_game.state == GameState.GAME_OVER

    def test_self_collision_detection(self, engine: SnakeGameEngine) -> None:
        """Test that hitting self results in game over."""
        # Use a small grid and longer snake for collision testing
        tiny_engine = SnakeGameEngine(grid_size=8)

        # Create snake pointing right with 5 segments (long enough to collide)
        center = 4
        game = SnakeGameModel(
            id="test",
            snake=[
                Point(x=center + 1, y=center),
                Point(x=center, y=center),
                Point(x=center - 1, y=center),
                Point(x=center - 2, y=center),
                Point(x=center - 3, y=center),
            ],
            food=Point(x=0, y=0),
            direction=Direction.RIGHT,
            score=0,
            grid_size=(8, 8),
            state=GameState.RUNNING,
        )

        # Move down
        game = tiny_engine.move_snake(game, Direction.DOWN)

        # Move left - head goes to (3,5)
        game = tiny_engine.move_snake(game, Direction.LEFT)

        # Move up - head goes to (3,4), which should collide with body at (4,4) or similar
        new_game = tiny_engine.move_snake(game, Direction.UP)
        assert new_game.state == GameState.GAME_OVER

    def test_food_eating_grows_snake(self, engine: SnakeGameEngine) -> None:
        """Test that eating food grows snake and increases score."""
        # Create a game with small grid to control food placement
        tiny_engine = SnakeGameEngine(grid_size=5)
        center = 2

        # Place food directly in front of head (to the right)
        game = SnakeGameModel(
            id="test",
            snake=[
                Point(x=center, y=center),
                Point(x=center - 1, y=center),
                Point(x=center - 2, y=center),
            ],
            food=Point(x=center + 1, y=center),  # Right next to head
            direction=Direction.RIGHT,
            score=0,
            grid_size=(5, 5),
            state=GameState.RUNNING,
        )

        # Move right into the food
        result = tiny_engine.move_snake(game, Direction.RIGHT)

        assert len(result.snake) == INITIAL_SNAKE_LENGTH + 1
        assert result.score == SCORE_PER_FOOD

    def test_food_spawning_not_on_snake(self, engine: SnakeGameEngine) -> None:
        """Test that food never spawns on snake body."""
        game = engine.create_new_game("test")
        snake_positions = {(p.x, p.y) for p in game.snake}

        # Food should not be on any snake segment
        assert (game.food.x, game.food.y) not in snake_positions

    def test_reset_game(self, engine: SnakeGameEngine) -> None:
        """Test that reset preserves ID but resets state."""
        game = engine.create_new_game("persistent-id")
        # Make some changes
        game = engine.move_snake(game, Direction.UP)
        game = engine.move_snake(game, Direction.LEFT)

        new_game = engine.reset_game(game)

        assert new_game.id == "persistent-id"
        assert len(new_game.snake) == INITIAL_SNAKE_LENGTH
        assert new_game.score == 0
        assert new_game.state == GameState.RUNNING

    def test_pause_and_resume(self, engine: SnakeGameEngine) -> None:
        """Test pausing and resuming game."""
        game = engine.create_new_game("test")

        paused = engine.pause_game(game)
        assert paused.state == GameState.PAUSED

        resumed = engine.resume_game(paused)
        assert resumed.state == GameState.RUNNING

    def test_multiple_games_independent(self, engine: SnakeGameEngine) -> None:
        """Test that multiple games maintain independent state."""
        game1 = engine.create_new_game("game-1")
        game2 = engine.create_new_game("game-2")

        # Make different moves
        game1 = engine.move_snake(game1, Direction.UP)
        game2 = engine.move_snake(game2, Direction.RIGHT)

        assert game1.direction == Direction.UP
        assert game2.direction == Direction.RIGHT
