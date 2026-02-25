import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import type { SnakeGameModel, Point } from '../types'
import { BLOOM_SETTINGS, DIFFICULTY_COLORS } from '../types/theme'

interface Game3DProps {
  gameState: SnakeGameModel | null
}

export function Game3D({ gameState }: Game3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const snakeGroupRef = useRef<THREE.Group | null>(null)
  const foodGroupRef = useRef<THREE.Group | null>(null)
  const composerRef = useRef<EffectComposer | null>(null)
  const lastFoodPositionRef = useRef<THREE.Vector3 | null>(null)

  // Create a pixel art texture pattern for the snake and food
  const createPixelTexture = useCallback((color: string, type: 'snake' | 'food'): THREE.CanvasTexture => {
    const size = 32
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (!ctx) {
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
      ctx.clearRect(0, 0, size, size)

      if (type === 'snake') {
        const baseColor = color
        const darker = adjustColor(baseColor, -40)
        const lighter = adjustColor(baseColor, 40)

        // Base block
        ctx.fillStyle = baseColor
        ctx.fillRect(2, 2, size - 4, size - 4)

        // Darker corners for depth
        ctx.fillStyle = darker
        ctx.fillRect(2, 2, 4, 4)
        ctx.fillRect(size - 6, 2, 4, 4)
        ctx.fillRect(2, size - 6, 4, 4)
        ctx.fillRect(size - 6, size - 6, 4, 4)

        // Lighter center for pop
        ctx.fillStyle = lighter
        ctx.fillRect(size / 2 - 4, size / 2 - 4, 8, 8)

        // Grid lines
        ctx.strokeStyle = adjustColor(baseColor, -60)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, size / 2)
        ctx.lineTo(size, size / 2)
        ctx.moveTo(size / 2, 0)
        ctx.lineTo(size / 2, size)
        ctx.stroke()

      } else if (type === 'food') {
        const appleColor = '#ef4444'
        const stemColor = '#22c55e'

        // Apple body
        ctx.fillStyle = appleColor
        ctx.fillRect(6, 6, 20, 20)

        // Pixel highlights on apple (glowing effect)
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = 0.8
        ctx.fillRect(10, 10, 4, 4)
        ctx.fillRect(20, 8, 3, 3)
        ctx.globalAlpha = 1.0

        // Apple shadow/detail
        ctx.fillStyle = adjustColor(appleColor, -30)
        ctx.fillRect(12, 20, 6, 4)

        // Stem (pixel style)
        ctx.fillStyle = stemColor
        ctx.fillRect(14, 2, 4, 4)
        ctx.fillRect(15, 1, 2, 2)

        // Leaf
        ctx.fillStyle = '#34d399'
        ctx.fillRect(16, 1, 8, 3)
        ctx.fillRect(20, 0, 4, 4)
      }

      const texture = new THREE.CanvasTexture(canvas)
      texture.magFilter = THREE.NearestFilter
      texture.minFilter = THREE.NearestFilter
      return texture
    }

    const fallbackCanvas = document.createElement('canvas')
    fallbackCanvas.width = 16
    fallbackCanvas.height = 16
    const fallbackCtx = fallbackCanvas.getContext('2d')
    if (fallbackCtx) {
      fallbackCtx.fillStyle = type === 'snake' ? color : '#ef4444'
      fallbackCtx.fillRect(0, 0, 16, 16)
    }
    const texture = new THREE.CanvasTexture(fallbackCanvas)
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    return texture
  }, [])

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

  // Create particle burst effect for apple pickup
  const createParticleBurst = useCallback((position: THREE.Vector3, color: string) => {
    if (!sceneRef.current) return

    const particleCount = 15
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    const particleColor = new THREE.Color(color)

    for (let i = 0; i < particleCount; i++) {
      // Random spread from center
      positions[i * 3] = position.x + (Math.random() - 0.5) * 1.5
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 1.5
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 1.5

      // Color variation
      const colorVariation = particleColor.clone().offsetHSL((Math.random() - 0.5) * 0.2, 0, 0)
      colors[i * 3] = colorVariation.r
      colors[i * 3 + 1] = colorVariation.g
      colors[i * 3 + 2] = colorVariation.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(geometry, material)
    particles.userData = {
      type: 'particles',
      lifetime: 0.8,
      decay: 0.03,
    }

    sceneRef.current.add(particles)

    // Store in a way we can update later
    if (!sceneRef.current.userData.particleSystems) {
      sceneRef.current.userData.particleSystems = [] as THREE.Points[]
    }
    sceneRef.current.userData.particleSystems.push(particles)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f172a)
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

    // ===== ENHANCED LIGHTING SETUP =====
    // Softer ambient light with subtle warm tint
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    // Warm fill light for balance
    const fillLight = new THREE.DirectionalLight(0xffd700, 0.3)
    fillLight.position.set(-15, 15, -10)
    scene.add(fillLight)

    // Directional main light with better color temperature
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.6)
    mainLight.position.set(15, 25, 10)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 100
    scene.add(mainLight)

    // Rim/edge lighting for depth (blue-ish tint)
    const rimLight = new THREE.DirectionalLight(0x3b82f6, 0.4)
    rimLight.position.set(-15, -5, -15)
    scene.add(rimLight)

    // ===== BLOOM POST-PROCESSING SETUP =====
    const renderScene = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85)

    // Adjust bloom settings for pixel art style (subtle glow)
    bloomPass.threshold = BLOOM_SETTINGS.threshold
    bloomPass.strength = BLOOM_SETTINGS.intensity
    bloomPass.radius = BLOOM_SETTINGS.radius

    const composer = new EffectComposer(renderer)
    composer.addPass(renderScene)
    composer.addPass(bloomPass)
    composerRef.current = composer

    // Grid background (visible grid for pixel art style)
    const gridSize = gameState?.grid_size[0] || 20
    const gridHelper = new THREE.GridHelper(gridSize, gridSize, 0x4a5568, 0x2d3748)
    gridHelper.position.y = -0.5
    scene.add(gridHelper)

    // Checkerboard floor pattern with subtle gradient effect
    const floorGeometry = new THREE.PlaneGeometry(gridSize + 2, gridSize + 2)
    const floorCanvas = document.createElement('canvas')
    floorCanvas.width = 128
    floorCanvas.height = 128
    const floorCtx = floorCanvas.getContext('2d')

    if (floorCtx) {
      // Base background
      floorCtx.fillStyle = '#0f172a'
      floorCtx.fillRect(0, 0, 128, 128)

      // Checkerboard pattern with subtle depth
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          if ((x + y) % 2 === 0) {
            floorCtx.fillStyle = '#1e293b'
            floorCtx.fillRect(x * 32, y * 32, 32, 32)
            // Add subtle gradient to tiles
            const grad = floorCtx.createLinearGradient(x * 32, y * 32, x * 32 + 32, y * 32 + 32)
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.03)')
            grad.addColorStop(1, 'rgba(0, 0, 0, 0.03)')
            floorCtx.fillStyle = grad
            floorCtx.fillRect(x * 32 + 4, y * 32 + 4, 24, 24)
          }
        }
      }

      const floorTexture = new THREE.CanvasTexture(floorCanvas)
      floorTexture.wrapS = THREE.RepeatWrapping
      floorTexture.wrapT = THREE.RepeatWrapping
      floorTexture.repeat.set((gridSize + 2) / 8, (gridSize + 2) / 8)
      floorTexture.magFilter = THREE.NearestFilter
      floorTexture.minFilter = THREE.NearestFilter

      const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture })
      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.rotation.x = -Math.PI / 2
      floor.position.y = -0.51
      scene.add(floor)
    } else {
      const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x0f172a })
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
        composer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)

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
        const colors = DIFFICULTY_COLORS[difficulty]

        // Update snake position - clear old meshes
        while (snakeGroup.children.length > 0) {
          snakeGroup.remove(snakeGroup.children[0])
        }

        gameState.snake.forEach((segment: Point, index: number) => {
          const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95)

          // Create pixel art texture
          const texture = createPixelTexture(
            index === 0 ? colors.head : colors.body,
            'snake'
          )

          const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.6,
            metalness: 0.1,
            flatShading: false,
          })

          // Make head glow with emissive for bloom effect
          if (index === 0) {
            material.emissive = new THREE.Color(colors.head)
            material.emissiveIntensity = 0.3
          }

          const segmentMesh = new THREE.Mesh(geometry, material)
          segmentMesh.castShadow = true
          segmentMesh.receiveShadow = true

          // Convert grid coordinates to 3D coordinates
          segmentMesh.position.set(segment.y - gridSize / 2 + 0.5, 0, -(segment.x - gridSize / 2 + 0.5))

          snakeGroup.add(segmentMesh)

          // Add eyes to head (simple pixel style)
          if (index === 0) {
            const eyeColor = new THREE.Color(0xffffff)
            const pupilColor = new THREE.Color(0x1e293b)
            const eyeSize = 0.15

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
            const noseMat = new THREE.MeshBasicMaterial({ color: colors.head })
            const nose = new THREE.Mesh(noseGeo, noseMat)
            nose.position.set(0, 0.35, 0)
            segmentMesh.add(nose)
          }
        })

        // Update food position
        if (gameState.food) {
          while (foodGroup.children.length > 0) {
            foodGroup.remove(foodGroup.children[0])
          }

          const appleCanvas = document.createElement('canvas')
          appleCanvas.width = 32
          appleCanvas.height = 32
          const appleCtx = appleCanvas.getContext('2d')

          if (appleCtx) {
            appleCtx.fillStyle = '#ef4444'
            appleCtx.fillRect(6, 8, 20, 18)

            // Highlights with glow effect
            appleCtx.fillStyle = '#ffffff'
            appleCtx.globalAlpha = 0.9
            appleCtx.fillRect(10, 10, 4, 4)
            appleCtx.fillRect(22, 9, 3, 3)
            appleCtx.globalAlpha = 1.0

            appleCtx.fillStyle = '#22c55e'
            appleCtx.fillRect(14, 4, 4, 4)

            appleCtx.fillStyle = '#34d399'
            appleCtx.fillRect(16, 2, 8, 3)
          }

          const appleTexture = new THREE.CanvasTexture(appleCanvas)
          appleTexture.magFilter = THREE.NearestFilter
          appleTexture.minFilter = THREE.NearestFilter

          // Apple fruit - pixel art box with texture and emissive for bloom
          const appleGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8)
          const appleMat = new THREE.MeshStandardMaterial({
            map: appleTexture,
            roughness: 0.5,
            metalness: 0.1,
            emissive: new THREE.Color('#ef4444'),
            emissiveIntensity: 0.5,
          })
          const apple = new THREE.Mesh(appleGeo, appleMat)
          apple.castShadow = true
          foodGroup.add(apple)

          // Gentle bobbing animation for food
          foodGroup.position.set(gameState.food.y - gridSize / 2 + 0.5, Math.sin(time * 1.5) * 0.1, -(gameState.food.x - gridSize / 2 + 0.5))

          // Check if apple position changed (new pickup)
          const currentFoodPos = new THREE.Vector3(
            gameState.food.y - gridSize / 2 + 0.5,
            Math.sin(time * 1.5) * 0.1,
            -(gameState.food.x - gridSize / 2 + 0.5)
          )

          if (lastFoodPositionRef.current) {
            const distance = currentFoodPos.distanceTo(lastFoodPositionRef.current)
            // If apple moved significantly, trigger particle burst
            if (distance > 1.0 && gameState.snake.length > 0) {
              createParticleBurst(currentFoodPos, '#ef4444')
            }
          }

          lastFoodPositionRef.current = currentFoodPos
        }
      }

      // Update and remove expired particles
      if (scene.userData.particleSystems) {
        for (let i = scene.userData.particleSystems.length - 1; i >= 0; i--) {
          const particles = scene.userData.particleSystems[i]
          const userData = particles.userData as { lifetime: number; decay: number }

          userData.lifetime -= userData.decay

          if (userData.lifetime <= 0) {
            scene.remove(particles)
            particles.geometry.dispose()
            particles.material.dispose()
            scene.userData.particleSystems.splice(i, 1)
            continue
          }

          const positions = particles.geometry.attributes.position.array as Float32Array
          for (let j = 0; j < positions.length / 3; j++) {
            // Spread particles outward with gravity
            positions[j * 3] += (Math.random() - 0.5) * 0.15
            positions[j * 3 + 1] += 0.08 * userData.lifetime
            positions[j * 3 + 2] += (Math.random() - 0.5) * 0.15
          }
          particles.geometry.attributes.position.needsUpdate = true

          particles.material.opacity = Math.max(0, userData.lifetime)
        }
      }

      // Use composer for bloom post-processing instead of direct renderer
      if (composerRef.current) {
        composerRef.current.render()
      } else {
        renderer.render(scene, camera)
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)

      // Cleanup particles
      if (scene.userData.particleSystems) {
        scene.userData.particleSystems.forEach((p: THREE.Points) => {
          scene.remove(p)
          p.geometry.dispose()
          if (Array.isArray(p.material)) {
            p.material.forEach(m => m.dispose())
          } else {
            p.material.dispose()
          }
        })
      }

      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [gameState, createPixelTexture, createParticleBurst])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        aspectRatio: '1/1',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
      }}
    />
  )
}
