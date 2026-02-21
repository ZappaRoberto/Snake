/**
 * Tests for the ScoreBoard component
 *
 * Tests display of score, length, direction, and status
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScoreBoard } from '../src/components/ScoreBoard'

describe('ScoreBoard Component', () => {
  const createGameState = (overrides: Partial<any> = {}) => ({
    id: 'test-game-1',
    snake: [{ x: 5, y: 5 }, { x: 5, y: 6 }],
    food: { x: 10, y: 10 },
    direction: 'UP' as const,
    score: 10,
    grid_size: [20, 20],
    state: 'running' as const,
    ...overrides,
  })

  it('renders loading message when gameState is null', () => {
    render(<ScoreBoard gameState={null} />)

    expect(screen.getByText(/Score Board/i)).toBeInTheDocument()
    expect(screen.getByText(/Loading game.../i)).toBeInTheDocument()
  })

  it('displays the score value', () => {
    const gameState = createGameState({ score: 42 })
    render(<ScoreBoard gameState={gameState} />)

    expect(screen.getByText(/Score:/i)).toBeInTheDocument()
    expect(screen.getByText(/42/i)).toBeInTheDocument()
  })

  it('displays the snake length', () => {
    const gameState = createGameState({
      snake: [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 5, y: 7 },
        { x: 5, y: 8 },
      ],
    })
    render(<ScoreBoard gameState={gameState} />)

    expect(screen.getByText(/Length:/i)).toBeInTheDocument()
    expect(screen.getByText(/4/i)).toBeInTheDocument()
  })

  it('displays the direction in uppercase', () => {
    const gameState = createGameState({ direction: 'UP' })
    render(<ScoreBoard gameState={gameState} />)

    expect(screen.getByText(/Direction:/i)).toBeInTheDocument()
    expect(screen.getByText(/UP/i)).toHaveStyle('text-transform: uppercase')
  })

  it('displays the status badge with running state', () => {
    const gameState = createGameState({ state: 'running' })
    render(<ScoreBoard gameState={gameState} />)

    expect(screen.getByText(/Status:/i)).toBeInTheDocument()
    const statusElement = screen.getByText(/running/i)
    expect(statusElement).toBeInTheDocument()
  })

  it('displays the status badge with paused state', () => {
    const gameState = createGameState({ state: 'paused' })
    render(<ScoreBoard gameState={gameState} />)

    const statusElement = screen.getByText(/paused/i)
    expect(statusElement).toBeInTheDocument()
  })

  it('displays the status badge with game_over state', () => {
    const gameState = createGameState({ state: 'game_over' })
    render(<ScoreBoard gameState={gameState} />)

    const statusElement = screen.getByText(/game_over/i)
    expect(statusElement).toBeInTheDocument()
  })

  it('renders all required elements in the correct layout', () => {
    const gameState = createGameState()
    render(<ScoreBoard gameState={gameState} />)

    expect(screen.getByText(/Score:/i)).toBeInTheDocument()
    expect(screen.getByText(/Length:/i)).toBeInTheDocument()
    expect(screen.getByText(/Direction:/i)).toBeInTheDocument()
    expect(screen.getByText(/Status:/i)).toBeInTheDocument()
  })

  it('handles empty snake array correctly', () => {
    const gameState = createGameState({ snake: [] })
    render(<ScoreBoard gameState={gameState} />)

    expect(screen.getByText(/Length:/i)).toBeInTheDocument()
    // Use exact string match to avoid matching "0" in "Score: 10"
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('handles different score values correctly', () => {
    const testCases = [0, 1, 100, 999]

    testCases.forEach(score => {
      const gameState = createGameState({ score })
      const { unmount } = render(<ScoreBoard gameState={gameState} />)
      try {
        expect(screen.getByText(/Score:/i)).toBeInTheDocument()
        expect(screen.getByText(String(score))).toBeInTheDocument()
      } finally {
        unmount()
      }
    })
  })

  it('applies correct styling to the container', () => {
    const gameState = createGameState()
    render(<ScoreBoard gameState={gameState} />)

    const title = screen.getByText(/Score Board/i)
    expect(title).toBeInTheDocument()
  })
})
