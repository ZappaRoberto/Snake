import { useEffect, useCallback } from 'react';
import type { Direction } from '../types';

interface ControlsProps {
  onMove: (direction: Direction) => void;
  onTogglePause?: () => void;
}

export function Controls({ onMove, onTogglePause }: ControlsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      let direction: Direction | null = null;

      // Pause toggle with Escape or P
      if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
        event.preventDefault();
        if (onTogglePause) {
          onTogglePause();
        }
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault();
          direction = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          direction = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          direction = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          direction = 'RIGHT';
          break;
      }

      if (direction) {
        onMove(direction);
      }
    },
    [onMove, onTogglePause],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Keyboard shortcut display
  const shortcuts = [
    { key: '↑↓←→', action: 'Move' },
    { key: 'WASD', action: 'Move' },
    { key: 'P / Esc', action: 'Pause/Resume' },
  ];

  return (
    <div style={styles.container}>
      {/* Pause Button */}
      <div style={styles.pauseSection}>
        <h2 style={styles.title}>Controls</h2>
        {onTogglePause && (
          <button onClick={onTogglePause} style={styles.pauseButton}>
            <span style={styles.pauseIcon}>⏸️</span>
            <span>Pause Game</span>
          </button>
        )}
      </div>

      {/* Keyboard Hints */}
      <div style={styles.hintsContainer}>
        <h3 style={styles.hintsTitle}>Keyboard Shortcuts</h3>
        <div style={styles.shortcutsGrid}>
          {shortcuts.map((shortcut, index) => (
            <div key={index} style={styles.shortcutItem}>
              <span style={styles.keyBadge}>{shortcut.key}</span>
              <span style={styles.actionText}>{shortcut.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Touch Controls (visible on small screens via CSS) */}
      <div style={styles.touchControls}>
        <h3 style={styles.hintsTitle}>Touch Controls</h3>
        <div style={styles.dPad}>
          <div style={styles.dpadRow}>
            <div style={{ ...styles.dpadBtn, visibility: 'hidden' }} />
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onMove('UP');
              }}
              style={styles.dpadBtn}
            >
              ↑
            </button>
            <div style={{ ...styles.dpadBtn, visibility: 'hidden' }} />
          </div>
          <div style={styles.dpadRow}>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onMove('LEFT');
              }}
              style={styles.dpadBtn}
            >
              ←
            </button>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                // No center action - could be pause
              }}
              style={{ ...styles.dpadBtn, opacity: 0.5 }}
            >
              •
            </button>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onMove('RIGHT');
              }}
              style={styles.dpadBtn}
            >
              →
            </button>
          </div>
          <div style={styles.dpadRow}>
            <div style={{ ...styles.dpadBtn, visibility: 'hidden' }} />
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onMove('DOWN');
              }}
              style={styles.dpadBtn}
            >
              ↓
            </button>
            <div style={{ ...styles.dpadBtn, visibility: 'hidden' }} />
          </div>
        </div>
      </div>
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
  pauseSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  pauseButton: {
    padding: '8px 16px',
    backgroundColor: '#f59e0b',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'background-color 0.2s, transform 0.1s',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
  },
  pauseIcon: {
    fontSize: '16px',
  },
  hintsContainer: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#0f172a',
    borderRadius: '6px',
  },
  hintsTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  shortcutsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  shortcutItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  keyBadge: {
    backgroundColor: '#334155',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  actionText: {
    color: '#cbd5e1',
  },
  touchControls: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#0f172a',
    borderRadius: '6px',
  },
  dPad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '4px',
    maxWidth: '120px',
    margin: '0 auto',
  },
  dpadRow: {
    display: 'flex',
    gap: '4px',
  },
  dpadBtn: {
    width: '32px',
    height: '32px',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.1s, transform 0.1s',
    touchAction: 'manipulation',
  },
} satisfies Record<string, React.CSSProperties>;
