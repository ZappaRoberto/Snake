export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

export interface Point {
  x: number
  y: number
}

export type Difficulty = 'easy' | 'medium' | 'hard'

/**
 * Speed settings for each difficulty preset.
 * baseSpeed: Initial delay in ms between moves
 * reductionPerApple: How many ms to reduce per apple eaten
 * minSpeed: Minimum (fastest) delay cap in ms
 */
export interface DifficultySettings {
  baseSpeed: number
  reductionPerApple: number
  minSpeed: number
}

export const DIFFICULTY_SETTINGS = {
  easy: { baseSpeed: 250, reductionPerApple: 5, minSpeed: 80 },
  medium: { baseSpeed: 200, reductionPerApple: 8, minSpeed: 60 },
  hard: { baseSpeed: 150, reductionPerApple: 12, minSpeed: 40 },
} as const

export interface SnakeGameModel {
  id: string
  snake: Point[]
  food: Point
  direction: Direction
  score: number
  grid_size: [number, number]
  state: 'running' | 'paused' | 'game_over'
  difficulty: Difficulty
}
