/**
 * Tests for the Controls component
 *
 * Tests keyboard event handling for WASD and arrow keys
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userEvent } from '@testing-library/user-event'
import { Controls } from '../src/components/Controls'

describe('Controls Component', () => {
  let onMoveMock: vi.Mock<(direction: string) => void>

  beforeEach(() => {
    onMoveMock = vi.fn()
  })

  it('renders the controls container with title and instructions', () => {
    render(<Controls onMove={onMoveMock} />)

    expect(screen.getByText(/Controls/i)).toBeInTheDocument()
    expect(screen.getByText(/Use arrow keys or WASD to move/i)).toBeInTheDocument()
  })

  describe('Arrow Key Controls', () => {
    it('triggers UP direction when ArrowUp is pressed', async () => {
      const user = userEvent.setup()
      render(<Controls onMove={onMoveMock} />)

      await user.keyboard('{arrowup}')

      expect(onMoveMock).toHaveBeenCalledWith('UP')
      expect(onMoveMock).toHaveBeenCalledTimes(1)
    })

    it('triggers DOWN direction when ArrowDown is pressed', async () => {
      const user = userEvent.setup()
      render(<Controls onMove={onMoveMock} />)

      await user.keyboard('{arrowdown}')

      expect(onMoveMock).toHaveBeenCalledWith('DOWN')
      expect(onMoveMock).toHaveBeenCalledTimes(1)
    })

    it('triggers LEFT direction when ArrowLeft is pressed', async () => {
      const user = userEvent.setup()
      render(<Controls onMove={onMoveMock} />)

      await user.keyboard('{arrowleft}')

      expect(onMoveMock).toHaveBeenCalledWith('LEFT')
      expect(onMoveMock).toHaveBeenCalledTimes(1)
    })

    it('triggers RIGHT direction when ArrowRight is pressed', async () => {
      const user = userEvent.setup()
      render(<Controls onMove={onMoveMock} />)

      await user.keyboard('{arrowright}')

      expect(onMoveMock).toHaveBeenCalledWith('RIGHT')
      expect(onMoveMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('WASD Key Controls', () => {
    it('triggers UP direction when w is pressed (lowercase)', async () => {
      const user = userEvent.setup()
      render(<Controls onMove={onMoveMock} />)

      await user.keyboard('w')

      expect(onMoveMock).toHaveBeenCalledWith('UP')
      expect(onMoveMock).toHaveBeenCalledTimes(1)
    })

    it('triggers UP direction when W is pressed (uppercase)', async () => {
      const user = userEvent.setup()
      render(<Controls onMove={onMoveMock} />)

      await user.keyboard('W')

      expect(onMoveMock).toHaveBeenCalledWith('UP')
      expect(onMoveMock).toHaveBeenCalledTimes(1)
    })

    it('triggers DOWN direction when s is pressed (lowercase)', async () => {
      const user = userEvent.setup()
      render(<Controls onMove={onMoveMock} />)

      await user.keyboard('s')

      expect(onMoveMock).toHaveBeenCalledWith('DOWN')
      expect(onMoveMock).toHaveBeenCalledTimes(1)
    })

    it('triggers DOWN direction when S is pressed (uppercase)', async () => {
      const user = userEvent.setup()
      render(<Controls onMove={onMoveMock} />)

      await user.keyboard('S')

      expect(onMoveMock).toHaveBeenCalledWith('DOWN')
      expect(onMoveMock).toHaveBeenCalledTimes(1)
    })

    it('triggers LEFT direction when a is pressed (lowercase)', async () => {
      const user = userEvent.setup()
      render(<Controls onMove={onMoveMock} />)

      await user.keyboard('a')

      expect(onMoveMock).toHaveBeenCalledWith('LEFT')
      expect(onMoveMock).toHaveBeenCalledTimes(1)
    })

    it('triggers LEFT direction when A is pressed (uppercase)', async () => {
      const user = userEvent.setup()
      render(<Controls onMove={onMoveMock} />)

      await user.keyboard('A')

      expect(onMoveMock).toHaveBeenCalledWith('LEFT')
      expect(onMoveMock).toHaveBeenCalledTimes(1)
    })

    it('triggers RIGHT direction when d is pressed (lowercase)', async () => {
      const user = userEvent.setup()
      render(<Controls onMove={onMoveMock} />)

      await user.keyboard('d')

      expect(onMoveMock).toHaveBeenCalledWith('RIGHT')
      expect(onMoveMock).toHaveBeenCalledTimes(1)
    })

    it('triggers RIGHT direction when D is pressed (uppercase)', async () => {
      const user = userEvent.setup()
      render(<Controls onMove={onMoveMock} />)

      await user.keyboard('D')

      expect(onMoveMock).toHaveBeenCalledWith('RIGHT')
      expect(onMoveMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('Prevent Default Behavior', () => {
    it('prevents default behavior for arrow keys', async () => {
      const user = userEvent.setup()

      // Track preventDefault calls by spying on the prototype
      const preventDefaultSpy = vi.fn()
      const originalPreventDefault = KeyboardEvent.prototype.preventDefault

      // Override the method on the prototype temporarily
      KeyboardEvent.prototype.preventDefault = preventDefaultSpy as any

      try {
        render(<Controls onMove={onMoveMock} />)

        // Dispatch a keyboard event with arrowup
        await user.keyboard('{arrowup}')

        // The component calls preventDefault in handleKeyDown for movement keys
        expect(preventDefaultSpy).toHaveBeenCalled()
      } finally {
        // Restore original preventDefault
        KeyboardEvent.prototype.preventDefault = originalPreventDefault
      }
    })
  })

  describe('Non-Movement Keys', () => {
    it('does not trigger onMove for non-movement keys', async () => {
      const user = userEvent.setup()
      render(<Controls onMove={onMoveMock} />)

      await user.keyboard('x')
      await user.keyboard('y')
      await user.keyboard('z')
      await user.keyboard(' ')

      expect(onMoveMock).not.toHaveBeenCalled()
    })
  })

  describe('Component Cleanup', () => {
    it('removes event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = render(<Controls onMove={onMoveMock} />)
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )
    })
  })
})
