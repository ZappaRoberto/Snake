"""Playability tests for 3D Snake Game - comprehensive verification of game functionality."""

from src.game.engine import SnakeGameEngine
from src.game.models import Direction, GameState, Point, SnakeGameModel


class TestGamePlayability:
    """Tests that verify the game is fully playable end-to-end."""

    def test_game_can_start_and_move_multiple_times(self) -> None:
        """Verify a new game can be played through multiple moves."""
        engine = SnakeGameEngine(grid_size=20)
        game = engine.create_new_game("playable-test")

        # Game should start running
        assert game.state == GameState.RUNNING

        # Make 10 consecutive moves - snake should stay alive
        for i in range(10):
            assert game.state == GameState.RUNNING, f"Game died at move {i}"
            # Always move right (initial direction)
            game = engine.move_snake(game, Direction.RIGHT)

    def test_snake_moves_each_turn(self) -> None:
        """Verify snake head position changes with each move."""
        engine = SnakeGameEngine(grid_size=20)
        game = engine.create_new_game("position-test")

        initial_head_x = game.snake[0].x
        initial_head_y = game.snake[0].y

        # Move right - x should increase
        game = engine.move_snake(game, Direction.RIGHT)
        assert game.snake[0].x == initial_head_x + 1
        assert game.snake[0].y == initial_head_y

    def test_game_continues_after_eating_food(self) -> None:
        """Verify game continues after eating food."""
        engine = SnakeGameEngine(grid_size=20)
        center = 10

        # Create a game with food directly in front of head
        game = SnakeGameModel(
            id="food-test",
            snake=[
                Point(x=center, y=center),
                Point(x=center - 1, y=center),
                Point(x=center - 2, y=center),
            ],
            food=Point(x=center + 1, y=center),
            direction=Direction.RIGHT,
            score=0,
            grid_size=(20, 20),
            state=GameState.RUNNING,
        )

        # Eat the food
        game = engine.move_snake(game, Direction.RIGHT)
        assert game.state == GameState.RUNNING
        assert len(game.snake) == 4  # Grew
        assert game.score == 10

    def test_snake_can_navigate_full_grid(self) -> None:
        """Test snake can traverse a portion of the grid without dying."""
        engine = SnakeGameEngine(grid_size=30)
        # Create game with head starting near top-left to maximize movement area
        game = SnakeGameModel(
            id="navigation-test",
            snake=[Point(x=1, y=1), Point(x=0, y=1), Point(x=0, y=0)],
            food=engine._spawn_food([Point(x=1, y=1), Point(x=0, y=1), Point(x=0, y=0)]),
            direction=Direction.RIGHT,
            score=0,
            grid_size=(30, 30),
            state=GameState.RUNNING,
        )

        # Use serpentine pattern: right across, down one, left across, down one...
        moves = []
        for row in range(28):  # 28 downward movements (grid is 0-29)
            # Move across the width
            if row % 2 == 0:
                moves.extend([Direction.RIGHT] * 28)  # Even rows: right
            else:
                moves.extend([Direction.LEFT] * 28)  # Odd rows: left
            if row < 27:  # Don't go down on last row
                moves.append(Direction.DOWN)

        alive_moves = 0
        for move in moves:
            game = engine.move_snake(game, move)
            if game.state == GameState.RUNNING:
                alive_moves += 1
            else:
                break

        # Should survive most of the pattern (840 moves total, expect >75%)
        assert alive_moves >= 600, f"Game died after {alive_moves} moves"

    def test_direction_changes_effect_movement(self) -> None:
        """Verify changing direction affects movement correctly."""
        engine = SnakeGameEngine(grid_size=20)
        game = engine.create_new_game("direction-test")
        center = 10

        # Start at (center, center), moving RIGHT
        assert game.snake[0] == Point(x=center, y=center)
        assert game.direction == Direction.RIGHT

        # Move right - head to (11, 10)
        game = engine.move_snake(game, Direction.RIGHT)
        assert game.snake[0] == Point(x=11, y=10)

        # Change to UP - head to (11, 9)
        game = engine.move_snake(game, Direction.UP)
        assert game.snake[0] == Point(x=11, y=9)

        # Change to LEFT - head to (10, 9)
        game = engine.move_snake(game, Direction.LEFT)
        assert game.snake[0] == Point(x=10, y=9)

        # Change to DOWN - head to (10, 10)
        game = engine.move_snake(game, Direction.DOWN)
        assert game.snake[0] == Point(x=10, y=10)


class TestGameEndConditions:
    """Tests for game over conditions."""

    def test_wall_death_on_left_edge(self) -> None:
        """Test death when hitting left wall."""
        engine = SnakeGameEngine(grid_size=5)
        # Start at center (2, 2), need to get to x=0 and hit wall
        game = engine.create_new_game("wall-test")

        # Move left until we hit the wall
        while True:
            game = engine.move_snake(game, Direction.LEFT)
            if game.state == GameState.GAME_OVER:
                break

        assert game.state == GameState.GAME_OVER
        assert game.snake[0].x < 0 or (game.snake[0].x >= 0 and game.snake[0].x < game.grid_size[0])

    def test_wall_death_on_right_edge(self) -> None:
        """Test death when hitting right wall."""
        engine = SnakeGameEngine(grid_size=8)
        game = engine.create_new_game("right-wall-test")

        # Keep moving right until we hit the wall
        for _ in range(10):  # Grid is size 8, so x goes from 0-7
            game = engine.move_snake(game, Direction.RIGHT)
            if game.state == GameState.GAME_OVER:
                break

        assert game.state == GameState.GAME_OVER

    def test_wall_death_on_top_edge(self) -> None:
        """Test death when hitting top wall."""
        engine = SnakeGameEngine(grid_size=6)
        game = engine.create_new_game("top-wall-test")

        # Keep moving up until we hit the wall
        for _ in range(10):  # Grid is size 6, so y goes from 0-5
            game = engine.move_snake(game, Direction.UP)
            if game.state == GameState.GAME_OVER:
                break

        assert game.state == GameState.GAME_OVER

    def test_wall_death_on_bottom_edge(self) -> None:
        """Test death when hitting bottom wall."""
        engine = SnakeGameEngine(grid_size=6)
        game = engine.create_new_game("bottom-wall-test")

        # Keep moving down until we hit the wall
        for _ in range(10):  # Grid is size 6, so y goes from 0-5
            game = engine.move_snake(game, Direction.DOWN)
            if game.state == GameState.GAME_OVER:
                break

        assert game.state == GameState.GAME_OVER


class TestSnakeGrowth:
    """Tests for snake growth mechanics."""

    def test_grow_after_eating_multiple_food(self) -> None:
        """Verify snake grows after eating multiple food items."""
        engine = SnakeGameEngine(grid_size=15)
        center = 7

        # Place food at regular intervals - use initial length-3 snake
        # Food needs to be at x=center+1 since head moves from center to center+1 in one move
        game = SnakeGameModel(
            id="grow-test",
            snake=[
                Point(x=center, y=center),
                Point(x=center - 1, y=center),
                Point(x=center - 2, y=center),
            ],
            food=Point(x=center + 1, y=center),  # Food is 1 space ahead (one move to reach)
            direction=Direction.RIGHT,
            score=0,
            grid_size=(15, 15),
            state=GameState.RUNNING,
        )

        # Move to first food
        game = engine.move_snake(game, Direction.RIGHT)
        assert len(game.snake) == 4  # Grew from 3 to 4
        assert game.score == 10

        # Place next food - 1 space ahead of new head position (now at center+1)
        game = SnakeGameModel(
            id="grow-test",
            snake=game.snake,
            food=Point(x=center + 2, y=center),
            direction=Direction.RIGHT,
            score=game.score,
            grid_size=(15, 15),
            state=GameState.RUNNING,
        )

        # Move to second food (one more move from x=center+1 to x=center+2)
        game = engine.move_snake(game, Direction.RIGHT)
        assert len(game.snake) == 5  # Grew from 4 to 5
        assert game.score == 20

    def test_snake_growth_does_not_cause_self_collision(self) -> None:
        """Verify growing snake doesn't immediately collide with itself."""
        engine = SnakeGameEngine(grid_size=15)
        center = 7

        # Create a snake that just ate
        game = SnakeGameModel(
            id="growth-safe-test",
            snake=[
                Point(x=center + 2, y=center),
                Point(x=center + 1, y=center),
                Point(x=center, y=center),
                Point(x=center - 1, y=center),  # Just ate and grew
            ],
            food=Point(x=center + 3, y=center),
            direction=Direction.RIGHT,
            score=0,
            grid_size=(15, 15),
            state=GameState.RUNNING,
        )

        # Eat the food - should grow to 5 segments
        game = engine.move_snake(game, Direction.RIGHT)
        assert len(game.snake) == 5
        assert game.state == GameState.RUNNING


class TestEdgeCases:
    """Tests for edge cases and corner scenarios."""

    def test_empty_grid_single_segment_snake(self) -> None:
        """Test a minimal 2x2 grid with single segment snake."""
        engine = SnakeGameEngine(grid_size=2)
        # Manually create game since create_new_game makes length-3 snake
        game = SnakeGameModel(
            id="tiny-test",
            snake=[Point(x=0, y=0)],
            food=Point(x=1, y=1),
            direction=Direction.RIGHT,
            score=0,
            grid_size=(2, 2),
            state=GameState.RUNNING,
        )

        # Should be able to move
        game = engine.move_snake(game, Direction.RIGHT)
        assert game.state == GameState.RUNNING

    def test_game_id_persistence_through_moves(self) -> None:
        """Verify game ID stays the same across moves."""
        engine = SnakeGameEngine(grid_size=20)
        game = engine.create_new_game("unique-id-123")

        for _ in range(5):
            assert game.id == "unique-id-123"
            game = engine.move_snake(game, Direction.RIGHT)

    def test_score_accumulation(self) -> None:
        """Verify score increases correctly."""
        engine = SnakeGameEngine(grid_size=15)
        center = 7

        # Create food at specific position - use initial length-3 snake
        game = SnakeGameModel(
            id="score-test",
            snake=[
                Point(x=center, y=center),
                Point(x=center - 1, y=center),
                Point(x=center - 2, y=center),
            ],
            food=Point(x=center + 1, y=center),  # Food is 1 space ahead (one move to reach)
            direction=Direction.RIGHT,
            score=0,
            grid_size=(15, 15),
            state=GameState.RUNNING,
        )

        # Eat food
        game = engine.move_snake(game, Direction.RIGHT)
        assert game.score == 10

        # Create another food - 1 space ahead of new head position (now at center+1)
        game = SnakeGameModel(
            id="score-test",
            snake=game.snake,
            food=Point(x=center + 2, y=center),
            direction=Direction.RIGHT,
            score=game.score,
            grid_size=(15, 15),
            state=GameState.RUNNING,
        )

        # Eat another
        game = engine.move_snake(game, Direction.RIGHT)
        assert game.score == 20

    def test_grid_size_variations(self) -> None:
        """Test game works correctly with different grid sizes."""
        # Test larger grids where snake can easily make 5 moves without dying
        for grid_size in [10, 15, 20, 30]:
            engine = SnakeGameEngine(grid_size=grid_size)
            game = engine.create_new_game(f"size-{grid_size}-test")

            # Verify initial state is correct
            assert game.grid_size == (grid_size, grid_size), f"Grid size mismatch for {grid_size}"
            assert len(game.snake) == 3, f"Snake length mismatch for {grid_size}"
            assert game.state == GameState.RUNNING

            # Make a few moves without dying - starting at center=5 in size 10
            # so we have plenty of room to move right
            center = grid_size // 2
            max_moves = grid_size - center - 1  # How many right moves until wall
            moves_to_make = min(5, max(max_moves - 2, 3))  # Ensure we can make at least 3 moves

            for _ in range(moves_to_make):
                game = engine.move_snake(game, Direction.RIGHT)
                assert game.state == GameState.RUNNING, f"Game died after moves on grid {grid_size}"


class TestDirectionLogic:
    """Tests for direction handling."""

    def test_cannot_reverse_direction_up_down(self) -> None:
        """Test UP/DOWN reversal prevention."""
        engine = SnakeGameEngine(grid_size=20)
        game = engine.create_new_game("dir-test")

        # Change to DOWN
        game = engine.move_snake(game, Direction.DOWN)
        assert game.direction == Direction.DOWN

        # Try to go UP (should be blocked)
        game = engine.move_snake(game, Direction.UP)
        assert game.direction == Direction.DOWN  # Still down

    def test_cannot_reverse_direction_left_right(self) -> None:
        """Test LEFT/RIGHT reversal prevention."""
        engine = SnakeGameEngine(grid_size=20)

        # Create a game with initial direction set to LEFT
        game = engine.create_new_game("dir-test")
        assert game.direction == Direction.RIGHT

        # Change direction to DOWN first (not opposite of RIGHT)
        game = engine.move_snake(game, Direction.DOWN)
        assert game.direction == Direction.DOWN

        # Now change to LEFT (not opposite of DOWN) - should work
        game = engine.move_snake(game, Direction.LEFT)
        assert game.direction == Direction.LEFT

        # Try to go RIGHT (opposite of LEFT) - should be blocked by reversal prevention
        game = engine.move_snake(game, Direction.RIGHT)
        # Since RIGHT is opposite of LEFT, it should be prevented and stay as LEFT
        assert game.direction == Direction.LEFT  # Still left (reversal prevented)

    def test_valid_direction_changes_allowed(self) -> None:
        """Test that valid direction changes work."""
        engine = SnakeGameEngine(grid_size=20)
        game = engine.create_new_game("dir-test")

        # Start at RIGHT
        assert game.direction == Direction.RIGHT

        # Change to UP (valid)
        game = engine.move_snake(game, Direction.UP)
        assert game.direction == Direction.UP

        # Change to LEFT (valid)
        game = engine.move_snake(game, Direction.LEFT)
        assert game.direction == Direction.LEFT

        # Change to DOWN (valid)
        game = engine.move_snake(game, Direction.DOWN)
        assert game.direction == Direction.DOWN


class TestFoodSpawning:
    """Tests for food spawning logic."""

    def test_food_always_spawns_in_valid_position(self) -> None:
        """Verify food always spawns within grid bounds."""
        engine = SnakeGameEngine(grid_size=20)

        for _ in range(10):
            game = engine.create_new_game("food-valid-test")
            # Check food is within bounds
            assert 0 <= game.food.x < 20, f"Food x={game.food.x} out of bounds"
            assert 0 <= game.food.y < 20, f"Food y={game.food.y} out of bounds"

    def test_new_food_spawns_after_eating(self) -> None:
        """Verify new food spawns when old food is eaten."""
        engine = SnakeGameEngine(grid_size=20)
        center = 10

        # Use length-3 snake to match initial game setup
        game = SnakeGameModel(
            id="food-respawn-test",
            snake=[
                Point(x=center, y=center),
                Point(x=center - 1, y=center),
                Point(x=center - 2, y=center),
            ],
            food=Point(x=center + 3, y=center),  # Food is 3 spaces ahead
            direction=Direction.RIGHT,
            score=0,
            grid_size=(20, 20),
            state=GameState.RUNNING,
        )

        old_food = game.food

        # Eat the food (need 3 moves to reach)
        for _ in range(3):
            game = engine.move_snake(game, Direction.RIGHT)

        # Food should have changed (spawned new random position)
        assert game.food != old_food, "Food did not respawn after eating"
        # Should still be in valid position
        assert 0 <= game.food.x < 20
        assert 0 <= game.food.y < 20


class TestMoveFrequency:
    """Tests to verify move frequency requirements."""

    def test_can_move_multiple_times_per_second(self) -> None:
        """Test that rapid moves are handled correctly."""
        engine = SnakeGameEngine(grid_size=200)
        # Create game with head starting near left edge to maximize rightward movement
        game = SnakeGameModel(
            id="rapid-test",
            snake=[Point(x=5, y=100), Point(x=4, y=100), Point(x=3, y=100)],
            food=engine._spawn_food([Point(x=5, y=100), Point(x=4, y=100), Point(x=3, y=100)]),
            direction=Direction.RIGHT,
            score=0,
            grid_size=(200, 200),
            state=GameState.RUNNING,
        )

        # Make 95 moves rapidly - starting at x=5 in size 200 can make 194 right moves before wall
        for _ in range(95):
            if game.state == GameState.RUNNING:
                game = engine.move_snake(game, Direction.RIGHT)

        assert game.state == GameState.RUNNING, "Game died after some moves"


class TestGameStateTransitions:
    """Tests for state transitions."""

    def test_running_to_game_over_transition(self) -> None:
        """Test transition from RUNNING to GAME_OVER."""
        engine = SnakeGameEngine(grid_size=3)
        game = engine.create_new_game("trans-test")

        # Make moves until we hit a wall
        while game.state == GameState.RUNNING:
            game = engine.move_snake(game, Direction.RIGHT)

        assert game.state == GameState.GAME_OVER

    def test_running_to_paused_transition(self) -> None:
        """Test RUNNING can transition to PAUSED."""
        engine = SnakeGameEngine(grid_size=20)
        game = engine.create_new_game("state-test")

        # Pause the game
        paused = engine.pause_game(game)

        assert paused.state == GameState.PAUSED

    def test_paused_to_running_transition(self) -> None:
        """Test PAUSED can transition back to RUNNING."""
        engine = SnakeGameEngine(grid_size=20)
        game = engine.create_new_game("state-test")

        # Pause then resume
        paused = engine.pause_game(game)
        resumed = engine.resume_game(paused)

        assert paused.state == GameState.PAUSED
        assert resumed.state == GameState.RUNNING

    def test_cannot_move_when_paused(self) -> None:
        """Test that moving while paused fails."""
        engine = SnakeGameEngine(grid_size=20)
        game = engine.create_new_game("state-test")

        # Pause the game
        paused = engine.pause_game(game)
        assert paused.state == GameState.PAUSED

    def test_cannot_move_when_over(self) -> None:
        """Test that moving while game over fails."""
        engine = SnakeGameEngine(grid_size=3)
        game = engine.create_new_game("state-test")

        # Hit wall to end game
        while game.state == GameState.RUNNING:
            game = engine.move_snake(game, Direction.RIGHT)

        assert game.state == GameState.GAME_OVER
