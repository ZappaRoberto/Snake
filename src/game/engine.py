"""Core game engine for the 3D Snake Game."""

import random

from src.game.models import Direction, GameState, Point, SnakeGameModel

GRID_SIZE_DEFAULT = 20


class SnakeGameEngine:
    """Engine that manages snake game logic and state transitions."""

    def __init__(self, grid_size: int = GRID_SIZE_DEFAULT):
        """
        Initialize the game engine.

        Args:
            grid_size: Size of the square grid (grid_size x grid_size).
        """
        self.grid_size = grid_size

    def create_new_game(self, game_id: str) -> SnakeGameModel:
        """
        Create a new game state with initial values.

        Args:
            game_id: Unique identifier for this game session.

        Returns:
            New SnakeGameModel in starting state.
        """
        # Center the snake
        center = self.grid_size // 2

        # Initial snake pointing right
        snake = [
            Point(x=center - i, y=center)
            for i in range(3)  # Length of 3
        ]

        food = self._spawn_food(snake)

        return SnakeGameModel(
            id=game_id,
            snake=snake,
            food=food,
            direction=Direction.RIGHT,
            score=0,
            grid_size=(self.grid_size, self.grid_size),
            state=GameState.RUNNING,
        )

    def move_snake(self, game: SnakeGameModel, new_direction: Direction) -> SnakeGameModel:
        """
        Move the snake in the specified direction.

        Args:
            game: Current game state.
            new_direction: Direction to move.

        Returns:
            Updated game state after moving.
        """
        # Prevent reversing direction
        if self._is_opposite_direction(game.direction, new_direction):
            new_direction = game.direction

        head = game.snake[0]
        dx, dy = new_direction.to_offset()
        new_head = Point(x=head.x + dx, y=head.y + dy)

        # Check for collisions
        collision = self._check_collision(game, new_head)

        if collision:
            return SnakeGameModel(
                id=game.id,
                snake=game.snake,
                food=game.food,
                direction=new_direction,
                score=game.score,
                grid_size=game.grid_size,
                state=GameState.GAME_OVER,
            )

        # Calculate new snake position
        new_snake = [new_head] + game.snake[:-1]

        # Check if food was eaten
        if new_head == game.food:
            new_snake = [new_head] + game.snake  # Grow snake
            score = game.score + 10
            food = self._spawn_food(new_snake)
        else:
            score = game.score
            food = game.food

        return SnakeGameModel(
            id=game.id,
            snake=new_snake,
            food=food,
            direction=new_direction,
            score=score,
            grid_size=game.grid_size,
            state=GameState.RUNNING,
        )

    def reset_game(self, game: SnakeGameModel) -> SnakeGameModel:
        """
        Reset the game to initial state while keeping same ID.

        Args:
            game: Current game state (used for ID).

        Returns:
            New game state with fresh snake and food.
        """
        return self.create_new_game(game.id)

    def pause_game(self, game: SnakeGameModel) -> SnakeGameModel:
        """Pause the current game."""
        return SnakeGameModel(
            id=game.id,
            snake=game.snake,
            food=game.food,
            direction=game.direction,
            score=game.score,
            grid_size=game.grid_size,
            state=GameState.PAUSED,
        )

    def resume_game(self, game: SnakeGameModel) -> SnakeGameModel:
        """Resume a paused game."""
        return SnakeGameModel(
            id=game.id,
            snake=game.snake,
            food=game.food,
            direction=game.direction,
            score=game.score,
            grid_size=game.grid_size,
            state=GameState.RUNNING,
        )

    def _spawn_food(self, snake: list[Point]) -> Point:
        """
        Generate a new food position not on the snake.

        Args:
            snake: Current snake positions.

        Returns:
            New food point.
        """
        snake_set = {(p.x, p.y) for p in snake}

        while True:
            x = random.randint(0, self.grid_size - 1)
            y = random.randint(0, self.grid_size - 1)

            if (x, y) not in snake_set:
                return Point(x=x, y=y)

    def _check_collision(self, game: SnakeGameModel, head: Point) -> bool:
        """
        Check if the new head position collides with wall or self.

        Args:
            game: Current game state.
            head: New head position to check.

        Returns:
            True if collision detected, False otherwise.
        """
        # Wall collision
        if head.x < 0 or head.x >= game.grid_size[0]:
            return True
        if head.y < 0 or head.y >= game.grid_size[1]:
            return True

        # Self collision (check against all segments except tail which will move)
        return any(head == segment for segment in game.snake[:-1])

    def _is_opposite_direction(self, current: Direction, new: Direction) -> bool:
        """
        Check if the new direction is opposite to current.

        Args:
            current: Current movement direction.
            new: Proposed movement direction.

        Returns:
            True if directions are opposite.
        """
        opposites = {
            Direction.UP: Direction.DOWN,
            Direction.DOWN: Direction.UP,
            Direction.LEFT: Direction.RIGHT,
            Direction.RIGHT: Direction.LEFT,
        }
        return opposites[current] == new
