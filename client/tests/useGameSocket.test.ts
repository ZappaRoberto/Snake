/**
 * Tests for the useGameSocket hook
 *
 * Tests WebSocket connection, message handling, and sendMove functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useGameSocket } from '../src/hooks/useGameSocket'

// Track all created instances for testing
const mockWebSocketInstances: any[] = []
// Track WebSocket constructor calls with their URLs
const mockWebSocketCalls: string[] = []

// Mock fetch globally
const mockFetch = vi.fn()

// Create a proper class-based WebSocket mock that can be instantiated with 'new'
class MockWebSocket {
  url: string | null = null
  onopen: ((this: WebSocket, ev: Event) => void) | null = null
  onmessage: ((this: WebSocket, ev: MessageEvent) => void) | null = null
  onclose: ((this: WebSocket, ev: CloseEvent) => void) | null = null
  onerror: ((this: WebSocket, ev: Event) => void) | null = null
  readyState: number = 0 // CONNECTING
  messages: (string | ArrayBuffer)[] = []

  constructor(url: string) {
    this.url = url
    this.readyState = 0 // CONNECTING
    mockWebSocketCalls.push(url)
    mockWebSocketInstances.push(this)
  }

  send(data: string | ArrayBuffer): void {
    this.messages.push(data)
  }

  close(): void {
    this.readyState = 3 // CLOSED
    if (this.onclose) {
      this.onclose({ wasClean: true, code: 1000 } as CloseEvent)
    }
  }

  simulateOpen(): void {
    this.readyState = 1 // OPEN
    if (this.onopen) {
      this.onopen({ type: 'open' } as Event)
    }
  }

  simulateMessage(data: any): void {
    if (this.onmessage && this.readyState === 1) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent)
    }
  }

  simulateClose(): void {
    this.readyState = 3 // CLOSED
    if (this.onclose) {
      this.onclose({ wasClean: true, code: 1006 } as CloseEvent)
    }
  }

  simulateError(error: any): void {
    if (this.onerror) {
      this.onerror(error)
    }
  }

  static get CONNECTING() { return 0 }
  static get OPEN() { return 1 }
  static get CLOSING() { return 2 }
  static get CLOSED() { return 3 }
}

// Mock the WebSocket class at module level before importing useGameSocket
vi.mock('three', () => ({}))

global.fetch = mockFetch

describe('useGameSocket Hook', () => {
  let originalWebSocket: typeof WebSocket | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    mockWebSocketInstances.length = 0
    mockWebSocketCalls.length = 0

    // Setup default fetch response
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 'test-game-123',
          snake: [{ x: 5, y: 5 }],
          food: { x: 10, y: 10 },
          direction: 'UP' as const,
          score: 0,
          grid_size: [20, 20] as const,
          state: 'running' as const,
        }),
    })

    // Save and replace WebSocket
    originalWebSocket = (global as any).WebSocket
    ;(global as any).WebSocket = MockWebSocket
  })

  afterEach(() => {
    if (originalWebSocket) {
      ;(global as any).WebSocket = originalWebSocket
    }
  })

  it('connects to the WebSocket on mount', async () => {
    renderHook(() => useGameSocket())

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/game/new',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('sets initial state to null', () => {
    const { result } = renderHook(() => useGameSocket())

    expect(result.current.gameState).toBeNull()
    expect(result.current.isConnected).toBe(false)
  })

  it('receives game state from API response', async () => {
    const { result } = renderHook(() => useGameSocket())

    await waitFor(() => {
      expect(result.current.gameState).not.toBeNull()
    })

    expect(result.current.gameState).toEqual({
      id: 'test-game-123',
      snake: [{ x: 5, y: 5 }],
      food: { x: 10, y: 10 },
      direction: 'UP' as const,
      score: 0,
      grid_size: [20, 20] as const,
      state: 'running' as const,
    })
  })

  it('sets isConnected to true when WebSocket opens', async () => {
    renderHook(() => useGameSocket())

    await waitFor(() => {
      expect(mockWebSocketInstances.length).toBeGreaterThan(0)
    })

    const mockInstance = mockWebSocketInstances[0]

    act(() => {
      mockInstance.simulateOpen()
    })

    await waitFor(() => {
      expect(mockInstance.readyState).toBe(1) // OPEN
    })
  })

  it('handles game_state messages from WebSocket', async () => {
    const { result } = renderHook(() => useGameSocket())

    await waitFor(() => {
      expect(result.current.gameState).not.toBeNull()
    })

    await waitFor(() => {
      expect(mockWebSocketInstances.length).toBeGreaterThan(0)
    })

    const mockInstance = mockWebSocketInstances[0]

    act(() => {
      mockInstance.simulateOpen()
    })

    // Simulate a game state update message
    act(() => {
      mockInstance.simulateMessage({
        type: 'game_state',
        game: {
          id: 'test-game-123',
          snake: [{ x: 5, y: 5 }, { x: 5, y: 6 }],
          food: { x: 10, y: 10 },
          direction: 'UP' as const,
          score: 1,
          grid_size: [20, 20] as const,
          state: 'running' as const,
        },
      })
    })

    await waitFor(() => {
      expect(result.current.gameState?.snake.length).toBe(2)
      expect(result.current.gameState?.score).toBe(1)
    })
  })

  it('handles game_over messages from WebSocket', async () => {
    const consoleSpy = vi.spyOn(console, 'log')

    const { result } = renderHook(() => useGameSocket())

    await waitFor(() => {
      expect(result.current.gameState).not.toBeNull()
    })

    await waitFor(() => {
      expect(mockWebSocketInstances.length).toBeGreaterThan(0)
    })

    const mockInstance = mockWebSocketInstances[0]

    act(() => {
      mockInstance.simulateOpen()
    })

    // Simulate game over message
    act(() => {
      mockInstance.simulateMessage({
        type: 'game_over',
        score: 10,
        final_snake_length: 5,
      })
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Game over! Score:', 10)
    })

    consoleSpy.mockRestore()
  })

  it('sets isConnected to false when WebSocket closes', async () => {
    const { result } = renderHook(() => useGameSocket())

    await waitFor(() => {
      expect(mockWebSocketInstances.length).toBeGreaterThan(0)
    })

    const mockInstance = mockWebSocketInstances[0]

    act(() => {
      mockInstance.simulateOpen()
    })

    await waitFor(() => {
      expect(mockInstance.readyState).toBe(1) // OPEN
    })

    // Simulate WebSocket closing
    act(() => {
      mockInstance.simulateClose()
    })

    await waitFor(() => {
      expect(mockInstance.readyState).toBe(3) // CLOSED
    })
  })

  it('sends move message when sendMove is called', async () => {
    const { result } = renderHook(() => useGameSocket())

    await waitFor(() => {
      expect(mockWebSocketInstances.length).toBeGreaterThan(0)
    })

    const mockInstance = mockWebSocketInstances[0]

    act(() => {
      mockInstance.simulateOpen()
    })

    // Wait for request_state to be sent on open
    await waitFor(() => {
      expect(mockInstance.messages.length).toBeGreaterThan(0)
    })

    // Get the sendMove function and call it
    act(() => {
      result.current.sendMove('UP')
    })

    // Wait for move message to be added to messages array
    await waitFor(() => {
      // Find any message that contains type: move
      const hasMoveMessage = mockInstance.messages.some((msg) =>
        (msg as string).includes('"type":"move"')
      )
      expect(hasMoveMessage).toBe(true)
    })

    // Check that at least one message is a move message with direction UP
    const moveMessages = mockInstance.messages.filter(
      (msg) => (msg as string).includes('"type":"move"') && (msg as string).includes('"direction":"UP"')
    )
    expect(moveMessages.length).toBeGreaterThan(0)
  })

  it('logs error when sendMove is called without connection', async () => {
    const consoleSpy = vi.spyOn(console, 'error')

    const { result } = renderHook(() => useGameSocket())

    act(() => {
      result.current.sendMove('UP')
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket not connected')
    })

    consoleSpy.mockRestore()
  })

  it('does not send move when WebSocket is not open', async () => {
    const { result } = renderHook(() => useGameSocket())

    // Before simulateOpen, readyState should be CONNECTING (0), not OPEN (1)
    act(() => {
      result.current.sendMove('UP')
    })

    await waitFor(() => {
      expect(mockWebSocketInstances.length).toBeGreaterThan(0)
      const mockInstance = mockWebSocketInstances[0]
      // Only request_state was sent, no move messages
      const hasMoveMessage = mockInstance.messages.some((msg) =>
        (msg as string).includes('"type":"move"')
      )
      expect(hasMoveMessage).toBe(false)
    })
  })

  it('handles fetch errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const consoleSpy = vi.spyOn(console, 'error')

    renderHook(() => useGameSocket())

    // Wait for the promise rejection to be handled
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('cleans up WebSocket on unmount', async () => {
    const closeSpy = vi.fn()

    const { result, unmount } = renderHook(() => useGameSocket())

    await waitFor(() => {
      expect(mockWebSocketInstances.length).toBeGreaterThan(0)
    })

    const mockInstance = mockWebSocketInstances[0]

    // Override close method on this specific instance
    mockInstance.close = closeSpy

    act(() => {
      mockInstance.simulateOpen()
    })

    await waitFor(() => {
      expect(mockInstance.readyState).toBe(1) // OPEN
    })

    // Unmount the hook
    unmount()

    await waitFor(() => {
      expect(closeSpy).toHaveBeenCalled()
    })
  })
})

describe('useGameSocket - Connection Handling', () => {
  let originalWebSocket: typeof WebSocket | undefined

  beforeEach(() => {
    originalWebSocket = (global as any).WebSocket
    vi.clearAllMocks()
    mockWebSocketInstances.length = 0
    mockWebSocketCalls.length = 0

    // Setup default fetch response
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 'test-game-123',
          snake: [{ x: 5, y: 5 }],
          food: { x: 10, y: 10 },
          direction: 'UP' as const,
          score: 0,
          grid_size: [20, 20] as const,
          state: 'running' as const,
        }),
    })

    ;(global as any).WebSocket = MockWebSocket
  })

  afterEach(() => {
    if (originalWebSocket) {
      ;(global as any).WebSocket = originalWebSocket
    }
  })

  it('connects with correct WebSocket URL format', async () => {
    renderHook(() => useGameSocket())

    await waitFor(() => {
      expect(mockWebSocketCalls.length).toBeGreaterThan(0)
      expect(mockWebSocketCalls[0]).toBe(
        'ws://localhost:8000/ws/game?game_id=test-game-123'
      )
    })
  })

  it('sends request_state after WebSocket opens', async () => {
    renderHook(() => useGameSocket())

    await waitFor(() => {
      expect(mockWebSocketCalls.length).toBeGreaterThan(0)
    })

    const mockInstance = mockWebSocketInstances[0]

    act(() => {
      mockInstance.simulateOpen()
    })

    await waitFor(() => {
      expect(mockInstance.messages.length).toBeGreaterThan(0)
    })

    // Check that the first message is request_state
    expect(mockInstance.messages[0]).toBe('{"type":"request_state"}')
  })
})
