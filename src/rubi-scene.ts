import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type RubiScene = {
  setProgress(progress: number): void;
  setActive(active: boolean): void;
  resize(): void;
  dispose(): void;
};

type Pose = {
  progress: number;
  turn: number;
  distance: number;
  targetY: number;
  elevation: number;
  opening: number;
};

// Distances are relative to the closed bottle, normalized to a height of 3.
// Moving the actual exported cap also lifts its attached stem and applicator.
const poses: Pose[] = [
  { progress: 0, turn: -.30, distance: 6.25, targetY: 1.48, elevation: .28, opening: 0 },
  { progress: .12, turn: -.12, distance: 6.05, targetY: 1.50, elevation: .26, opening: 0 },
  { progress: .30, turn: .44, distance: 3.85, targetY: 2.42, elevation: .22, opening: 0 },
  { progress: .40, turn: .62, distance: 3.85, targetY: 2.42, elevation: .22, opening: 0 },
  { progress: .56, turn: -.40, distance: 3.75, targetY: 1.15, elevation: .12, opening: 0 },
  { progress: .64, turn: -.20, distance: 4.30, targetY: 1.22, elevation: .18, opening: 0 },
  { progress: .72, turn: .10, distance: 7.20, targetY: 1.80, elevation: .25, opening: 0 },
  { progress: .82, turn: .38, distance: 10.80, targetY: 2.68, elevation: .32, opening: 2.28 },
  { progress: 1, turn: -.25, distance: 10.95, targetY: 2.69, elevation: .35, opening: 2.28 },
];

const smooth = (value: number) => value * value * (3 - 2 * value);

/** A real Blender product asset. Rendering only runs when the visible pose changes. */
export async function createRubiScene(canvas: HTMLCanvasElement, signal: AbortSignal): Promise<RubiScene> {
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const scene = new THREE.Scene();
  // Three's transparent transmission pass clears to white. A paper-colored
  // background gives the real glass shell the same backdrop as this section,
  // avoiding an opaque white rim where no product sits behind the glass.
  scene.background = new THREE.Color(0xf2eae3);
  const camera = new THREE.PerspectiveCamera(32, 1, .05, 80);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .92;
  renderer.transmissionResolutionScale = innerWidth <= 800 ? .65 : .85;
  renderer.setClearColor(0xf2eae3, 1);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));

  const turntable = new THREE.Group();
  const normalized = new THREE.Group();
  turntable.add(normalized);
  scene.add(turntable);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6d6660, .28));
  const key = new THREE.DirectionalLight(0xfff8f0, 1.35);
  key.position.set(-4, 6, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xecf1ff, .55);
  fill.position.set(4, 2, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.5);
  rim.position.set(1, 4, -4);
  scene.add(rim);

  let model: THREE.Group | undefined;
  let environment: THREE.WebGLRenderTarget | undefined;
  let cap: THREE.Object3D | undefined;
  let capStart = new THREE.Vector3();
  let normalizedScale = 1;
  let currentProgress = 0;
  let active = false;
  let disposed = false;
  let contextLost = false;
  let raf = 0;
  let resizeObserver: ResizeObserver | undefined;
  let renderWidth = 0;
  let renderHeight = 0;
  let renderRatio = 0;
  const cameraTarget = new THREE.Vector3();
  const upward = new THREE.Vector3(0, 1, 0);
  const capDirection = new THREE.Vector3();
  const inverseParent = new THREE.Matrix4();

  // A small analytic contact shadow grounds the model without adding a light
  // shadow pass or downloading another texture.
  const shadowSize = 96;
  const shadowData = new Uint8Array(shadowSize * shadowSize * 4);
  for (let y = 0; y < shadowSize; y++) {
    for (let x = 0; x < shadowSize; x++) {
      const radius = Math.hypot((x / (shadowSize - 1) - .5) * 2, (y / (shadowSize - 1) - .5) * 2);
      const index = (y * shadowSize + x) * 4;
      shadowData[index + 3] = Math.round(Math.pow(Math.max(0, 1 - radius), 2.7) * 100);
    }
  }
  const shadowTexture = new THREE.DataTexture(shadowData, shadowSize, shadowSize);
  shadowTexture.needsUpdate = true;
  shadowTexture.magFilter = THREE.LinearFilter;
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 2.4), new THREE.MeshBasicMaterial({
    map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false,
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -.025;
  scene.add(shadow);

  function markReady(ready: boolean) {
    canvas.dataset.ready = String(ready);
    canvas.style.visibility = ready ? 'visible' : 'hidden';
  }

  function applyPose() {
    let index = 0;
    while (index < poses.length - 2 && currentProgress > poses[index + 1].progress) index++;
    const from = poses[index];
    const to = poses[index + 1];
    const amount = smooth(THREE.MathUtils.clamp((currentProgress - from.progress) / (to.progress - from.progress), 0, 1));
    const mix = (key: 'turn' | 'distance' | 'targetY' | 'elevation' | 'opening') => THREE.MathUtils.lerp(from[key], to[key], amount);
    turntable.rotation.y = mix('turn');
    const targetY = mix('targetY');
    // Very narrow canvases retain enough horizontal field for the square cap.
    const narrowAdjustment = Math.max(1, .56 / camera.aspect);
    const distance = mix('distance') * narrowAdjustment;
    camera.position.set(0, targetY + mix('elevation'), distance);
    cameraTarget.set(0, targetY, 0);
    camera.lookAt(cameraTarget);
    if (cap) {
      // Compute the exported parent's local up vector, so the applicator can
      // move vertically even if Blender exported a rotated root transform.
      normalized.updateMatrixWorld(true);
      inverseParent.copy(cap.parent!.matrixWorld).invert();
      capDirection.copy(upward).transformDirection(inverseParent);
      cap.position.copy(capStart).addScaledVector(capDirection, mix('opening') / normalizedScale);
    }
  }

  function draw() {
    raf = 0;
    if (disposed || contextLost || !active || document.hidden || !model) return;
    applyPose();
    renderer.render(scene, camera);
    markReady(true);
  }

  function requestDraw() {
    if (!disposed && !contextLost && active && !document.hidden && !raf && model) raf = requestAnimationFrame(draw);
  }

  function resize() {
    if (disposed) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    if (bounds.width === renderWidth && bounds.height === renderHeight && ratio === renderRatio) {
      requestDraw();
      return;
    }
    renderWidth = bounds.width;
    renderHeight = bounds.height;
    renderRatio = ratio;
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(ratio);
    renderer.setSize(bounds.width, bounds.height, false);
    requestDraw();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(raf);
    raf = 0;
    markReady(false);
  }

  function onContextRestored() {
    if (disposed) return;
    contextLost = false;
    refreshEnvironment();
    renderWidth = 0;
    resize();
    requestDraw();
  }

  function refreshEnvironment() {
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    let replacement: THREE.WebGLRenderTarget;
    try { replacement = pmrem.fromScene(room, .03); }
    finally { room.dispose(); pmrem.dispose(); }
    environment?.dispose();
    environment = replacement;
    scene.environment = environment.texture;
    scene.environmentIntensity = .65;
  }

  function onVisibility() {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else requestDraw();
  }

  function disposeObject(object: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    object.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      geometries.add(child.geometry);
      const objectMaterials = Array.isArray(child.material) ? child.material : [child.material];
      objectMaterials.forEach(material => {
        materials.add(material);
        Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
      });
    });
    textures.forEach(texture => {
      const source = texture.source?.data;
      if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) source.close();
      texture.dispose();
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('webglcontextrestored', onContextRestored);
    document.removeEventListener('visibilitychange', onVisibility);
    signal.removeEventListener('abort', dispose);
    resizeObserver?.disconnect();
    environment?.dispose();
    disposeObject(scene);
    renderer.dispose();
    // Keep the canvas context reusable when a reduced-motion or breakpoint
    // change rebuilds this view on the same DOM element.
    canvas.removeAttribute('data-ready');
    canvas.style.removeProperty('visibility');
  }

  markReady(false);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  document.addEventListener('visibilitychange', onVisibility);
  signal.addEventListener('abort', dispose, { once: true });
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  try {
    const url = `${import.meta.env.BASE_URL}models/seicento/cristal-rubi.glb`;
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error('No se pudo cargar el modelo de Cristal Rubí');
    const binary = await response.arrayBuffer();
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const gltf = await new GLTFLoader().parseAsync(binary, '');
    model = gltf.scene;
    if (signal.aborted || disposed) {
      disposeObject(model);
      throw new DOMException('Aborted', 'AbortError');
    }
    normalized.add(model);
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('El modelo no contiene geometría visible');
    normalizedScale = 3 / size.y;
    normalized.scale.setScalar(normalizedScale);
    normalized.position.set(-center.x * normalizedScale, -bounds.min.y * normalizedScale, -center.z * normalizedScale);
    cap = model.getObjectByName('RubiCap');
    if (cap) capStart = cap.position.clone();
    model.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.envMapIntensity = .9;
          if (material.map) material.map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        }
        // WebGL's transmission buffer contains opaque surfaces. Keeping the
        // liquid opaque makes its original ruby color visible through the
        // separate refractive glass shell instead of losing that nested layer.
        if (material instanceof THREE.MeshPhysicalMaterial && material.name === 'RubiLiquid') {
          material.transmission = 0;
          material.clearcoat = .18;
          material.clearcoatRoughness = .16;
          material.roughness = .18;
        }
        if (material instanceof THREE.MeshPhysicalMaterial && material.name === 'RubiGlass') {
          material.side = THREE.FrontSide;
          material.thickness = .026;
          material.roughness = .045;
          material.specularIntensity = .85;
        }
      });
    });
    refreshEnvironment();
    resize();
    return {
      setProgress(value) {
        if (disposed) return;
        currentProgress = THREE.MathUtils.clamp(Number.isFinite(value) ? value : 0, 0, 1);
        requestDraw();
      },
      setActive(value) {
        if (disposed) return;
        active = value;
        if (!active) { cancelAnimationFrame(raf); raf = 0; }
        else { resize(); requestDraw(); }
      },
      resize,
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
