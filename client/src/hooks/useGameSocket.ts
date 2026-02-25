import { useEffect, useState, useRef, useCallback } from 'react'
import type { Direction, SnakeGameModel } from '../types'
import {
  createNewGame,
  moveSnake as engineMoveSnake,
} from '../game/GameEngine'
import { saveBestScore } from '../services/localStorage'

interface WebSocketMessage {
  type: string
  game?: SnakeGameModel
  score?: number
  final_snake_length?: number
  apple_position?: { x: number; y: number }
}

// Use a fixed game ID for local play (can be changed to UUID per session)
const LOCAL_GAME_ID = 'local-game-1'

// Difficulty settings
const BASE_SPEED_MS = 200
const SPEED_REDUCTION_PER_APPLE = 8 // Challenging: 8ms reduction per apple
const MIN_SPEED_MS = 60

/**
 * Calculate the current game speed based on score.
 * Each apple eaten reduces the delay, making the snake faster.
 */
function getDifficultySpeed(score: number): number {
  const speed = Math.max(MIN_SPEED_MS, BASE_SPEED_MS - score * SPEED_REDUCTION_PER_APPLE)
  return speed
}

interface UseGameSocketReturn {
  gameState: SnakeGameModel | null
  isConnected: boolean
  hasStarted: boolean
  startGame: () => void
  resetGame: () => void
  sendMove: (direction: Direction) => void
  reportGameOver: (score: number, snakeLength: number) => Promise<void>
}

export function useGameSocket(): UseGameSocketReturn {
  const [gameState, setGameState] = useState<SnakeGameModel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const moveIntervalRef = useRef<number | null>(null)
  const directionRef = useRef<Direction>('RIGHT')
  // Track last processed direction for local collision detection
  const lastProcessedDirectionRef = useRef<Direction | null>(null)
  // Ref to track current game state for sendMove to avoid stale closures
  const gameStateStateRef = useRef<'paused' | 'running' | 'game_over'>('paused')

  // Initialize game state locally when component mounts
  useEffect(() => {
    setGameState(createNewGame(LOCAL_GAME_ID))
    directionRef.current = 'RIGHT'
    lastProcessedDirectionRef.current = 'RIGHT'
  }, [])

  useEffect(() => {
    let ws: WebSocket | null = null

    const connect = () => {
      // Connect to WebSocket for apple sync and score reporting only
      ws = new WebSocket('ws://localhost:8000/ws/game')
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
      }

      ws.onmessage = event => {
        const data: WebSocketMessage = JSON.parse(event.data)

        if (data.type === 'apple_position' && gameState) {
          // Server sent valid apple position - sync food location
          setGameState(prev => {
            if (!prev) return null
            return { ...prev, food: { x: data.apple_position!.x, y: data.apple_position!.y } }
          })
        } else if (data.type === 'score_saved' && data.score !== undefined) {
          // Score was saved by server - no local action needed
          console.debug(`Score ${data.score} saved successfully`)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        wsRef.current = null
      }

      ws.onerror = error => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      if (ws) {
        ws.close()
      }
      if (moveIntervalRef.current) {
        window.clearInterval(moveIntervalRef.current)
      }
    }
  }, []) // Connect once on mount

  // Update refs when gameState changes
  useEffect(() => {
    if (gameState?.direction) {
      directionRef.current = gameState.direction
    }
    if (gameState) {
      gameStateStateRef.current = gameState.state
    }
  }, [gameState])

  // Send request for new apple position when snake eats food
  const requestAppleSync = useCallback((snake: { x: number; y: number }[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'request_apple',
          snake_points: snake,
        })
      )
    }
  }, [])

  // Report score to server on game over
  const reportGameOver = useCallback(async (score: number, snakeLength: number): Promise<void> => {
    saveBestScore(LOCAL_GAME_ID, score)

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'report_score',
          game_id: LOCAL_GAME_ID,
          score,
          final_snake_length: snakeLength,
        })
      )
    }
  }, [])

  // Process a move using local game engine
  const processMove = useCallback((direction: Direction) => {
    setGameState(prevGameState => {
      if (!prevGameState) return null

      const updatedGame = engineMoveSnake(prevGameState, direction)

      // If apple was eaten, request sync from server
      const head = updatedGame.snake[0]
      if (head.x === prevGameState.food.x && head.y === prevGameState.food.y) {
        requestAppleSync(updatedGame.snake)
      }

      // Report game over with score to server
      if (updatedGame.state === 'game_over') {
        reportGameOver(updatedGame.score, updatedGame.snake.length)
      }

      return updatedGame
    })
    lastProcessedDirectionRef.current = direction
  }, [requestAppleSync, reportGameOver])

  // Auto-move the snake while game is running and has started
  useEffect(() => {
    if (!gameState || gameState.state !== 'running' || !hasStarted) {
      return
    }

    // Clear any existing interval first
    if (moveIntervalRef.current) {
      window.clearInterval(moveIntervalRef.current)
    }

    // Calculate dynamic speed based on current score
    const currentSpeed = gameState ? getDifficultySpeed(gameState.score) : BASE_SPEED_MS

    // Start auto-move interval with difficulty-based speed
    moveIntervalRef.current = window.setInterval(() => {
      const currentDirection = directionRef.current
      if (currentDirection) {
        processMove(currentDirection)
      }
    }, currentSpeed)

    return () => {
      if (moveIntervalRef.current) {
        window.clearInterval(moveIntervalRef.current)
      }
    }
  }, [hasStarted, gameState?.state, processMove])

  const startGame = useCallback(() => {
    setHasStarted(true)
  }, [])

  const resetGameLocal = useCallback(() => {
    // Reset game state locally
    const newGame = createNewGame(LOCAL_GAME_ID)
    setGameState(newGame)
    directionRef.current = 'RIGHT'
    lastProcessedDirectionRef.current = 'RIGHT'

    // Clear any stored best score for fresh start
    saveBestScore(LOCAL_GAME_ID, 0)

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'reset_request' }))
    }
  }, [])

  const sendMove = useCallback((direction: Direction) => {
    // Use ref to check game state to avoid stale closures
    if (gameStateStateRef.current !== 'running') return
    processMove(direction)
  }, [processMove])

  return {
    gameState,
    isConnected,
    hasStarted,
    startGame,
    resetGame: resetGameLocal,
    sendMove,
    reportGameOver,
  }
}
