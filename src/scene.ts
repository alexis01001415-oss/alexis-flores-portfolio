import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

type StudioOptions = { paused: boolean; onStatus: (message: string) => void };

export async function createStudio(options: StudioOptions) {
  const host = document.querySelector<HTMLElement>('#studio-canvas')!;
  const studioElement = document.querySelector<HTMLElement>('#studio')!;
  let paused = options.paused;
  let active = true;
  let lost = false;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 800 ? 1.35 : 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = innerWidth >= 800;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04).texture;
  scene.environment = environment;
  scene.environmentIntensity = .65;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xf2f2df, 0x273323, 1.1));
  const key = new THREE.DirectionalLight(0xfff9e7, 3); key.position.set(-3, 8, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -5; key.shadow.normalBias = .025; key.shadow.bias = -.0002; scene.add(key);
  const rim = new THREE.DirectionalLight(0xd6f36b, 1.5); rim.position.set(-5, 4, -4); scene.add(rim);
  const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, .1, 100);
  camera.position.set(7.8, 7.4, 10.5); camera.lookAt(0, 1.15, .2);
  let gltf;
  try { gltf = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/studio.glb`); }
  catch (error) { environment.dispose(); renderer.dispose(); renderer.domElement.remove(); throw error; }
  const model = gltf.scene;
  model.traverse(object => { const mesh = object as THREE.Mesh; if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; } });
  scene.add(model);
  const pivot = model.getObjectByName('Studio') || model;
  const cat = model.getObjectByName('Cat');
  const head = model.getObjectByName('CatHead');
  const tail = model.getObjectByName('CatTail');
  const legLeft = model.getObjectByName('CatLegLeft');
  const legRight = model.getObjectByName('CatLegRight');
  const eyesOpen = model.getObjectByName('CatEyesOpen');
  const eyesClosed = model.getObjectByName('CatEyesClosed');
  const catOrigin = cat?.position.clone();
  const headRotation = head?.rotation.clone();
  const tailRotation = tail?.rotation.clone();
  let awake = false;
  let animation: gsap.core.Timeline | undefined;
  const pointer = new THREE.Vector2();
  function resize() { const width = host.clientWidth; const height = host.clientHeight; const aspect = width / Math.max(1, height); const vertical = 7.25; camera.left = -vertical * aspect / 2; camera.right = vertical * aspect / 2; camera.top = vertical / 2; camera.bottom = -vertical / 2; camera.updateProjectionMatrix(); renderer.setSize(width, height, false); render(); }
  function render() { if (!lost) renderer.render(scene, camera); }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const visibility = new IntersectionObserver(entries => { active = entries[0].isIntersecting; if (active) render(); }, { rootMargin: '100px' }); visibility.observe(studioElement);
  studioElement.addEventListener('pointermove', e => { const bounds = studioElement.getBoundingClientRect(); pointer.set((e.clientX - bounds.left) / bounds.width - .5, (e.clientY - bounds.top) / bounds.height - .5); if (paused) render(); });
  studioElement.addEventListener('pointerleave', () => pointer.set(0, 0));
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; studioElement.classList.remove('is-ready'); });
  renderer.domElement.addEventListener('webglcontextrestored', () => { lost = false; resize(); studioElement.classList.add('is-ready'); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && active) render(); });
  let lastTime = 0;
  let frameId = 0;
  function tick(time: number) {
    frameId = requestAnimationFrame(tick);
    if (!active || document.hidden || lost || paused || time - lastTime < 1000 / 30) return;
    lastTime = time;
    if (!paused) {
      pivot.rotation.y = THREE.MathUtils.lerp(pivot.rotation.y, pointer.x * .18 + Math.min(window.scrollY / 2000, .2), .06);
      if (cat && !awake && catOrigin) cat.scale.y = 1 + Math.sin(time * .0015) * .012;
      if (tail && tailRotation && !awake) tail.rotation.y = tailRotation.y + Math.sin(time * .001) * .045;
    }
    render();
  }
  resize();
  studioElement.classList.add('is-ready');
  frameId = requestAnimationFrame(tick);

  // Reuse the Blender chair and cat for a second scene, rendered only in the footer.
  let footerRenderer: THREE.WebGLRenderer | undefined;
  let footerScene: THREE.Scene | undefined;
  let footerCamera: THREE.OrthographicCamera | undefined;
  let footerModel: THREE.Group | undefined;
  let footerVisible = false;
  const footerHost = document.createElement('div'); footerHost.className = 'footer-three'; footerHost.setAttribute('aria-hidden', 'true');
  document.querySelector('.contact-main')!.append(footerHost);
  const footerResize = new ResizeObserver(() => {
    if (!footerRenderer || !footerCamera) return;
    const aspect = footerHost.clientWidth / Math.max(1, footerHost.clientHeight);
    footerCamera.left = -2.3 * aspect; footerCamera.right = 2.3 * aspect; footerCamera.updateProjectionMatrix();
    footerRenderer.setSize(footerHost.clientWidth, footerHost.clientHeight, false);
    if (footerScene) footerRenderer.render(footerScene, footerCamera);
  });
  function initFooter() {
    if (footerRenderer) return;
    try {
      footerRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      footerRenderer.setPixelRatio(Math.min(devicePixelRatio, 1.35)); footerRenderer.setClearColor(0, 0); footerRenderer.toneMapping = THREE.ACESFilmicToneMapping; footerRenderer.toneMappingExposure = 1.2;
      footerHost.append(footerRenderer.domElement);
      footerScene = new THREE.Scene(); footerScene.add(new THREE.HemisphereLight(0xffffff, 0x44512c, 3.5));
      const light = new THREE.DirectionalLight(0xfffbea, 5); light.position.set(-3, 6, 4); footerScene.add(light);
      const fill = new THREE.DirectionalLight(0xd6f36b, 2); fill.position.set(4, 4, -2); footerScene.add(fill);
      const chair = model.getObjectByName('Chair')?.clone(true);
      if (chair) { footerModel = new THREE.Group(); chair.position.set(0, 0, 0); footerModel.add(chair); footerScene.add(footerModel); const box = new THREE.Box3().setFromObject(footerModel); const center = box.getCenter(new THREE.Vector3()); chair.position.sub(center); }
      footerCamera = new THREE.OrthographicCamera(-2.3, 2.3, 2.3, -2.3, .1, 50); footerCamera.position.set(3, 2.8, 6); footerCamera.lookAt(0, 0, 0);
      footerResize.observe(footerHost);
      document.querySelector('.footer-orbit')?.classList.add('has-model');
    } catch { footerHost.hidden = true; }
  }
  const footerObserver = new IntersectionObserver(entries => { footerVisible = entries[0].isIntersecting; if (footerVisible) initFooter(); }, { rootMargin: '150px' }); footerObserver.observe(document.querySelector('#contacto')!);
  let lastFooter = 0;
  function footerTick(time: number) { if (paused || !footerVisible || document.hidden || !footerRenderer || !footerScene || !footerCamera || time - lastFooter < 1 / 30) return; lastFooter = time; if (footerModel) { const rect = footerHost.getBoundingClientRect(); footerModel.rotation.y = -.2 + Math.max(-.3, Math.min(.3, rect.top / innerHeight * .4)); } footerRenderer.render(footerScene, footerCamera); }
  gsap.ticker.add(footerTick);

  async function wakeCat() {
    if (!cat || !catOrigin || !head || !headRotation || awake) return;
    awake = true;
    const label = document.querySelector('#cat-label')!;
    const action = document.querySelector('.cat-action')!;
    options.onStatus('El gato despierta, se estira y juega antes de volver a descansar.');
    label.textContent = 'Una pausa creativa.'; action.textContent = 'Miau.';
    if (eyesOpen) eyesOpen.scale.setScalar(1);
    if (eyesClosed) eyesClosed.visible = false;
    if (paused) { head.rotation.x = headRotation.x + .25; render(); await new Promise(resolve => setTimeout(resolve, 1200)); head.rotation.copy(headRotation); render(); }
    else await new Promise<void>(resolve => {
      animation = gsap.timeline({ onComplete: resolve });
      animation.to(head.rotation, { x: headRotation.x + .3, z: headRotation.z - .15, duration: .8, ease: 'power2.out' })
        .to(cat.scale, { y: 1.12, x: .97, duration: .6 }, '<')
        .to(cat.position, { y: catOrigin.y + .12, duration: .6 }, '<');
      if (legLeft) animation.to(legLeft.rotation, { x: -.45, duration: .35, repeat: 3, yoyo: true }, '-=.1');
      if (tail && tailRotation) animation.to(tail.rotation, { z: tailRotation.z + .45, y: tailRotation.y + .4, duration: .5, repeat: 3, yoyo: true }, '<');
      animation.to(head.rotation, { y: headRotation.y + .45, duration: .55 }, '<.3')
        .to(cat.position, { x: catOrigin.x + .12, z: catOrigin.z - .12, duration: .4, repeat: 3, yoyo: true }, '>.1');
      if (legRight) animation.to(legRight.rotation, { x: .3, duration: .2, repeat: 5, yoyo: true }, '<');
      // A short leap and walk across the desk, then back to the cushion.
      model.updateMatrixWorld(true);
      const deskTarget = cat.parent!.worldToLocal(new THREE.Vector3(-1.35, 2.24, -.1));
      const nextTarget = cat.parent!.worldToLocal(new THREE.Vector3(-.55, 2.24, -.1));
      animation.to(cat.position, { x: deskTarget.x, z: deskTarget.z, duration: .75, ease: 'power1.inOut' }, '+=.1')
        .to(cat.position, { y: deskTarget.y + .35, duration: .38, ease: 'power2.out' }, '<')
        .to(cat.position, { y: deskTarget.y, duration: .37, ease: 'power2.in' }, '>')
        .to(cat.position, { x: nextTarget.x, z: nextTarget.z, duration: 1.4, ease: 'none' }, '+=.2');
      if (legLeft) animation.to(legLeft.rotation, { x: -.4, duration: .18, repeat: 7, yoyo: true }, '<');
      if (legRight) animation.to(legRight.rotation, { x: .4, duration: .18, repeat: 7, yoyo: true }, '<');
      animation.to(cat.position, { x: catOrigin.x, z: catOrigin.z, duration: .8, ease: 'power1.inOut' }, '+=.3')
        .to(cat.position, { y: deskTarget.y + .3, duration: .3, ease: 'power1.out' }, '<')
        .to(cat.position, { y: catOrigin.y, duration: .5, ease: 'power2.in' }, '>');
      animation.to(head.rotation, { x: headRotation.x, y: headRotation.y, z: headRotation.z, duration: 1 }, '+=.25')
        .to(cat.scale, { x: 1, y: 1, z: 1, duration: 1 }, '<')
        .to(cat.position, { x: catOrigin.x, y: catOrigin.y, z: catOrigin.z, duration: 1 }, '<');
    });
    if (eyesOpen) eyesOpen.scale.setScalar(.001);
    if (eyesClosed) eyesClosed.visible = true;
    awake = false; animation = undefined; label.textContent = 'Shhh… está creando.'; action.textContent = 'Despertar'; render();
  }
  return {
    wakeCat,
    setPaused(value: boolean) { paused = value; animation?.paused(value); render(); },
    setTheme(theme: string) { renderer.toneMappingExposure = theme === 'light' ? 1 : 1.1; render(); },
    dispose() { cancelAnimationFrame(frameId); animation?.kill(); resizeObserver.disconnect(); visibility.disconnect(); footerObserver.disconnect(); footerResize.disconnect(); gsap.ticker.remove(footerTick); environment.dispose(); model.traverse(object => { const mesh = object as THREE.Mesh; if (mesh.isMesh) { mesh.geometry.dispose(); const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]; materials.forEach(material => material.dispose()); } }); renderer.dispose(); footerRenderer?.dispose(); host.replaceChildren(); footerHost.remove(); },
  };
}
