export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

export interface Point {
  x: number
  y: number
}

export interface SnakeGameModel {
  id: string
  snake: Point[]
  food: Point
  direction: Direction
  score: number
  grid_size: [number, number]
  state: 'running' | 'paused' | 'game_over'
}
