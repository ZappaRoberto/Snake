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

  // Expose getSnakePosition for testing - uses the latest snakeGroup via ref
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).getSnakePosition = () => {
        if (snakeGroupRef.current && snakeGroupRef.current.children.length > 0) {
          const head = snakeGroupRef.current.children[0]
          if (head) {
            return { x: head.position.x, y: head.position.z }
          }
        }
        // Fallback to gameState data
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

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a202c)
    sceneRef.current = scene

    // Camera (isometric view)
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
    const d = 15
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000)
    camera.position.set(20, 20, 20)
    camera.lookAt(scene.position)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 5)
    scene.add(directionalLight)

    // Grid
    const gridSize = gameState?.grid_size[0] || 20
    const gridHelper = new THREE.GridHelper(gridSize * 1, gridSize)
    scene.add(gridHelper)

    // Snake segments
    const snakeGroup = new THREE.Group()
    snakeGroupRef.current = snakeGroup
    scene.add(snakeGroup)

    // Food object
    const foodGeometry = new THREE.SphereGeometry(0.4, 16, 16)
    const foodMaterial = new THREE.MeshStandardMaterial({ color: 0xff4757 })
    const food = new THREE.Mesh(foodGeometry, foodMaterial)
    scene.add(food)

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

    // Render loop
    let animationFrameId: number

    const render = () => {
      if (gameState) {
        // Update snake position
        while (snakeGroup.children.length > 0) {
          snakeGroup.remove(snakeGroup.children[0])
        }

        gameState.snake.forEach((segment: Point) => {
          const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9)
          const material = new THREE.MeshStandardMaterial({ color: 0x48bb78 })
          const segmentMesh = new THREE.Mesh(geometry, material)
          // Convert grid coordinates to 3D coordinates
          // Y maps directly to Z so ArrowUp (decreasing y) moves snake upward visually
          segmentMesh.position.set(segment.y - gridSize / 2 + 0.5, 0, -(segment.x - gridSize / 2 + 0.5))
          snakeGroup.add(segmentMesh)
        })

        // Update food position
        if (gameState.food) {
          // Y maps directly to Z so ArrowUp (decreasing y) moves food upward visually
          food.position.set(gameState.food.y - gridSize / 2 + 0.5, 0, -(gameState.food.x - gridSize / 2 + 0.5))
        }
      }

      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
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
