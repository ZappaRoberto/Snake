import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { SnakeGameModel, Point } from '../types'

interface Game3DProps {
  gameState: SnakeGameModel | null
}

export function Game3D({ gameState }: Game3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const snakeGroupRef = useRef<THREE.Group | null>(null)
  const foodGroupRef = useRef<THREE.Group | null>(null)
  const particlesRef = useRef<THREE.Points[]>([])

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

  // Create particle system for apple pickup effects
  const createParticles = (position: THREE.Vector3, color: number): THREE.Points => {
    const particleCount = 15
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const velocities: THREE.Vector3[] = []

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x
      positions[i * 3 + 1] = position.y
      positions[i * 3 + 2] = position.z

      const angle = Math.random() * Math.PI * 2
      const speed = 0.05 + Math.random() * 0.1
      velocities.push(
        new THREE.Vector3(
          Math.cos(angle) * speed,
          (Math.random() - 0.5) * speed * 0.5,
          Math.sin(angle) * speed
        )
      )

      const particleColor = new THREE.Color(color)
      particleColor.multiplyScalar(0.8 + Math.random() * 0.4)
      colors[i * 3] = particleColor.r
      colors[i * 3 + 1] = particleColor.g
      colors[i * 3 + 2] = particleColor.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    points.userData = { velocities, lifetime: 1.0 }
    return points
  }

  // Spawn particle explosion when apple is eaten
  const spawnAppleParticles = (position: THREE.Vector3) => {
    if (!sceneRef.current) return

    const particles = createParticles(position, 0xff4757)
    sceneRef.current.add(particles)
    particlesRef.current.push(particles)
  }

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a202c)
    scene.fog = new THREE.FogExp2(0x1a202c, 0.02)
    sceneRef.current = scene

    // Camera (isometric view)
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
    const d = 15
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000)
    camera.position.set(20, 20, 20)
    camera.lookAt(scene.position)

    // Renderer with shadow mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)

    // Enhanced lighting with multiple sources
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Main directional light (sun-like)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1)
    mainLight.position.set(15, 25, 10)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 100
    mainLight.shadow.bias = -0.0001
    scene.add(mainLight)

    // Fill light (softer)
    const fillLight = new THREE.DirectionalLight(0xaec6cf, 0.4)
    fillLight.position.set(-10, 15, -10)
    scene.add(fillLight)

    // Rim light (for outline effect)
    const rimLight = new THREE.DirectionalLight(0x74b9ff, 0.3)
    rimLight.position.set(0, 10, -20)
    scene.add(rimLight)

    // Grid with subtle glow
    const gridSize = gameState?.grid_size[0] || 20
    const gridHelper = new THREE.GridHelper(gridSize * 1, gridSize, 0x4a5568, 0x2d3748)
    gridHelper.position.y = -0.5
    scene.add(gridHelper)

    // Floor plane for shadows
    const floorGeometry = new THREE.PlaneGeometry(gridSize + 4, gridSize + 4)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      roughness: 0.8,
      metalness: 0.2,
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.51
    floor.receiveShadow = true
    scene.add(floor)

    // Snake segments group
    const snakeGroup = new THREE.Group()
    snakeGroupRef.current = snakeGroup
    scene.add(snakeGroup)

    // Food group (apple with stem and leaf)
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
        // Update snake position
        while (snakeGroup.children.length > 0) {
          snakeGroup.remove(snakeGroup.children[0])
        }

        // Create gradient colors for snake body
        const headColor = new THREE.Color(0x2f855a) // Darker emerald
        const bodyStartColor = new THREE.Color(0x48bb78)
        const bodyEndColor = new THREE.Color(0x9ae6b4)

        gameState.snake.forEach((segment: Point, index: number) => {
          // Use CylinderGeometry for high-poly smooth look
          const radius = 0.35
          const height = 0.7
          const segments = 16 // High segment count for smooth cylinders

          const geometry = new THREE.CylinderGeometry(radius, radius, height, segments)
          const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
            roughness: 0.4,
            metalness: 0.1,
            flatShading: false,
          })

          // Gradient coloring: head is darker, tail is lighter
          if (index === 0) {
            material.color = headColor.clone()
            material.emissive = new THREE.Color(0x2f855a)
            material.emissiveIntensity = 0.2
          } else {
            const t = index / gameState.snake.length
            const color = bodyStartColor.clone().lerp(bodyEndColor, Math.min(t * 1.5, 1))
            material.color = color
            // Add slight emissive to front segments
            if (t < 0.3) {
              material.emissive = new THREE.Color(0x2f855a)
              material.emissiveIntensity = 0.1 * (0.3 - t) * 3
            }
          }

          const segmentMesh = new THREE.Mesh(geometry, material)
          segmentMesh.castShadow = true
          segmentMesh.receiveShadow = true

          // Convert grid coordinates to 3D coordinates
          segmentMesh.position.set(segment.y - gridSize / 2 + 0.5, 0, -(segment.x - gridSize / 2 + 0.5))

          // Rotate cylinder based on segment position (except head)
          if (index > 0) {
            const prevSegment = gameState.snake[index - 1]
            const dx = prevSegment.x - segment.x
            const dy = prevSegment.y - segment.y

            if (dx !== 0 || dy !== 0) {
              // Calculate rotation to align cylinder with movement direction
              if (dy > 0) segmentMesh.rotation.y = Math.PI / 2
              else if (dy < 0) segmentMesh.rotation.y = -Math.PI / 2
              else if (dx > 0) segmentMesh.rotation.z = Math.PI / 2
              else if (dx < 0) segmentMesh.rotation.z = -Math.PI / 2
            }
          }

          snakeGroup.add(segmentMesh)

          // Add eyes to head
          if (index === 0) {
            const eyeColor = new THREE.Color(0xffffff)
            const pupilColor = new THREE.Color(0x1a202c)
            const eyeRadius = 0.1
            const eyeOffset = 0.15

            // Determine eye position based on direction
            let eyePositions: { left: THREE.Vector3; right: THREE.Vector3 } = {
              left: new THREE.Vector3(eyeOffset, 0.2, -eyeOffset),
              right: new THREE.Vector3(-eyeOffset, 0.2, -eyeOffset),
            }

            if (gameState.direction === 'DOWN') {
              eyePositions = { left: new THREE.Vector3(eyeOffset, 0.2, eyeOffset), right: new THREE.Vector3(-eyeOffset, 0.2, eyeOffset) }
            } else if (gameState.direction === 'LEFT') {
              eyePositions = { left: new THREE.Vector3(eyeOffset, 0.2, -eyeOffset), right: new THREE.Vector3(eyeOffset, 0.2, eyeOffset) }
            } else if (gameState.direction === 'RIGHT') {
              eyePositions = { left: new THREE.Vector3(-eyeOffset, 0.2, eyeOffset), right: new THREE.Vector3(-eyeOffset, 0.2, -eyeOffset) }
            }

            // Left eye
            const leftEyeGeo = new THREE.SphereGeometry(eyeRadius, 8, 8)
            const leftEyeMat = new THREE.MeshStandardMaterial({ color: eyeColor })
            const leftEye = new THREE.Mesh(leftEyeGeo, leftEyeMat)
            leftEye.position.copy(eyePositions.left)
            segmentMesh.add(leftEye)

            // Left pupil
            const leftPupilGeo = new THREE.SphereGeometry(eyeRadius * 0.5, 8, 8)
            const leftPupilMat = new THREE.MeshStandardMaterial({ color: pupilColor })
            const leftPupil = new THREE.Mesh(leftPupilGeo, leftPupilMat)
            leftPupil.position.copy(eyePositions.left).add(new THREE.Vector3(0, -0.04, 0))
            segmentMesh.add(leftPupil)

            // Right eye
            const rightEyeGeo = new THREE.SphereGeometry(eyeRadius, 8, 8)
            const rightEyeMat = new THREE.MeshStandardMaterial({ color: eyeColor })
            const rightEye = new THREE.Mesh(rightEyeGeo, rightEyeMat)
            rightEye.position.copy(eyePositions.right)
            segmentMesh.add(rightEye)

            // Right pupil
            const rightPupilGeo = new THREE.SphereGeometry(eyeRadius * 0.5, 8, 8)
            const rightPupilMat = new THREE.MeshStandardMaterial({ color: pupilColor })
            const rightPupil = new THREE.Mesh(rightPupilGeo, rightPupilMat)
            rightPupil.position.copy(eyePositions.right).add(new THREE.Vector3(0, -0.04, 0))
            segmentMesh.add(rightPupil)

            // Add a small nose/brain detail
            const brainGeo = new THREE.SphereGeometry(0.12, 8, 8)
            const brainMat = new THREE.MeshStandardMaterial({ color: 0x2f855a })
            const brain = new THREE.Mesh(brainGeo, brainMat)
            brain.position.set(0, 0.35, 0)
            segmentMesh.add(brain)
          }
        })

        // Update food position
        if (gameState.food) {
          const appleColor = new THREE.Color(0xff4757)
          const stemColor = new THREE.Color(0x2f855a)
          const leafColor = new THREE.Color(0x48bb78)

          // Clear old food group children
          while (foodGroup.children.length > 0) {
            foodGroup.remove(foodGroup.children[0])
          }

          // Apple fruit - high detail sphere
          const appleGeo = new THREE.SphereGeometry(0.35, 32, 32)
          const appleMat = new THREE.MeshStandardMaterial({
            color: appleColor,
            roughness: 0.3,
            metalness: 0.1,
          })
          const apple = new THREE.Mesh(appleGeo, appleMat)
          apple.castShadow = true
          foodGroup.add(apple)

          // Gentle rotation animation for apple
          apple.rotation.y += 0.02

          // Apple shine/sparkle effect
          const sparkleGeo = new THREE.SphereGeometry(0.05, 8, 8)
          const sparkleMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5,
          })
          const sparkle = new THREE.Mesh(sparkleGeo, sparkleMat)
          sparkle.position.set(0.1, 0.2, 0.1)
          apple.add(sparkle)

          // Stem
          const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8)
          const stemMat = new THREE.MeshStandardMaterial({ color: stemColor })
          const stem = new THREE.Mesh(stemGeo, stemMat)
          stem.position.set(0, 0.45, 0)
          apple.add(stem)

          // Leaf
          const leafGeo = new THREE.TorusGeometry(0.12, 0.03, 8, 16, Math.PI * 0.7)
          const leafMat = new THREE.MeshStandardMaterial({ color: leafColor })
          const leaf = new THREE.Mesh(leafGeo, leafMat)
          leaf.position.set(0.05, 0.52, 0.05)
          leaf.rotation.x = -Math.PI / 4
          leaf.rotation.z = Math.PI / 8
          apple.add(leaf)

          // Food position update
          foodGroup.position.set(gameState.food.y - gridSize / 2 + 0.5, 0, -(gameState.food.x - gridSize / 2 + 0.5))

          // Bobbing animation for food
          foodGroup.position.y = Math.sin(time * 2) * 0.1

          // Check if apple was eaten (from gameState changes)
          // We can't detect "just eaten" here, so we rely on external detection
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
        const velocities = userData.velocities as THREE.Vector3[]

        for (let j = 0; j < velocities.length; j++) {
          positions[j * 3] += velocities[j].x
          positions[j * 3 + 1] += velocities[j].y
          positions[j * 3 + 2] += velocities[j].z
        }
        particles.geometry.attributes.position.needsUpdate = true
        particles.material.opacity = userData.lifetime
      }

      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    // Handle apple pickup effect - detect when food position changes unexpectedly
    let lastFoodPosition: string | null = null
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
      style={{ width: '100%', height: '500px', borderRadius: '8px', overflow: 'hidden' }}
    />
  )
}
