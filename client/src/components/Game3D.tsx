import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { SnakeGameModel, Point, Difficulty } from '../types'

interface Game3DProps {
  gameState: SnakeGameModel | null
}

export function Game3D({ gameState }: Game3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const snakeGroupRef = useRef<THREE.Group | null>(null)
  const foodGroupRef = useRef<THREE.Group | null>(null)
  const particlesRef = useRef<THREE.Points[]>([])

  // Create a pixel art texture pattern for the snake and food
  const createPixelTexture = (color: string, type: 'snake' | 'food'): THREE.CanvasTexture => {
    // Create a small canvas for pixel art (8x8 or 16x16)
    const size = 32
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      // Fallback to simple color texture
      const fallbackCanvas = document.createElement('canvas')
      fallbackCanvas.width = 16
      fallbackCanvas.height = 16
      const fallbackCtx = fallbackCanvas.getContext('2d')
      if (fallbackCtx) {
        fallbackCtx.fillStyle = color
        fallbackCtx.fillRect(0, 0, 16, 16)
        const texture = new THREE.CanvasTexture(fallbackCanvas)
        texture.magFilter = THREE.NearestFilter
        texture.minFilter = THREE.NearestFilter
        return texture
      }
    }

    if (ctx) {
      // Clear canvas with transparency
      ctx.clearRect(0, 0, size, size)

      if (type === 'snake') {
        // Snake body - pixel art square pattern
        const baseColor = color
        const darker = adjustColor(baseColor, -40)
        const lighter = adjustColor(baseColor, 40)

        // Base block (main body)
        ctx.fillStyle = baseColor
        ctx.fillRect(2, 2, size - 4, size - 4)

        // Pixel art detail: slightly darker corners for depth
        ctx.fillStyle = darker
        ctx.fillRect(2, 2, 4, 4) // Top-left corner highlight
        ctx.fillRect(size - 6, 2, 4, 4) // Top-right corner highlight
        ctx.fillRect(2, size - 6, 4, 4) // Bottom-left corner highlight
        ctx.fillRect(size - 6, size - 6, 4, 4) // Bottom-right corner highlight

        // Pixel art detail: lighter center for pop
        ctx.fillStyle = lighter
        ctx.fillRect(size / 2 - 4, size / 2 - 4, 8, 8)

        // Grid lines (pixel edges)
        ctx.strokeStyle = adjustColor(baseColor, -60)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, size / 2)
        ctx.lineTo(size, size / 2)
        ctx.moveTo(size / 2, 0)
        ctx.lineTo(size / 2, size)
        ctx.stroke()

      } else if (type === 'food') {
        // Apple food - pixel art
        const appleColor = '#ff4757'
        const stemColor = '#48bb78'

        // Apple body (circle-ish pixel art)
        ctx.fillStyle = appleColor
        ctx.fillRect(6, 6, 20, 20)

        // Pixel highlights on apple
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(10, 10, 4, 4) // Top-left highlight
        ctx.fillRect(20, 8, 3, 3) // Top-right highlight

        // Apple shadow/detail
        ctx.fillStyle = adjustColor(appleColor, -30)
        ctx.fillRect(12, 20, 6, 4) // Bottom shadow

        // Stem (pixel style)
        ctx.fillStyle = stemColor
        ctx.fillRect(14, 2, 4, 4)
        ctx.fillRect(15, 1, 2, 2)

        // Leaf
        ctx.fillStyle = '#74c0fc'
        ctx.fillRect(16, 1, 8, 3)
        ctx.fillRect(20, 0, 4, 4)
      }

      const texture = new THREE.CanvasTexture(canvas)
      // Use NearestFilter for sharp pixel edges
      texture.magFilter = THREE.NearestFilter
      texture.minFilter = THREE.NearestFilter
      return texture
    }

    // Fallback if canvas creation failed
    const fallbackCanvas = document.createElement('canvas')
    fallbackCanvas.width = 16
    fallbackCanvas.height = 16
    const fallbackCtx = fallbackCanvas.getContext('2d')
    if (fallbackCtx) {
      fallbackCtx.fillStyle = type === 'snake' ? color : '#ff4757'
      fallbackCtx.fillRect(0, 0, 16, 16)
    }
    const texture = new THREE.CanvasTexture(fallbackCanvas)
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    return texture
  }

  // Helper to darken/lighten a hex color
  function adjustColor(color: string, amount: number): string {
    const usePound = color[0] === '#'
    let hex = color.replace('#', '')
    if (hex.length === 3) {
      hex = hex + hex
    }
    if (hex.length !== 6) return usePound ? '#' + hex : hex

    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    const newR = Math.max(0, Math.min(255, r + amount))
    const newG = Math.max(0, Math.min(255, g + amount))
    const newB = Math.max(0, Math.min(255, b + amount))

    return usePound ? '#' : ''
      + ((1 << 24) + (Math.floor(newR) << 16) + (Math.floor(newG) << 8) + Math.floor(newB)).toString(16).slice(1)
  }

  // Expose getSnakePosition for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).getSnakePosition = () => {
        if (snakeGroupRef.current && snakeGroupRef.current.children.length > 0) {
          const head = snakeGroupRef.current.children[0]
          if (head) {
            return { x: head.position.x, y: head.position.z }
          }
        }
        if (gameState?.snake && gameState.snake.length > 0) {
          const gridSize = gameState.grid_size[0] || 20
          return {
            x: gameState.snake[0].y - gridSize / 2 + 0.5,
            y: -(gameState.snake[0].x - gridSize / 2 + 0.5),
          }
        }
        return null
      }
    }
  }, [gameState])

  // Particle system for apple pickup effects - reserved for future use
  // const createParticles = (position: THREE.Vector3, color: number): THREE.Points => {
  //   ... particle implementation ...
  // }

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup - cleaner for pixel art style
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a202c)
    sceneRef.current = scene

    // Camera (isometric view)
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
    const d = 15
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000)
    camera.position.set(20, 20, 20)
    camera.lookAt(scene.position)

    // Renderer with sharp edges (no antialias for pixel art look)
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)

    // Simple lighting - flat look for pixel art
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
    mainLight.position.set(15, 25, 10)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 1024
    mainLight.shadow.mapSize.height = 1024
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 100
    scene.add(mainLight)

    // Grid background (visible grid for pixel art style)
    const gridSize = gameState?.grid_size[0] || 20
    const gridHelper = new THREE.GridHelper(gridSize, gridSize, 0x4a5568, 0x2d3748)
    gridHelper.position.y = -0.5
    scene.add(gridHelper)

    // Checkerboard floor pattern (pixel art style)
    const floorGeometry = new THREE.PlaneGeometry(gridSize + 2, gridSize + 2)
    const floorCanvas = document.createElement('canvas')
    floorCanvas.width = 64
    floorCanvas.height = 64
    const floorCtx = floorCanvas.getContext('2d')
    if (floorCtx) {
      // Checkerboard pattern
      floorCtx.fillStyle = '#1a202c'
      floorCtx.fillRect(0, 0, 64, 64)
      floorCtx.fillStyle = '#2d3748'
      floorCtx.fillRect(0, 0, 32, 32)
      floorCtx.fillRect(32, 32, 32, 32)

      const floorTexture = new THREE.CanvasTexture(floorCanvas)
      floorTexture.wrapS = THREE.RepeatWrapping
      floorTexture.wrapT = THREE.RepeatWrapping
      floorTexture.repeat.set((gridSize + 2) / 4, (gridSize + 2) / 4)
      floorTexture.magFilter = THREE.NearestFilter
      floorTexture.minFilter = THREE.NearestFilter

      const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture })
      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.rotation.x = -Math.PI / 2
      floor.position.y = -0.51
      scene.add(floor)
    } else {
      // Fallback if canvas fails
      const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x1a202c })
      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.rotation.x = -Math.PI / 2
      floor.position.y = -0.51
      scene.add(floor)
    }

    // Snake segments group
    const snakeGroup = new THREE.Group()
    snakeGroupRef.current = snakeGroup
    scene.add(snakeGroup)

    // Food group (apple sprite)
    const foodGroup = new THREE.Group()
    foodGroupRef.current = foodGroup
    scene.add(foodGroup)

    // Resize handler
    const handleResize = () => {
      if (containerRef.current) {
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        camera.left = -d * (containerRef.current.clientWidth / containerRef.current.clientHeight)
        camera.right = d * (containerRef.current.clientWidth / containerRef.current.clientHeight)
        camera.top = d
        camera.bottom = -d
        camera.updateProjectionMatrix()
      }
    }

    window.addEventListener('resize', handleResize)

    // Render loop with animation
    let animationFrameId: number
    let time = 0

    const render = () => {
      time += 0.016

      if (gameState) {
        // Get difficulty for color scheme
        const difficulty = gameState.difficulty || 'medium'

        // Update snake position - clear old meshes
        while (snakeGroup.children.length > 0) {
          snakeGroup.remove(snakeGroup.children[0])
        }

        // Create textures for snake based on difficulty color scheme
        const headColor = getDifficultyColor(difficulty, 'head')
        const bodyColor = getDifficultyColor(difficulty, 'body')

        gameState.snake.forEach((segment: Point, index: number) => {
          // Use BoxGeometry for sharp pixel edges (no smoothing)
          const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95)

          // Create pixel art texture
          const texture = createPixelTexture(
            index === 0 ? headColor : bodyColor,
            'snake'
          )

          const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.7,
            metalness: 0.0,
            flatShading: false, // Smooth shading for subtle depth
          })

          const segmentMesh = new THREE.Mesh(geometry, material)
          segmentMesh.castShadow = true
          segmentMesh.receiveShadow = true

          // Convert grid coordinates to 3D coordinates
          segmentMesh.position.set(segment.y - gridSize / 2 + 0.5, 0, -(segment.x - gridSize / 2 + 0.5))

          snakeGroup.add(segmentMesh)

          // Add eyes to head (simple pixel style)
          if (index === 0) {
            const eyeColor = new THREE.Color(0xffffff)
            const pupilColor = new THREE.Color(0x1a202c)
            const eyeSize = 0.15

            // Determine eye position based on direction
            let eyePositions: { left: THREE.Vector3; right: THREE.Vector3 } = {
              left: new THREE.Vector3(0.2, 0.2, -0.2),
              right: new THREE.Vector3(-0.2, 0.2, -0.2),
            }

            if (gameState.direction === 'DOWN') {
              eyePositions = { left: new THREE.Vector3(0.2, 0.2, 0.2), right: new THREE.Vector3(-0.2, 0.2, 0.2) }
            } else if (gameState.direction === 'LEFT') {
              eyePositions = { left: new THREE.Vector3(0.2, 0.2, -0.2), right: new THREE.Vector3(0.2, 0.2, 0.2) }
            } else if (gameState.direction === 'RIGHT') {
              eyePositions = { left: new THREE.Vector3(-0.2, 0.2, 0.2), right: new THREE.Vector3(-0.2, 0.2, -0.2) }
            }

            // Simple pixel-style eyes (cubes instead of spheres for sharpness)
            const createEye = (position: THREE.Vector3): THREE.Mesh => {
              const eyeGeo = new THREE.BoxGeometry(eyeSize, eyeSize, eyeSize)
              const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor })
              const eye = new THREE.Mesh(eyeGeo, eyeMat)
              eye.position.copy(position)
              return eye
            }

            segmentMesh.add(createEye(eyePositions.left))
            segmentMesh.add(createEye(eyePositions.right))

            // Pupils (smaller cubes)
            const createPupil = (position: THREE.Vector3): THREE.Mesh => {
              const pupilGeo = new THREE.BoxGeometry(eyeSize * 0.5, eyeSize * 0.5, eyeSize * 0.5)
              const pupilMat = new THREE.MeshBasicMaterial({ color: pupilColor })
              const pupil = new THREE.Mesh(pupilGeo, pupilMat)
              pupil.position.copy(position)
              return pupil
            }

            segmentMesh.add(createPupil(eyePositions.left.clone().add(new THREE.Vector3(0, -0.05, 0))))
            segmentMesh.add(createPupil(eyePositions.right.clone().add(new THREE.Vector3(0, -0.05, 0))))

            // Simple pixel nose detail
            const noseGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1)
            const noseMat = new THREE.MeshBasicMaterial({ color: headColor })
            const nose = new THREE.Mesh(noseGeo, noseMat)
            nose.position.set(0, 0.35, 0)
            segmentMesh.add(nose)
          }
        })

        // Update food position
        if (gameState.food) {
          // Clear old food group children
          while (foodGroup.children.length > 0) {
            foodGroup.remove(foodGroup.children[0])
          }

          // Create apple sprite using pixel art texture
          const appleCanvas = document.createElement('canvas')
          appleCanvas.width = 32
          appleCanvas.height = 32
          const appleCtx = appleCanvas.getContext('2d')

          if (appleCtx) {
            // Apple body
            appleCtx.fillStyle = '#ff4757'
            appleCtx.fillRect(6, 8, 20, 18)

            // Highlights
            appleCtx.fillStyle = '#ffffff'
            appleCtx.fillRect(10, 10, 4, 4)
            appleCtx.fillRect(22, 9, 3, 3)

            // Stem
            appleCtx.fillStyle = '#48bb78'
            appleCtx.fillRect(14, 4, 4, 4)

            // Leaf
            appleCtx.fillStyle = '#74c0fc'
            appleCtx.fillRect(16, 2, 8, 3)
          }

          const appleTexture = new THREE.CanvasTexture(appleCanvas)
          appleTexture.magFilter = THREE.NearestFilter
          appleTexture.minFilter = THREE.NearestFilter

          // Apple fruit - pixel art box with texture
          const appleGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8)
          const appleMat = new THREE.MeshStandardMaterial({
            map: appleTexture,
            roughness: 0.5,
            metalness: 0.1,
          })
          const apple = new THREE.Mesh(appleGeo, appleMat)
          apple.castShadow = true
          foodGroup.add(apple)

          // Gentle bobbing animation for food (subtle for pixel art style)
          foodGroup.position.set(gameState.food.y - gridSize / 2 + 0.5, Math.sin(time * 1.5) * 0.08, -(gameState.food.x - gridSize / 2 + 0.5))
        }
      }

      // Update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const particles = particlesRef.current[i]
        const userData = particles.userData

        if (!userData) continue

        userData.lifetime -= 0.03

        if (userData.lifetime <= 0) {
          scene.remove(particles)
          particlesRef.current.splice(i, 1)
          continue
        }

        const positions = particles.geometry.attributes.position.array
        for (let j = 0; j < positions.length / 3; j++) {
          // Simple particle spread
          positions[j * 3] += (Math.random() - 0.5) * 0.1
          positions[j * 3 + 1] += (Math.random() - 0.5) * 0.1
          positions[j * 3 + 2] += (Math.random() - 0.5) * 0.1
        }
        particles.geometry.attributes.position.needsUpdate = true
        // @ts-expect-error - opacity exists on PointsMaterial but type is Material | Material[]
        particles.material.opacity = userData.lifetime
      }

      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)

      // Cleanup particles
      particlesRef.current.forEach(p => scene.remove(p))

      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [gameState])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        aspectRatio: '1/1',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#1a202c',
      }}
    />
  )
}

// Helper function to get difficulty-specific colors
function getDifficultyColor(difficulty: Difficulty, part: 'head' | 'body'): string {
  switch (difficulty) {
    case 'easy':
      return part === 'head' ? '#48bb78' : '#9ae6b4'
    case 'medium':
      return part === 'head' ? '#2f855a' : '#38a169'
    case 'hard':
      return part === 'head' ? '#e53e3e' : '#fc8181'
  }
}
