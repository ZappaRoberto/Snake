import { useState, useEffect } from 'react';
import type { SnakeGameModel } from '../types';
import { getBestScore } from '../services/localStorage';
import { SpeedBar } from './SpeedBar';

interface ScoreBoardProps {
  gameState: SnakeGameModel | null;
}

// Use the same game ID as GameEngine for consistency
const LOCAL_GAME_ID = 'local-game-1';

export function ScoreBoard({ gameState }: ScoreBoardProps) {
  const [timePlayed, setTimePlayed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Track start time when game begins running
  useEffect(() => {
    if (gameState?.state === 'running' && startTime === null) {
      setStartTime(Date.now());
    } else if (gameState?.state !== 'running') {
      setStartTime(null);
    }
  }, [gameState?.state]);

  // Update time played counter while running
  useEffect(() => {
    let interval: number | undefined;

    if (startTime && gameState?.state === 'running') {
      interval = window.setInterval(() => {
        setTimePlayed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, gameState?.state]);

  // Format seconds as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate level based on score (every 5 apples = 1 level)
  const getLevel = (score: number): number => {
    return Math.floor(score / 5) + 1;
  };

  // Get level progress (0-100% within current level)
  const getLevelProgress = (score: number): number => {
    const applesInCurrentLevel = score % 5;
    return Math.round((applesInCurrentLevel / 5) * 100);
  };

  if (!gameState) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Score Board</h2>
        <p style={styles.status}>Loading game...</p>
      </div>
    );
  }

  const statusColor =
    gameState.state === 'running'
      ? '#4ade80'
      : gameState.state === 'paused'
        ? '#fbbf24'
        : '#ef4444';

  const bestScore = getBestScore(LOCAL_GAME_ID);
  const level = getLevel(gameState.score);
  const levelProgress = getLevelProgress(gameState.score);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Score Board</h2>

      {/* Level Progress */}
      <div style={styles.row}>
        <span style={styles.label}>Level</span>
        <span style={{ ...styles.value, color: '#6366f1' }}>{level}</span>
      </div>
      <div style={styles.progressBarContainer}>
        <div
          style={{
            ...styles.progressFill,
            width: `${levelProgress}%`,
          }}
        >
          <span style={styles.levelText}>{levelProgress}%</span>
        </div>
      </div>

      {/* Score */}
      <div style={{ ...styles.row, marginTop: '12px' }}>
        <span style={styles.label}>Score</span>
        <span style={styles.value}>{gameState.score}</span>
      </div>

      {/* High Score */}
      <div style={styles.row}>
        <span style={styles.label}>High Score</span>
        <span style={{ ...styles.value, color: '#fbbf24' }}>{bestScore}</span>
      </div>

      {/* Length */}
      <div style={styles.row}>
        <span style={styles.label}>Length</span>
        <span style={styles.value}>{gameState.snake.length}</span>
      </div>

      {/* Direction */}
      <div style={styles.row}>
        <span style={styles.label}>Direction</span>
        <span style={{ ...styles.value, textTransform: 'uppercase' }}>{gameState.direction}</span>
      </div>

      {/* Time Played */}
      {startTime && (
        <div style={styles.row}>
          <span style={styles.label}>Time Played</span>
          <span style={{ ...styles.value, fontFamily: 'monospace' }}>
            {formatTime(timePlayed)}
          </span>
        </div>
      )}

      {/* Status */}
      <div style={{ ...styles.row, marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
        <span style={styles.label}>Status</span>
        <span
          style={{
            ...styles.value,
            backgroundColor: statusColor,
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
          }}
        >
          {gameState.state.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Speed Indicator */}
      <SpeedBar gameState={gameState} />
    </div>
  );
}

const styles = {
  container: {
    padding: '16px',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontFamily: 'sans-serif',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#f8fafc',
    borderBottom: '2px solid #3b82f6',
    paddingBottom: '8px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
  },
  label: {
    fontWeight: '500',
    color: '#94a3b8',
  },
  value: {
    fontWeight: 'bold',
    fontSize: '16px',
  },
  progressBarContainer: {
    height: '6px',
    backgroundColor: '#334155',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: '3px',
    position: 'relative',
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  levelText: {
    fontSize: '9px',
    color: '#fff',
    fontWeight: 'bold',
    position: 'absolute',
    right: '4px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  status: {
    padding: '6px 12px',
    backgroundColor: '#fbbf24',
    borderRadius: '4px',
    color: '#0f172a',
    fontWeight: 'bold',
  },
} satisfies Record<string, React.CSSProperties>;

export default ScoreBoard;
