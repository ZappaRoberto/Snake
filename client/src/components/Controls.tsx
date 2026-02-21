import { useEffect, useCallback } from 'react'
import type { Direction } from '../types'

interface ControlsProps {
  onMove: (direction: Direction) => void
}

export function Controls({ onMove }: ControlsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      let direction: Direction | null = null

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          direction = 'UP'
          break
        case 'ArrowDown':
          event.preventDefault()
          direction = 'DOWN'
          break
        case 'ArrowLeft':
          event.preventDefault()
          direction = 'LEFT'
          break
        case 'ArrowRight':
          event.preventDefault()
          direction = 'RIGHT'
          break
      }

      if (direction) {
        onMove(direction)
      }
    },
    [onMove],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Controls</h2>
      <p style={styles.instructions}>Use arrow keys or WASD to move the snake</p>
    </div>
  )
}

const styles = {
  container: {
    padding: '16px',
    backgroundColor: '#2d3748',
    borderRadius: '8px',
    color: '#fff',
    fontFamily: 'sans-serif',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '18px',
  },
  instructions: {
    margin: 0,
    fontSize: '14px',
    opacity: 0.8,
  },
}
