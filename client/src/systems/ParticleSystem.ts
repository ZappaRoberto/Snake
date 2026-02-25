import * as THREE from 'three';

/**
 * Particle configuration for particle effects.
 */
interface ParticleConfig {
  count: number;
  size: number;
  speed: number;
  lifetime: number;
  color: THREE.Color;
}

/**
 * Individual particle system that manages a burst of particles.
 */
export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: THREE.Points | null = null;
  private config: ParticleConfig;
  private lifetime: number = 0;
  private readonly maxLifetime: number;
  private velocityBuffer: Float32Array | null = null;

  /**
   * Create a new particle system.
   *
   * @param scene - The Three.js scene to add particles to
   * @param position - The origin position of the particle burst
   * @param config - Particle configuration settings
   */
  constructor(scene: THREE.Scene, position: THREE.Vector3, config: ParticleConfig) {
    this.scene = scene;
    this.config = config;
    this.maxLifetime = config.lifetime;

    // Create particle geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(config.count * 3);
    const colors = new Float32Array(config.count * 3);

    for (let i = 0; i < config.count; i++) {
      // Random position spread from center
      const spread = 0.5;
      positions[i * 3] = position.x + (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * spread;

      // Store initial color
      colors[i * 3] = config.color.r;
      colors[i * 3 + 1] = config.color.g;
      colors[i * 3 + 2] = config.color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create particle material (additive blending for glowing effect)
    const material = new THREE.PointsMaterial({
      size: config.size,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, material);
    this.particles.userData = { type: 'particles' };

    // Store velocity buffer for animation
    const velocities = new Float32Array(config.count * 3);
    for (let i = 0; i < config.count; i++) {
      velocities[i * 3] = (Math.random() - 0.5) * config.speed;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * config.speed;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * config.speed;
    }
    this.velocityBuffer = velocities;

    this.scene.add(this.particles);
  }

  /**
   * Update particles for one frame.
   *
   * @param delta - Time delta since last frame
   * @returns true if still active, false when expired
   */
  update(delta: number): boolean {
    this.lifetime -= delta;

    if (this.lifetime <= 0 || !this.particles) {
      return false;
    }

    // Update positions
    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    const velocities = this.velocityBuffer!;

    for (let i = 0; i < this.config.count; i++) {
      // Update position based on velocity
      positions[i * 3] += velocities[i * 3] * delta * 10;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 10;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 10;

      // Gravity effect
      positions[i * 3 + 1] -= 5 * delta * delta;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;

    // Fade out based on remaining lifetime
    const opacity = Math.max(0, this.lifetime / this.maxLifetime);
    if (Array.isArray(this.particles.material)) {
      this.particles.material.forEach(m => 'opacity' in m && (m.opacity = opacity));
    } else {
      this.particles.material.opacity = opacity;
    }

    return true;
  }

  /**
   * Remove particles from scene.
   */
  dispose(): void {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      if (Array.isArray(this.particles.material)) {
        this.particles.material.forEach(m => m.dispose());
      } else {
        this.particles.material.dispose();
      }
      this.particles = null;
    }
  }

  /**
   * Get the current lifetime as a percentage.
   */
  getLifetimePercentage(): number {
    return (this.lifetime / this.maxLifetime) * 100;
  }
}

/**
 * Particle system manager for handling multiple concurrent particle bursts.
 */
export class ParticleSystemManager {
  private scene: THREE.Scene;
  private systems: ParticleSystem[] = [];

  /**
   * Create a new particle system manager.
   *
   * @param scene - The Three.js scene to manage particles in
   */
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Create a burst of particles at the given position.
   *
   * @param position - The center position for the particle burst
   * @param color - Color of the particles (can be hex string or Three.js Color)
   * @returns The created ParticleSystem instance
   */
  createBurst(position: THREE.Vector3, color: string | THREE.Color): ParticleSystem {
    const config: ParticleConfig = {
      count: 20,
      size: 0.15,
      speed: 8,
      lifetime: 0.5,
      color: typeof color === 'string' ? new THREE.Color(color) : color,
    };

    const system = new ParticleSystem(this.scene, position, config);
    this.systems.push(system);

    return system;
  }

  /**
   * Update all active particle systems.
   *
   * @param delta - Time delta since last frame
   */
  update(delta: number): void {
    for (let i = this.systems.length - 1; i >= 0; i--) {
      const system = this.systems[i];
      if (!system.update(delta)) {
        system.dispose();
        this.systems.splice(i, 1);
      }
    }
  }

  /**
   * Clean up all particle systems and dispose resources.
   */
  dispose(): void {
    for (const system of this.systems) {
      system.dispose();
    }
    this.systems = [];
  }

  /**
   * Get count of active particle systems.
   */
  getActiveCount(): number {
    return this.systems.length;
  }
}
