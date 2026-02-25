import type { Direction, Point, SnakeGameModel, Difficulty } from '../types'

const GRID_SIZE_DEFAULT = 20

/**
 * Convert direction to (dx, dy) offset.
 */
function directionToOffset(direction: Direction): [number, number] {
  const offsets: Record<Direction, [number, number]> = {
    UP: [0, -1],
    DOWN: [0, 1],
    LEFT: [-1, 0],
    RIGHT: [1, 0],
  }
  return offsets[direction]
}

/**
 * Check if two directions are opposite.
 */
function isOppositeDirection(current: Direction, newDirection: Direction): boolean {
  const opposites: Record<Direction, Direction> = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT',
  }
  return opposites[current] === newDirection
}

/**
 * Check if a point collides with the snake body (excluding tail).
 */
function checkSelfCollision(head: Point, snake: Point[]): boolean {
  // Check against all segments except tail which will move
  const headIndex = snake.length - 1
  for (let i = 0; i < headIndex; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      return true
    }
  }
  return false
}

/**
 * Check if a point collides with walls.
 */
function checkWallCollision(head: Point, gridSize: number): boolean {
  return head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize
}

/**
 * Generate a new food position not on the snake body.
 */
function spawnFood(snake: Point[], gridSize = GRID_SIZE_DEFAULT): Point {
  const snakeSet = new Set(snake.map(p => `${p.x},${p.y}`))
  let attempts = 0

  while (attempts < 1000) {
    const x = Math.floor(Math.random() * gridSize)
    const y = Math.floor(Math.random() * gridSize)

    if (!snakeSet.has(`${x},${y}`)) {
      return { x, y }
    }
    attempts++
  }

  // Fallback: find first empty position
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (!snakeSet.has(`${x},${y}`)) {
        return { x, y }
      }
    }
  }

  // If no empty position found, return center
  return { x: gridSize / 2, y: gridSize / 2 }
}

/**
 * Calculate current game speed based on difficulty settings and score.
 */
function calculateSpeed(difficultySettings: { baseSpeed: number; reductionPerApple: number; minSpeed: number }, score: number): number {
  const speed = Math.max(difficultySettings.minSpeed, difficultySettings.baseSpeed - score * difficultySettings.reductionPerApple)
  return speed
}

/**
 * Create a new game state.
 */
function createNewGame(gameId: string, gridSize = GRID_SIZE_DEFAULT, difficulty: Difficulty = 'medium'): SnakeGameModel {
  const center = Math.floor(gridSize / 2)

  // Initial snake pointing right, length of 3
  // Head is at leading edge (highest x), body follows behind
  const snake: Point[] = [
    { x: center, y: center },      // Index 0 (HEAD)
    { x: center - 1, y: center },  // Index 1
    { x: center - 2, y: center },  // Index 2 (TAIL)
  ]

  const food = spawnFood(snake, gridSize)

  return {
    id: gameId,
    snake,
    food,
    direction: 'RIGHT',
    score: 0,
    grid_size: [gridSize, gridSize],
    state: 'running',
    difficulty,
  }
}

/**
 * Move the snake in the specified direction.
 */
function moveSnake(game: SnakeGameModel, newDirection: Direction): SnakeGameModel {
  // Prevent reversing direction
  if (isOppositeDirection(game.direction, newDirection)) {
    newDirection = game.direction
  }

  const head = game.snake[0]
  const [dx, dy] = directionToOffset(newDirection)
  const newHead = { x: head.x + dx, y: head.y + dy }
  const gridSize = game.grid_size[0]

  // Check for collisions (wall or self)
  if (checkWallCollision(newHead, gridSize) || checkSelfCollision(newHead, game.snake)) {
    return {
      ...game,
      direction: newDirection,
      state: 'game_over',
    }
  }

  // Calculate new snake position
  let newSnake: Point[]
  const ateFood = newHead.x === game.food.x && newHead.y === game.food.y

  if (ateFood) {
    // Grow snake (don't remove tail)
    newSnake = [newHead, ...game.snake]
  } else {
    // Move normally (remove tail)
    newSnake = [newHead, ...game.snake.slice(0, -1)]
  }

  const newScore = ateFood ? game.score + 10 : game.score
  const newFood = ateFood ? spawnFood(newSnake, gridSize) : game.food

  return {
    id: game.id,
    snake: newSnake,
    food: newFood,
    direction: newDirection,
    score: newScore,
    grid_size: game.grid_size,
    state: 'running',
    difficulty: game.difficulty,
  }
}

/**
 * Reset the game to initial state while keeping same ID.
 */
function resetGame(game: SnakeGameModel, gridSize = GRID_SIZE_DEFAULT, difficulty: Difficulty = 'medium'): SnakeGameModel {
  return createNewGame(game.id, gridSize, difficulty)
}

/**
 * Pause the current game.
 */
function pauseGame(game: SnakeGameModel): SnakeGameModel {
  return {
    ...game,
    state: 'paused',
  }
}

/**
 * Resume a paused game.
 */
function resumeGame(game: SnakeGameModel): SnakeGameModel {
  return {
    ...game,
    state: 'running',
  }
}

export {
  GRID_SIZE_DEFAULT,
  directionToOffset,
  isOppositeDirection,
  checkSelfCollision,
  checkWallCollision,
  spawnFood,
  calculateSpeed,
  createNewGame,
  moveSnake,
  resetGame,
  pauseGame,
  resumeGame,
}
