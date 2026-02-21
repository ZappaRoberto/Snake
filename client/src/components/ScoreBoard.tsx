import type { SnakeGameModel } from '../types'
import { getBestScore } from '../services/localStorage'

interface ScoreBoardProps {
  gameState: SnakeGameModel | null
}

// Use the same game ID as GameEngine for consistency
const LOCAL_GAME_ID = 'local-game-1'

export function ScoreBoard({ gameState }: ScoreBoardProps) {
  if (!gameState) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Score Board</h2>
        <p style={styles.status}>Loading game...</p>
      </div>
    )
  }

  const statusColor =
    gameState.state === 'running'
      ? '#48bb78'
      : gameState.state === 'paused'
        ? '#ecc94b'
        : '#f56565'

  // Get best score from localStorage
  const bestScore = getBestScore(LOCAL_GAME_ID)

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Score Board</h2>
      <div style={styles.row}>
        <span style={styles.label}>Score:</span>
        <span style={styles.value}>{gameState.score}</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>Best:</span>
        <span style={{ ...styles.value, color: '#f6e05e' }}>{bestScore}</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>Length:</span>
        <span style={styles.value}>{gameState.snake.length}</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>Direction:</span>
        <span style={{ ...styles.value, textTransform: 'uppercase' }}>{gameState.direction}</span>
      </div>
      <div style={{ ...styles.row, marginTop: '16px' }}>
        <span style={styles.label}>Status:</span>
        <span
          style={{
            ...styles.value,
            backgroundColor: statusColor,
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          {gameState.state}
        </span>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '16px' as const,
    backgroundColor: '#2d3748' as const,
    borderRadius: '8px' as const,
    color: '#fff' as const,
    fontFamily: 'sans-serif' as const,
  },
  title: {
    margin: '0 0 12px 0' as const,
    fontSize: '18px' as const,
    borderBottom: '1px solid #4a5568' as const,
    paddingBottom: '8px' as const,
  },
  row: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    marginBottom: '8px' as const,
    fontSize: '16px' as const,
  },
  label: {
    fontWeight: '500' as const,
  },
  value: {
    fontWeight: 'bold' as const,
  },
  status: {
    padding: '4px 8px' as const,
    backgroundColor: '#ecc94b' as const,
    borderRadius: '4px' as const,
  },
} satisfies Record<string, React.CSSProperties>

export default ScoreBoard
