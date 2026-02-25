import { useEffect, useState } from 'react';
import type { SnakeGameModel } from '../types'
import { DIFFICULTY_SETTINGS } from '../types'

interface SpeedBarProps {
  gameState: SnakeGameModel;
}

/**
 * Visual speed indicator component.
 * Shows current game speed as a progress bar that fills/empties based on speed.
 */
export function SpeedBar({ gameState }: SpeedBarProps) {
  const [speedProgress, setSpeedProgress] = useState(100);

  // Calculate speed percentage based on difficulty settings
  useEffect(() => {
    const settings = DIFFICULTY_SETTINGS[gameState.difficulty];

    // Calculate speed percentage (higher % = faster speed)
    const maxSpeed = settings.baseSpeed;
    const minSpeed = settings.minSpeed;

    // Current delay based on score (same logic as in useGameSocket)
    const currentDelay = Math.max(minSpeed, maxSpeed - gameState.score * settings.reductionPerApple);

    // Convert delay to progress percentage (inverted: lower delay = higher speed)
    const totalRange = maxSpeed - minSpeed;
    const currentRange = maxSpeed - currentDelay;
    const progress = Math.min(100, Math.max(0, (currentRange / totalRange) * 100));

    setSpeedProgress(progress);
  }, [gameState.score, gameState.difficulty]);

  // Get color based on speed range
  const getSpeedColor = () => {
    if (speedProgress < 30) return '#4ade80'; // Slow - green
    if (speedProgress < 70) return '#fbbf24'; // Medium - yellow
    return '#ef4444'; // Fast - red
  };

  const speedColor = getSpeedColor();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>Speed</span>
        <span style={{ ...styles.value, color: speedColor }}>
          {speedProgress.toFixed(0)}%
        </span>
      </div>
      <div style={styles.barContainer}>
        <div
          style={{
            ...styles.progressBar,
            width: `${speedProgress}%`,
            backgroundColor: speedColor,
            boxShadow: `0 0 10px ${speedColor}80`,
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
  },
  label: {
    fontWeight: '500',
    color: '#cbd5e1',
  },
  value: {
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  barContainer: {
    height: '8px',
    backgroundColor: '#334155',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export default SpeedBar;
