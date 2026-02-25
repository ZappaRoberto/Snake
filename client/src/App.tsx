import { useRef, useCallback } from 'react'
import { Game3D } from './components/Game3D'
import { ScoreBoard } from './components/ScoreBoard'
import { Controls } from './components/Controls'
import { useGameSocket } from './hooks/useGameSocket'
import type { Direction, Difficulty } from './types'

function App() {
  const { gameState, hasStarted, difficulty, setDifficulty, startGame, sendMove, resetGame, togglePause } = useGameSocket()
  const lastProcessedDirection = useRef<Direction | null>(null)

  // Track last processed direction to prevent immediate reversal
  if (gameState?.direction && gameState.state === 'running') {
    lastProcessedDirection.current = gameState.direction
  }

  const handleMove = useCallback((newDirection: Direction) => {
    sendMove(newDirection)
  }, [sendMove])

  const handleDifficultyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDifficulty(e.target.value as Difficulty)
  }, [setDifficulty])

  // Don't show controls or game until started
  if (!hasStarted || !gameState) {
    return (
      <div style={styles.container}>
        {/* Animated gradient background */}
        <div style={styles.backgroundGradient} />

        <header style={styles.header}>
          <h1 style={styles.title}>Pixel Art Snake</h1>

          <div style={styles.startCard}>
            <p style={styles.startText}>Select your difficulty and start the game!</p>

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

            {/* Decorative elements */}
            <div style={styles.decorativeLine} />
            <p style={styles.subtext}>Use arrow keys or WASD to move</p>
          </div>
        </header>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Animated gradient background */}
      <div style={styles.backgroundGradient} />

      <header style={styles.header}>
        <h1 style={styles.title}>Pixel Art Snake</h1>

        {gameState.state === 'running' && (
          <Controls onMove={handleMove} onTogglePause={togglePause} />
        )}

        {gameState.state !== 'running' && (
          <div style={{
            ...styles.gameOverMessage,
            background: gameState.state === 'paused'
              ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          }}>
            <h2 style={{ ...styles.gameOverTitle, color: '#fff' }}>
              {gameState.state === 'paused' ? 'Paused' : 'Game Over'}
            </h2>
            <p style={styles.finalScore}>Final Score: {gameState.score}</p>
            <button onClick={() => resetGame()} style={{ ...styles.resetButton, background: '#fff', color: '#0f172a' }}>
              {gameState.state === 'paused' ? 'Resume Game' : 'Restart Game'}
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
 minHeight: '100vh',
 display: 'flex' as const,
 flexDirection: 'column' as const,
 overflow: 'hidden',
 position: 'relative' as const,
 },

 // Animated gradient background
 backgroundGradient: {
   position: 'absolute' as const,
   top: 0,
   left: 0,
   right: 0,
   bottom: 0,
   zIndex: -1,
   opacity: 0.3,
   animation: 'gradientShift 15s ease infinite',
   background: 'linear-gradient(-45deg, #0f172a, #1e293b, #312e81, #ec4899)',
   backgroundSize: '400% 400%',
 },

 header: {
   padding: '32px 24px',
   textAlign: 'center' as const,
   position: 'relative' as const,
   zIndex: 10,
 },

 title: {
   margin: '0 0 24px 0',
   fontSize: '48px' as const,
   fontWeight: 'bold' as const,
   background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #94a3b8 100%)',
   WebkitBackgroundClip: 'text' as const,
   backgroundClip: 'text' as const,
   color: 'transparent' as const,
   textShadow: '0 2px 10px rgba(0,0,0,0.3)',
 },

 startCard: {
   display: 'flex' as const,
   flexDirection: 'column' as const,
   alignItems: 'center' as const,
   gap: 20 as const,
   padding: '32px' as const,
   background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
   backdropFilter: 'blur(10px)' as const,
   borderRadius: '20px' as const,
   maxWidth: '600px' as const,
   margin: '0 auto' as const,
   border: '1px solid rgba(255,255,255,0.1)',
   boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' as const,
 },

 startText: {
   margin: 0 as const,
   fontSize: '18px' as const,
   color: '#cbd5e1' as const,
   lineHeight: '1.6',
 },

 difficultySelector: {
   display: 'flex' as const,
   flexDirection: 'column' as const,
   gap: 12 as const,
   alignItems: 'center' as const,
   padding: '20px' as const,
   background: 'rgba(0,0,0,0.2)' as const,
   borderRadius: '12px' as const,
   width: '100%' as const,
 },

 difficultyLabel: {
   fontWeight: 'bold' as const,
   fontSize: '14px' as const,
   color: '#94a3b8' as const,
   textTransform: 'uppercase' as const,
   letterSpacing: '1px' as const,
 },

 difficultyOptions: {
   display: 'flex' as const,
   gap: 20 as const,
   justifyContent: 'center' as const,
   width: '100%' as const,
 },

 difficultyOption: {
   display: 'flex' as const,
   alignItems: 'center' as const,
   gap: 8 as const,
   cursor: 'pointer' as const,
   fontSize: '16px' as const,
   padding: '12px 20px' as const,
   background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)' as const,
   borderRadius: '8px' as const,
   transition: 'transform 0.2s, background 0.2s, box-shadow 0.2s' as const,
   border: '1px solid rgba(255,255,255,0.1)' as const,
 },

 difficultyInput: {
   width: '18px' as const,
   height: '18px' as const,
   cursor: 'pointer' as const,
 },

 difficultyText: {
   fontSize: '16px' as const,
   fontWeight: '500' as const,
 },

 difficultyDescription: {
   padding: '12px' as const,
   background: 'rgba(0,0,0,0.3)' as const,
   borderRadius: '8px' as const,
   maxWidth: '100%' as const,
   fontSize: '14px' as const,
 },

 descriptionText: {
   margin: 0 as const,
   fontSize: '12px' as const,
   color: '#94a3b8' as const,
   lineHeight: '1.6' as const,
 },

 startButton: {
   padding: '16px 48px' as const,
   fontSize: '20px' as const,
   background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' as const,
   border: 'none' as const,
   borderRadius: '12px' as const,
   cursor: 'pointer' as const,
   fontWeight: 'bold' as const,
   color: '#fff' as const,
   transition: 'transform 0.2s, box-shadow 0.2s' as const,
   boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' as const,
 },

 decorativeLine: {
   width: '60px' as const,
   height: '3px' as const,
   background: 'linear-gradient(90deg, #6366f1, #ec4899)' as const,
   borderRadius: '2px' as const,
 },

 subtext: {
   margin: 0 as const,
   fontSize: '14px' as const,
   color: '#64748b' as const,
 },

 main: {
   display: 'flex' as const,
   justifyContent: 'center' as const,
   alignItems: 'flex-start' as const,
   gap: 32 as const,
   padding: '16px' as const,
   flex: 1 as const,
   position: 'relative' as const,
   zIndex: 10,
 },

 gameSection: {
   flex: 1 as const,
   minHeight: '50vh' as const,
   width: '100%' as const,
   maxHeight: 'calc(100vh - 250px)' as const,
   borderRadius: '16px' as const,
   overflow: 'hidden' as const,
   boxShadow: '0 8px 40px rgba(0, 0, 0, 0.3)' as const,
 },

 sidebar: {
   width: '280px' as const,
   flexShrink: 0 as const,
 },

 gameOverMessage: {
   display: 'flex' as const,
   flexDirection: 'column' as const,
   alignItems: 'center' as const,
   gap: 20 as const,
   padding: '32px' as const,
   borderRadius: '16px' as const,
   maxWidth: '450px' as const,
   margin: '0 auto' as const,
   boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' as const,
 },

 gameOverTitle: {
   margin: 0 as const,
   fontSize: '36px' as const,
   fontWeight: 'bold' as const,
 },

 finalScore: {
   margin: 0 as const,
   fontSize: '24px' as const,
   color: '#fff' as const,
 },

 resetButton: {
   padding: '12px 32px' as const,
   fontSize: '18px' as const,
   border: 'none' as const,
   borderRadius: '8px' as const,
   cursor: 'pointer' as const,
   fontWeight: 'bold' as const,
   transition: 'transform 0.2s, box-shadow 0.2s' as const,
 },

} satisfies Record<string, React.CSSProperties>

export default App
