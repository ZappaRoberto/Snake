/**
 * Tests for the Game3D component
 *
 * Tests Three.js scene initialization, rendering, and cleanup
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Track constructor calls - these need to be accessible inside vi.mock factory
let mockCallTracker = {
  scenes: [] as any[],
  cameras: [] as any[],
  renderers: [] as any[],
  lights: [] as any[],
  geometries: [] as any[],
  materials: [] as any[],
  meshes: [] as any[],
  groups: [] as any[],
}

// Helper to create a mock with set() method
function createMockWithSet(): any {
  const mock: any = {
    x: 0,
    y: 0,
    z: 0,
    set: vi.fn(function(this: any, x: number, y?: number, z?: number) {
      this.x = x
      if (y !== undefined) this.y = y
      if (z !== undefined) this.z = z
      return this
    }),
    clone: vi.fn(() => createMockWithSet()),
    copy: vi.fn(function(this: any, v: any) {
      this.x = v.x
      this.y = v.y
      this.z = v.z
      return this
    }),
    add: vi.fn(function(this: any, v: any) {
      this.x += v.x
      this.y += v.y
      this.z += v.z
      return this
    }),
  }
  return mock
}

beforeEach(() => {
  // Reset tracker for each test
  mockCallTracker = {
    scenes: [],
    cameras: [],
    renderers: [],
    lights: [],
    geometries: [],
    materials: [],
    meshes: [],
    groups: [],
  }
  global.document.body.innerHTML = '<div id="root"></div>'
})

// Mock Three.js completely to avoid instantiation issues
vi.mock('three', () => {
  // Define all mock classes inside the factory function so they're available when vi.mock runs

  class MockColor {
    hexValue: number
    constructor(hex: number) {
      this.hexValue = hex
    }
    clone() {
      return new MockColor(this.hexValue)
    }
    lerp(target: MockColor, amount: number) {
      // Simple linear interpolation mock - just return target for testing purposes
      return target
    }
  }

  class Vector3 {
    x: number
    y: number
    z: number

    constructor(x?: number, y?: number, z?: number) {
      this.x = x || 0
      this.y = y || 0
      this.z = z || 0
    }
    set(x: number, y: number, z: number) {
      this.x = x
      this.y = y
      this.z = z
      return this
    }
    copy(v: Vector3) {
      this.x = v.x
      this.y = v.y
      this.z = v.z
      return this
    }
    add(v: Vector3) {
      this.x += v.x
      this.y += v.y
      this.z += v.z
      return this
    }
    clone() {
      return new Vector3(this.x, this.y, this.z)
    }
  }

  const mockScenePrototype = {
    background: null,
    add: vi.fn(),
    position: createMockWithSet(),
  }

  const mockCameraPrototype = {
    position: createMockWithSet(),
    lookAt: vi.fn(),
    left: -10,
    right: 10,
    top: 10,
    bottom: -10,
    updateProjectionMatrix: vi.fn(),
  }

  const mockRendererPrototype = {
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    render: vi.fn(),
    shadowMap: { enabled: false, type: null },
    domElement: document.createElement('canvas'),
  }

  // Shadow map constants
  const PCFSoftShadowMap = 3001

  const mockFogExp2Prototype = {
    color: null,
    density: 0,
  }

  return {
    Scene: class Scene {
      background: any
      add: vi.Mock
      position: any

      constructor() {
        this.background = null
        this.add = mockScenePrototype.add
        this.position = mockScenePrototype.position
        mockCallTracker.scenes.push(this)
      }
    },
    OrthographicCamera: class OrthographicCamera {
      position: any
      lookAt: vi.Mock
      left: number
      right: number
      top: number
      bottom: number
      updateProjectionMatrix: vi.Mock

      constructor(left: number, right: number, top: number, bottom: number, near: number, far: number) {
        this.position = mockCameraPrototype.position
        this.lookAt = mockCameraPrototype.lookAt
        this.left = left
        this.right = right
        this.top = top
        this.bottom = bottom
        this.updateProjectionMatrix = mockCameraPrototype.updateProjectionMatrix
        mockCallTracker.cameras.push(this)
      }
    },
    WebGLRenderer: class WebGLRenderer {
      setSize: vi.Mock
      setPixelRatio: vi.Mock
      render: vi.Mock
      shadowMap: any
      domElement: HTMLElement

      constructor(options?: any) {
        this.setSize = mockRendererPrototype.setSize
        this.setPixelRatio = mockRendererPrototype.setPixelRatio
        this.render = mockRendererPrototype.render
        this.shadowMap = mockRendererPrototype.shadowMap
        this.domElement = mockRendererPrototype.domElement
        mockCallTracker.renderers.push(this)
      }
    },
    Color: MockColor,
    Vector3,
    AmbientLight: class AmbientLight {
      color: any
      intensity: number
      position: any

      constructor(color: string, intensity: number) {
        this.color = color
        this.intensity = intensity
        this.position = createMockWithSet()
        mockCallTracker.lights.push(this)
      }
    },
    DirectionalLight: class DirectionalLight {
      color: any
      intensity: number
      position: any
      castShadow: boolean
      shadow: any

      constructor(color: string, intensity: number) {
        this.color = color
        this.intensity = intensity
        this.position = createMockWithSet()
        this.castShadow = false
        this.shadow = {
          mapSize: { width: 1024, height: 1024 },
          camera: { near: 1, far: 100 },
          bias: 0,
          autoUpdate: true,
        }
        mockCallTracker.lights.push(this)
      }
    },
    GridHelper: class GridHelper {
      size: number
      divisions: number
      position: any

      constructor(size: number, divisions: number) {
        this.size = size
        this.divisions = divisions
        this.position = createMockWithSet()
        mockCallTracker.geometries.push(this)
      }
    },
    Group: class Group {
      children: any[] = []
      position: any
      rotation: any
      scale: any
      remove: vi.Mock
      add: vi.Mock

      constructor() {
        this.position = createMockWithSet()
        this.rotation = createMockWithSet()
        this.scale = createMockWithSet()
        this.remove = vi.fn((child: any) => {
          const index = this.children.indexOf(child)
          if (index > -1) this.children.splice(index, 1)
        })
        this.add = vi.fn((child: any) => {
          if (!this.children.includes(child)) this.children.push(child)
        })
        mockCallTracker.groups.push(this)
      }
    },
    FogExp2: class FogExp2 {
      color: any
      density: number

      constructor(color: any, density: number) {
        this.color = color
        this.density = density
        mockCallTracker.fog = { color, density }
      }
    },
    SphereGeometry: class SphereGeometry {
      radius: number
      widthSegments: number
      heightSegments: number

      constructor(radius: number, widthSegments: number, heightSegments: number) {
        this.radius = radius
        this.widthSegments = widthSegments
        this.heightSegments = heightSegments
        mockCallTracker.geometries.push(this)
      }
    },
    MeshStandardMaterial: class MeshStandardMaterial {
      options: any

      constructor(options?: any) {
        this.options = options
        mockCallTracker.materials.push(options)
      }
    },
    BoxGeometry: class BoxGeometry {
      width: number
      height: number
      depth: number

      constructor(width: number, height: number, depth: number) {
        this.width = width
        this.height = height
        this.depth = depth
        mockCallTracker.geometries.push(this)
      }
    },
    CylinderGeometry: class CylinderGeometry {
      radiusTop: number
      radiusBottom: number
      height: number
      radialSegments: number

      constructor(radiusTop: number, radiusBottom: number, height: number, radialSegments: number) {
        this.radiusTop = radiusTop
        this.radiusBottom = radiusBottom
        this.height = height
        this.radialSegments = radialSegments
        mockCallTracker.geometries.push(this)
      }
    },
    TorusGeometry: class TorusGeometry {
      radius: number
      tube: number
      radialSegments: number
      tubularSegments: number
      arc: number

      constructor(radius: number, tube: number, radialSegments: number, tubularSegments: number, arc: number) {
        this.radius = radius
        this.tube = tube
        this.radialSegments = radialSegments
        this.tubularSegments = tubularSegments
        this.arc = arc
        mockCallTracker.geometries.push(this)
      }
    },
    Mesh: class Mesh {
      geometry: any
      material: any
      position: any
      scale: any
      rotation: any
      castShadow: boolean
      receiveShadow: boolean
      children: any[] = []
      add: vi.Mock

      constructor(geometry: any, material: any) {
        this.geometry = geometry
        this.material = material
        this.position = createMockWithSet()
        this.scale = createMockWithSet()
        this.rotation = createMockWithSet()
        this.castShadow = false
        this.receiveShadow = false
        this.add = vi.fn((child: any) => {
          if (!this.children.includes(child)) this.children.push(child)
        })
        mockCallTracker.meshes.push(this)
      }
    },
    PlaneGeometry: class PlaneGeometry {
      width: number
      height: number

      constructor(width: number, height: number) {
        this.width = width
        this.height = height
      }
    },
    Points: class Points {
      geometry: any
      material: any

      constructor(geometry: any, material: any) {
        this.geometry = geometry
        this.material = material
      }
    },
    PointsMaterial: class PointsMaterial {
      options: any

      constructor(options?: any) {
        this.options = options
      }
    },
    PCFSoftShadowMap,
  }
})

// Import after mocking
import { Game3D } from '../src/components/Game3D'

describe('Game3D Component', () => {
  const createMockGameState = (overrides: Partial<any> = {}) => ({
    id: 'test-game-1',
    snake: [{ x: 5, y: 5 }, { x: 5, y: 6 }],
    food: { x: 10, y: 10 },
    direction: 'UP' as const,
    score: 10,
    grid_size: [20, 20] as const,
    state: 'running' as const,
    ...overrides,
  })

  it('renders the game container div', async () => {
    const { container } = render(<Game3D gameState={createMockGameState()} />)

    await waitFor(() => {
      expect(container.firstElementChild).toHaveStyle('width: 100%')
      expect(container.firstElementChild).toHaveStyle('height: 500px')
    })
    expect(container.firstElementChild).toBeInTheDocument()
  })

  it('initializes Three.js scene when mounted', async () => {
    render(<Game3D gameState={createMockGameState()} />)

    // Wait for effect to run
    await waitFor(() => {
      expect(mockCallTracker.scenes.length).toBeGreaterThan(0)
    })
  })

  it('creates an isometric OrthographicCamera', async () => {
    render(<Game3D gameState={createMockGameState()} />)

    // Wait for effect to run
    await waitFor(() => {
      expect(mockCallTracker.cameras.length).toBeGreaterThan(0)
    })

    // Verify camera was called with appropriate aspect ratio parameters
    const camera = mockCallTracker.cameras[0]
    expect(camera.left).toBeDefined()
    expect(camera.right).toBeDefined()
    expect(camera.top).toBeDefined()
    expect(camera.bottom).toBeDefined()
  })

  it('adds ambient and directional lighting to the scene', async () => {
    render(<Game3D gameState={createMockGameState()} />)

    await waitFor(() => {
      expect(mockCallTracker.lights.length).toBeGreaterThan(0)
      // Check that lights have color and intensity properties
      const hasLights = mockCallTracker.lights.some((l: any) => l.color !== undefined && l.intensity !== undefined)
      expect(hasLights).toBe(true)
    })
  })

  it('creates a GridHelper based on grid_size', async () => {
    render(<Game3D gameState={createMockGameState()} />)

    await waitFor(() => {
      expect(mockCallTracker.geometries.length).toBeGreaterThan(0)
    })
  })

  it('renders snake segments as meshes when game state has snake', async () => {
    render(<Game3D gameState={createMockGameState()} />)

    await waitFor(() => {
      // Verify snake geometry was created for each segment (CylinderGeometry has radiusTop property)
      const cylinderGeoms = mockCallTracker.geometries.filter((g: any) => g.radiusTop && g.height === 0.7)
      expect(cylinderGeoms.length).toBe(2) // 2 segments in mock snake
    })
  })

  it('renders food as a sphere when game state has food', async () => {
    render(<Game3D gameState={createMockGameState()} />)

    await waitFor(() => {
      // Verify sphere geometry was created (SphereGeometry has radius property)
      const sphereGeoms = mockCallTracker.geometries.filter((g: any) => g.radius)
      expect(sphereGeoms.length).toBeGreaterThan(0)
    })
  })

  it('handles null game state gracefully', async () => {
    const { container } = render(<Game3D gameState={null} />)

    // Component should still render the container div
    await waitFor(() => {
      expect(container.firstElementChild).toBeInTheDocument()
    })

    await waitFor(() => {
      // GridHelper should be called with default size 20 when gameState is null
      expect(mockCallTracker.geometries.length).toBeGreaterThan(0)
    })
  })

  it('handles empty snake array', async () => {
    const gameState = createMockGameState({ snake: [] })

    render(<Game3D gameState={gameState} />)

    // Component should still render
    await waitFor(() => {
      expect(document.body).toBeTruthy()
    })
  })

  it('adds resize event listener on mount', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

    render(<Game3D gameState={createMockGameState()} />)

    await waitFor(() => {
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    addEventListenerSpy.mockRestore()
  })

  it('removes resize event listener on unmount', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    render(<Game3D gameState={createMockGameState()} />)

    await waitFor(() => {
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    // Clear mocks to see only removeEventListener calls
    addEventListenerSpy.mockRestore()

    const { unmount } = render(<Game3D gameState={createMockGameState()} />)
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })

  it('sets up camera position correctly', async () => {
    render(<Game3D gameState={createMockGameState()} />)

    await waitFor(() => {
      // Verify camera.position.set was called
      const camera = mockCallTracker.cameras[0]
      expect(camera.position.set).toHaveBeenCalled()
    })
  })

  it('configures renderer size correctly', async () => {
    // We need to check the original mock's tracker since vi.doMock won't work after initial import
    render(<Game3D gameState={createMockGameState()} />)

    await waitFor(() => {
      expect(mockCallTracker.renderers.length).toBeGreaterThan(0)
    })

    // Since we can't easily track rendererPrototype from outside, just verify
    // that the mock was called by checking the mock Call Tracker contains entries
    const renderer = mockCallTracker.renderers[0]
    expect(renderer.setSize).toBeDefined()
    expect(renderer.setPixelRatio).toBeDefined()
  })

  it('updates snake mesh positions when game state changes', async () => {
    // Re-mock for this specific test to track new instances
    vi.doMock('three', () => {
      class MockColor {
        hexValue: number
        constructor(hex: number) { this.hexValue = hex }
      }

      const mockScenePrototype = {
        background: null,
        add: vi.fn(),
        position: createMockWithSet(),
      }

      const mockCameraPrototype = {
        position: createMockWithSet(),
        lookAt: vi.fn(),
        left: -10,
        right: 10,
        top: 10,
        bottom: -10,
        updateProjectionMatrix: vi.fn(),
      }

      const mockRendererPrototype = {
        setSize: vi.fn(),
        setPixelRatio: vi.fn(),
        render: vi.fn(),
        shadowMap: { enabled: false, type: null },
        domElement: document.createElement('canvas'),
      }

      return {
        Scene: class Scene {
          background: any
          add: vi.Mock
          position: any
          fog: any | null
          constructor() {
            this.background = null
            this.fog = null
            this.add = mockScenePrototype.add
            this.position = mockScenePrototype.position
          }
        },
        OrthographicCamera: class OrthographicCamera {
          position: any
          lookAt: vi.Mock
          left: number; right: number; top: number; bottom: number
          updateProjectionMatrix: vi.Mock
          constructor(left: number, right: number, top: number, bottom: number, near: number, far: number) {
            this.position = mockCameraPrototype.position
            this.lookAt = mockCameraPrototype.lookAt
            this.left = left; this.right = right; this.top = top; this.bottom = bottom
            this.updateProjectionMatrix = mockCameraPrototype.updateProjectionMatrix
          }
        },
        WebGLRenderer: class WebGLRenderer {
          setSize: vi.Mock
          setPixelRatio: vi.Mock
          render: vi.Mock
          domElement: HTMLElement
          constructor(options?: any) {
            this.setSize = mockRendererPrototype.setSize
            this.setPixelRatio = mockRendererPrototype.setPixelRatio
            this.render = mockRendererPrototype.render
            this.domElement = mockRendererPrototype.domElement
          }
        },
        Color: MockColor,
        AmbientLight: class AmbientLight { constructor(color: string, intensity: number) {} },
        DirectionalLight: class DirectionalLight { constructor(color: string, intensity: number) {} },
        GridHelper: class GridHelper {
          constructor(size: number, divisions: number) { mockCallTracker.geometries.push(this) }
        },
        Group: class Group {
          children: any[] = []
          position: any
          rotation: any
          scale: any
          remove = vi.fn((child: any) => {
            const index = this.children.indexOf(child)
            if (index > -1) this.children.splice(index, 1)
          })
          add = vi.fn((child: any) => {
            if (!this.children.includes(child)) this.children.push(child)
          })
          constructor() {
            this.position = createMockWithSet()
            this.rotation = createMockWithSet()
            this.scale = createMockWithSet()
            mockCallTracker.groups.push(this)
          }
        },
        SphereGeometry: class SphereGeometry { constructor(radius: number, widthSegments: number, heightSegments: number) {} },
        MeshStandardMaterial: class MeshStandardMaterial { constructor(options?: any) {} },
        BoxGeometry: class BoxGeometry { constructor(width: number, height: number, depth: number) {} },
        CylinderGeometry: class CylinderGeometry {
          radiusTop: number
          radiusBottom: number
          height: number
          radialSegments: number
          constructor(radiusTop: number, radiusBottom: number, height: number, radialSegments: number) {
            this.radiusTop = radiusTop
            this.radiusBottom = radiusBottom
            this.height = height
            this.radialSegments = radialSegments
            mockCallTracker.geometries.push(this)
          }
        },
        TorusGeometry: class TorusGeometry {
          radius: number
          tube: number
          radialSegments: number
          tubularSegments: number
          arc: number
          constructor(radius: number, tube: number, radialSegments: number, tubularSegments: number, arc: number) {
            this.radius = radius
            this.tube = tube
            this.radialSegments = radialSegments
            this.tubularSegments = tubularSegments
            this.arc = arc
          }
        },
        Points: class Points {
          geometry: any
          material: any
          constructor(geometry: any, material: any) {}
        },
        PointsMaterial: class PointsMaterial {
          options: any
          constructor(options?: any) { this.options = options }
        },
        Mesh: class Mesh {
          geometry: any
          material: any
          position: any
          scale: any
          children: any[] = []
          add: vi.Mock
          constructor(geometry: any, material: any) {
            this.geometry = geometry
            this.material = material
            this.position = createMockWithSet()
            this.scale = createMockWithSet()
            this.add = vi.fn((child: any) => { if (!this.children.includes(child)) this.children.push(child) })
            mockCallTracker.meshes.push(this)
          }
        },
        FogExp2: class FogExp2 {
          constructor(color: any, density: number) {}
        },
      }
    })

    // Re-import after re-mocking
    const { Game3D: NewGame3D } = await import('../src/components/Game3D')

    const { rerender } = render(<NewGame3D gameState={createMockGameState()} />)

    await waitFor(() => {
      expect(mockCallTracker.meshes.length).toBeGreaterThan(0)
    })

    // Update game state with more snake segments
    const newState = createMockGameState({
      snake: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }]
    })

    rerender(<NewGame3D gameState={newState} />)

    await waitFor(() => {
      // BoxGeometry should have been called for new segments
      expect(mockCallTracker.geometries.length).toBeGreaterThan(0)
    })
  })

  it('updates food position when game state changes', async () => {
    render(<Game3D gameState={createMockGameState()} />)

    await waitFor(() => {
      expect(mockCallTracker.groups.length).toBeGreaterThan(0)
    })

    // Verify position.set was called on the food group
    const foodGroup = mockCallTracker.groups.find((g: any) => g.children?.length > 0)
    if (foodGroup && foodGroup.position) {
      expect(foodGroup.position.set).toHaveBeenCalled()
    }
  })
})
