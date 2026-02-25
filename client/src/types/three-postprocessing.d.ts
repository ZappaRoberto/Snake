// Type declarations for Three.js post-processing examples
// These modules are bundled with three but lack .d.ts files

declare module 'three/examples/jsm/postprocessing/EffectComposer' {
  import { WebGLRenderer, RenderTarget } from 'three';
  export class EffectComposer {
    constructor(renderer: WebGLRenderer, renderTarget?: RenderTarget);
    render(): void;
    setSize(width: number, height: number): void;
    resetRenderTarget(): void;
    addPass(pass: any): void;
  }
}

declare module 'three/examples/jsm/postprocessing/RenderPass' {
  import { Scene, OrthographicCamera, WebGLRenderer, Camera } from 'three';
  export class RenderPass {
    constructor(scene: Scene, camera: Camera, overrideViewport?: boolean);
    scene: Scene;
    camera: Camera;
    addPass(pass: any): void;
  }
}

declare module 'three/examples/jsm/postprocessing/UnrealBloomPass' {
  import { Vector2, WebGLRenderTarget } from 'three';
  export class UnrealBloomPass {
    constructor(
      resolution: Vector2,
      strength?: number,
      radius?: number,
      threshold?: number
    );
    resolution: Vector2;
    strength: number;
    radius: number;
    threshold: number;
  }
}
