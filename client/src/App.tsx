import { useRef, useCallback } from 'react'
import { Game3D } from './components/Game3D'
import { ScoreBoard } from './components/ScoreBoard'
import { Controls } from './components/Controls'
import { useGameSocket } from './hooks/useGameSocket'
import type { Direction } from './types'

function App() {
  const { gameState, hasStarted, startGame, sendMove, resetGame } = useGameSocket()
  const lastProcessedDirection = useRef<Direction | null>(null)

  // Track last processed direction to prevent immediate reversal
  // This is handled by GameEngine but we keep a local ref for UI feedback
  if (gameState?.direction && gameState.state === 'running') {
    lastProcessedDirection.current = gameState.direction
  }

  const handleMove = useCallback((newDirection: Direction) => {
    // GameEngine handles direction reversal prevention internally
    // Just send the move to the game engine via sendMove
    sendMove(newDirection)
  }, [sendMove])

  // Don't show controls or game until started
  if (!hasStarted || !gameState) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>3D Snake Game</h1>
          <div style={styles.startScreen}>
            <p style={styles.startText}>Click the button below to start playing!</p>
            <button onClick={startGame} style={styles.startButton}>
              Start Game
            </button>
          </div>
        </header>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>3D Snake Game</h1>
        {gameState.state === 'running' && (
          <Controls onMove={handleMove} />
        )}
        {gameState.state !== 'running' && (
          <div style={styles.gameOverMessage}>
            <p>Game {gameState.state}</p>
            <p>Final Score: {gameState.score}</p>
            <button onClick={resetGame} style={styles.resetButton}>
              Restart Game
            </button>
          </div>
        )}
      </header>

      <main style={styles.main}>
        <div style={styles.gameSection}>
          <Game3D gameState={gameState} />
        </div>

        <div style={styles.sidebar}>
          <ScoreBoard gameState={gameState} />
        </div>
      </main>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh' as const,
    backgroundColor: '#1a202c' as const,
    color: '#fff' as const,
    fontFamily: 'Arial, sans-serif' as const,
  },
  header: {
    padding: '24px' as const,
    textAlign: 'center' as const,
    backgroundColor: '#2d3748' as const,
  },
  title: {
    margin: '0 0 16px 0' as const,
    fontSize: '32px' as const,
  },
  startScreen: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: 16 as const,
    padding: '24px' as const,
    backgroundColor: '#4fd1c5' as const,
    borderRadius: '8px' as const,
    maxWidth: '400px' as const,
    margin: '0 auto' as const,
  },
  startText: {
    margin: 0 as const,
    fontSize: '18px' as const,
  },
  startButton: {
    padding: '12px 32px' as const,
    fontSize: '18px' as const,
    backgroundColor: '#fff' as const,
    border: 'none' as const,
    borderRadius: '4px' as const,
    cursor: 'pointer' as const,
    fontWeight: 'bold' as const,
  },
  main: {
    display: 'flex' as const,
    justifyContent: 'center' as const,
    alignItems: 'flex-start' as const,
    gap: 24 as const,
    padding: '24px' as const,
  },
  gameSection: {
    flex: 1 as const,
    maxWidth: '800px' as const,
  },
  sidebar: {
    width: '250px' as const,
  },
  gameOverMessage: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: 16 as const,
    padding: '16px' as const,
    backgroundColor: '#f56565' as const,
    borderRadius: '8px' as const,
    maxWidth: '400px' as const,
    margin: '0 auto' as const,
  },
  resetButton: {
    padding: '8px 24px' as const,
    fontSize: '16px' as const,
    backgroundColor: '#fff' as const,
    border: 'none' as const,
    borderRadius: '4px' as const,
    cursor: 'pointer' as const,
  },
} satisfies Record<string, React.CSSProperties>

export default App
