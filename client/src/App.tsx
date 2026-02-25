import { useRef, useCallback } from 'react'
import { Game3D } from './components/Game3D'
import { ScoreBoard } from './components/ScoreBoard'
import { Controls } from './components/Controls'
import { useGameSocket } from './hooks/useGameSocket'
import type { Direction, Difficulty } from './types'

function App() {
  const { gameState, hasStarted, difficulty, setDifficulty, startGame, sendMove, resetGame } = useGameSocket()
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

  const handleDifficultyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDifficulty(e.target.value as Difficulty)
  }, [setDifficulty])

  // Don't show controls or game until started
  if (!hasStarted || !gameState) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Pixel Art Snake Game</h1>
          <div style={styles.startScreen}>
            <p style={styles.startText}>Select your difficulty and click start to play!</p>

            {/* Difficulty Selector */}
            <div style={styles.difficultySelector}>
              <label style={styles.difficultyLabel}>Difficulty:</label>
              <div style={styles.difficultyOptions}>
                <label style={styles.difficultyOption}>
                  <input
                    type="radio"
                    name="difficulty"
                    value="easy"
                    checked={difficulty?.value === 'easy'}
                    onChange={handleDifficultyChange}
                    style={styles.difficultyInput}
                  />
                  <span style={styles.difficultyText}>Easy</span>
                </label>
                <label style={styles.difficultyOption}>
                  <input
                    type="radio"
                    name="difficulty"
                    value="medium"
                    checked={difficulty?.value === 'medium'}
                    onChange={handleDifficultyChange}
                    style={styles.difficultyInput}
                  />
                  <span style={styles.difficultyText}>Medium</span>
                </label>
                <label style={styles.difficultyOption}>
                  <input
                    type="radio"
                    name="difficulty"
                    value="hard"
                    checked={difficulty?.value === 'hard'}
                    onChange={handleDifficultyChange}
                    style={styles.difficultyInput}
                  />
                  <span style={styles.difficultyText}>Hard</span>
                </label>
              </div>
            </div>

            {/* Difficulty Description */}
            <div style={styles.difficultyDescription}>
              {difficulty && (
                <p style={styles.descriptionText}>
                  <strong>{difficulty.value.charAt(0).toUpperCase() + difficulty.value.slice(1)}</strong>:
                  Start speed {difficulty.settings.baseSpeed}ms,
                  speeds up by {difficulty.settings.reductionPerApple}ms per apple,
                  minimum {difficulty.settings.minSpeed}ms.
                </p>
              )}
            </div>

            <button onClick={() => startGame(difficulty?.value || 'medium')} style={styles.startButton}>
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
        <h1 style={styles.title}>Pixel Art Snake Game</h1>
        {gameState.state === 'running' && (
          <Controls onMove={handleMove} />
        )}
        {gameState.state !== 'running' && (
          <div style={styles.gameOverMessage}>
            <p>Game {gameState.state}</p>
            <p>Final Score: {gameState.score}</p>
            <button onClick={() => resetGame()} style={styles.resetButton}>
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
    display: 'flex' as const,
    flexDirection: 'column' as const,
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
    maxWidth: '500px' as const,
    margin: '0 auto' as const,
  },
  startText: {
    margin: 0 as const,
    fontSize: '18px' as const,
  },
  difficultySelector: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 8 as const,
    alignItems: 'center' as const,
    padding: '16px' as const,
    backgroundColor: '#fff' as const,
    borderRadius: '4px' as const,
    width: '100%' as const,
  },
  difficultyLabel: {
    fontWeight: 'bold' as const,
    fontSize: '14px' as const,
    color: '#2d3748' as const,
  },
  difficultyOptions: {
    display: 'flex' as const,
    gap: 24 as const,
    justifyContent: 'center' as const,
    width: '100%' as const,
  },
  difficultyOption: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8 as const,
    cursor: 'pointer' as const,
    fontSize: '16px' as const,
    padding: '4px 8px' as const,
    borderRadius: '4px' as const,
    transition: 'background-color 0.2s' as const,
  },
  difficultyInput: {
    width: '16px' as const,
    height: '16px' as const,
    cursor: 'pointer' as const,
  },
  difficultyText: {
    fontSize: '16px' as const,
  },
  difficultyDescription: {
    padding: '8px' as const,
    backgroundColor: '#fff' as const,
    borderRadius: '4px' as const,
    maxWidth: '100%' as const,
  },
  descriptionText: {
    margin: 0 as const,
    fontSize: '12px' as const,
    color: '#2d3748' as const,
    lineHeight: '1.5' as const,
  },
  startButton: {
    padding: '12px 32px' as const,
    fontSize: '18px' as const,
    backgroundColor: '#fff' as const,
    border: 'none' as const,
    borderRadius: '4px' as const,
    cursor: 'pointer' as const,
    fontWeight: 'bold' as const,
    transition: 'transform 0.2s, box-shadow 0.2s' as const,
  },
  main: {
    display: 'flex' as const,
    justifyContent: 'center' as const,
    alignItems: 'flex-start' as const,
    gap: 24 as const,
    padding: '16px' as const,
    flex: 1 as const,
  },
  gameSection: {
    flex: 1 as const,
    minHeight: '50vh' as const,
    width: '100%' as const,
    maxHeight: 'calc(100vh - 200px)' as const,
  },
  sidebar: {
    width: '250px' as const,
    flexShrink: 0 as const,
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
