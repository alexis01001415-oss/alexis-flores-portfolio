import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

type Options = { progress: (percent: number, stage: string) => void; signal: AbortSignal };
type Pose = { p:number; x:number; y:number; z:number; ry:number; rz:number; lid:number; desk:number; camera:[number,number,number]; target:[number,number,number] };
const poses:Pose[] = [
  {p:0,x:0,y:.042,z:.08,ry:0,rz:0,lid:-8,desk:0,camera:[2.8,5,7.2],target:[0,1.8,0]},
  {p:.10,x:0,y:.12,z:.08,ry:0,rz:0,lid:-18,desk:-.3,camera:[3,4.8,10],target:[0,1,0]},
  {p:.28,x:-2.35,y:.5,z:.1,ry:.16,rz:.04,lid:-105,desk:-5,camera:[0,3.1,8.5],target:[0,1,0]},
  {p:.40,x:-2.35,y:.55,z:.1,ry:.08,rz:.02,lid:-105,desk:-8,camera:[0,3.1,8.5],target:[0,1,0]},
  {p:.59,x:2.25,y:.5,z:.2,ry:-.38,rz:-.05,lid:-105,desk:-10,camera:[0,3.3,8.4],target:[0,1,0]},
  {p:.72,x:2.25,y:.65,z:.2,ry:-.28,rz:-.035,lid:-108,desk:-10,camera:[0,3.3,8.4],target:[0,1,0]},
  {p:.90,x:2.65,y:.4,z:.7,ry:-.42,rz:.03,lid:-100,desk:-10,camera:[0,2.8,7.7],target:[0,1,0]},
  {p:1,x:2.65,y:.65,z:.9,ry:-.25,rz:.015,lid:-105,desk:-10,camera:[0,2.7,7.4],target:[0,1,0]},
];
const smooth=(x:number)=>x*x*(3-2*x);
const mix=THREE.MathUtils.lerp;

export async function createExperience(host:HTMLElement, footer:HTMLElement, options:Options){
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(40,1,.1,100);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth<900?1.35:1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.02;
  renderer.shadowMap.enabled=window.innerWidth>800;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
  let env:THREE.DataTexture|undefined;
  scene.add(new THREE.HemisphereLight(0xf2eae3,0x3a2827,.45));
  const key=new THREE.DirectionalLight(0xfff1e2,2.8);key.position.set(-3,7,5);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.normalBias=.025;key.shadow.bias=-.0003;scene.add(key);
  const fill=new THREE.DirectionalLight(0xe2e8ff,1.5);fill.position.set(5,4,-3);scene.add(fill);
  const rim=new THREE.PointLight(0xff073a,32,18,2);rim.position.set(3,2,-2);scene.add(rim);
  let model:THREE.Group|undefined;
  const cleanup=()=>{renderer.dispose();renderer.domElement.remove();env?.dispose();model?.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.geometry.dispose();const mats=Array.isArray(obj.material)?obj.material:[obj.material];for(const mat of mats){for(const value of Object.values(mat)){if(value instanceof THREE.Texture)value.dispose()}mat.dispose()}}})};
  try {
    const lighting=await fetch(`${import.meta.env.BASE_URL}models/studio-environment.pmrem`,{signal:options.signal});
    if(!lighting.ok||!lighting.body)throw new Error('No se pudo cargar la iluminación');
    const lightingBuffer=await new Response(lighting.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    env=new THREE.DataTexture(new Uint16Array(lightingBuffer),384,512,THREE.RGBAFormat,THREE.HalfFloatType);
    env.mapping=THREE.CubeUVReflectionMapping;env.minFilter=THREE.LinearFilter;env.magFilter=THREE.LinearFilter;env.colorSpace=THREE.LinearSRGBColorSpace;env.needsUpdate=true;scene.environment=env;scene.environmentIntensity=.75;
    const response=await fetch(`${import.meta.env.BASE_URL}models/workstation-v2.glb`,{signal:options.signal});
    if(!response.ok)throw new Error('No se pudo cargar el estudio');
    const size=Number(response.headers.get('content-length'));
    let buffer:ArrayBuffer;
    if(response.body&&size){
      const reader=response.body.getReader();const chunks:Uint8Array[]=[];let received=0;
      while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);received+=value.length;options.progress(Math.min(84,Math.round(received/size*84)),'Cargando geometría y materiales');}
      const bytes=new Uint8Array(received);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}buffer=bytes.buffer;
    }else{buffer=await response.arrayBuffer();}
    options.progress(86,'Montando el estudio en 3D');
    if(options.signal.aborted)throw new DOMException('Aborted','AbortError');
    const manager=new THREE.LoadingManager();let textureFailed=false;manager.onError=()=>{textureFailed=true};
    const gltf=await new GLTFLoader(manager).parseAsync(buffer,'');model=gltf.scene;
    if(textureFailed)throw new Error('No se pudieron cargar los materiales del modelo');
    if(options.signal.aborted)throw new DOMException('Aborted','AbortError');
    model.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.castShadow=true;obj.receiveShadow=true;const materials=Array.isArray(obj.material)?obj.material:[obj.material];materials.forEach(mat=>{if(mat instanceof THREE.MeshPhysicalMaterial){mat.transmission=0;mat.clearcoat=.1;}if(mat instanceof THREE.MeshStandardMaterial){mat.envMapIntensity=.85;if(mat.map)mat.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}})}});
    scene.add(model);
    const laptop=model.getObjectByName('Laptop')!;
    const lid=model.getObjectByName('LaptopLid')!;
    const desk=model.getObjectByName('Desk')!;
    const props=['CoffeeCup','Notebook','Pen','AccentObject'].map(name=>model!.getObjectByName(name)!).filter(Boolean);
    const propPositions=props.map(obj=>obj.position.clone());
    const screen=model.getObjectByName('ScreenSurface') as THREE.Mesh;
    const screenMaps:THREE.Texture[]=[];
    let screenMode=-1;
    if(screen){const mat=screen.material as THREE.MeshStandardMaterial;if(mat.map){screenMaps.push(mat.map);screen.material=new THREE.MeshBasicMaterial({map:mat.map,toneMapped:false});mat.dispose();}}
    function screenDesign(mode:number){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=628;const ctx=canvas.getContext('2d')!;
      ctx.fillStyle=mode===1?'#F2EAE3':'#131211';ctx.fillRect(0,0,1024,628);ctx.fillStyle=mode===1?'#131211':'#F2EAE3';ctx.font='500 18px Yantramanav';ctx.fillText(mode===1?'AF / SISTEMA VISUAL':'AF / INTERACCIÓN',52,54);ctx.fillText(mode===1?'02':'03',930,54);
      ctx.font='700 94px Yantramanav';ctx.fillText(mode===1?'Menos ruido.':'Diseño en',52,225);ctx.fillText(mode===1?'Más intención.':'movimiento.',52,320);
      ctx.strokeStyle=mode===1?'#13121130':'#f2eae340';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(52,380);ctx.lineTo(972,380);ctx.stroke();
      if(mode===1){ctx.fillStyle='#131211';ctx.fillRect(52,430,260,126);ctx.fillStyle='#D0C9C3';ctx.fillRect(332,430,260,126);ctx.fillStyle='#FF073A';ctx.fillRect(612,430,360,126);}else{ctx.fillStyle='#F2EAE3';ctx.font='400 21px Yantramanav';ctx.fillText('UN GESTO. UNA RESPUESTA. UNA CONEXIÓN.',52,434);ctx.strokeStyle='#ff073a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(52,520);ctx.bezierCurveTo(220,520,280,400,480,520);ctx.bezierCurveTo(650,630,760,390,970,510);ctx.stroke();ctx.fillStyle='#ff073a';ctx.beginPath();ctx.arc(790,493,25,0,Math.PI*2);ctx.fill();}
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;return texture;
    }
    if(screenMaps.length){screenMaps.push(screenDesign(1),screenDesign(2));}
    let progress=0,paused=false,isFooter=false,light=false,visible=true,raf=0,disposed=false,ready=false,pointerX=0,pointerY=0,currentX=0,currentY=0;
    let footerProgress=0;
    const dark=new THREE.Color('#131211'),paper=new THREE.Color('#F2EAE3'),background=new THREE.Color();
    const target=new THREE.Vector3();
    function resize(){const parent=isFooter?footer:host;const w=parent.clientWidth,h=parent.clientHeight;if(w&&h){camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);requestRender();}}
    function apply(){
      const mobile=window.innerWidth<=800;
      const p=paused?0:progress;
      const nextScreen=isFooter?2:p>.79?2:p>.50?1:0;
      if(screenMaps.length&&screenMode!==nextScreen){(screen.material as THREE.MeshBasicMaterial).map=screenMaps[nextScreen];screenMode=nextScreen;}
      let i=0;while(i<poses.length-2&&p>poses[i+1].p)i++;
      const a=poses[i],b=poses[i+1];const t=smooth(THREE.MathUtils.clamp((p-a.p)/(b.p-a.p),0,1));
      const float=mobile?smooth(Math.min(1,p/.24)):0;
      const v=(key:'x'|'y'|'z'|'ry'|'rz'|'lid'|'desk')=>mix(a[key],b[key],t);
      laptop.position.set(mobile?v('x')*(1-float):v('x'),mobile?mix(v('y'),2.1,float):v('y'),v('z'));
      laptop.rotation.set(0,v('ry')*(mobile?.6:1),v('rz'));
      laptop.scale.setScalar(1);
      lid.rotation.x=THREE.MathUtils.degToRad(paused?-105:v('lid'));
      desk.position.y=v('desk');desk.visible=!isFooter;
      props.forEach((obj,index)=>{obj.visible=!isFooter&&p<.29;const start=propPositions[index];const f=smooth(Math.min(1,p/.27));obj.position.set(start.x*(1+f*4),start.y+f*(5+index),start.z-f*(3+index));obj.rotation.y=f*(index%2?-1.5:1.3);obj.rotation.z=f*(index%2?.3:-.3)});
      for(let c=0;c<3;c++){camera.position.setComponent(c,mix(a.camera[c],b.camera[c],t));target.setComponent(c,mix(a.target[c],b.target[c],t));}
      if(mobile){camera.position.set(mix(.4,0,float),mix(6.3,4.1,float),mix(13,10.3,float));target.set(0,mix(1.1,.95,float),0);camera.fov=43;}else camera.fov=40;
      const enter=smooth(THREE.MathUtils.clamp((p-.43)/.12,0,1));const leave=smooth(THREE.MathUtils.clamp((p-.73)/.11,0,1));
      const pale=enter*(1-leave);
      background.copy(dark).lerp(paper,pale);scene.background=background;
      scene.environmentIntensity=.75+pale*.35+(light?.05:0);
      document.documentElement.style.setProperty('--scene-ink',pale>.5?'#131211':'#f2eae3');
      if(isFooter){scene.background=null;laptop.position.set(0,.4,0);laptop.rotation.set(.03,mix(-.6,-.22,paused?.5:footerProgress),-.11);laptop.scale.setScalar(1);lid.rotation.x=THREE.MathUtils.degToRad(-105);camera.position.set(.3,3.1,7.5);target.set(0,1,0);camera.fov=38;}
      camera.position.x+=currentX*(mobile||paused?0:.22);camera.position.y+=currentY*(mobile||paused?0:.10);camera.lookAt(target);camera.updateProjectionMatrix();
    }
    function render(){raf=0;if(!ready||disposed||document.hidden||!visible)return;currentX=mix(currentX,pointerX,.09);currentY=mix(currentY,pointerY,.09);apply();renderer.render(scene,camera);if(Math.abs(currentX-pointerX)+Math.abs(currentY-pointerY)>.003)requestRender();}
    function requestRender(){if(!raf&&!disposed)raf=requestAnimationFrame(render);}
    resize();apply();options.progress(94,'Preparando luces y reflejos');
    await renderer.compileAsync(scene,camera);
    if(options.signal.aborted)throw new DOMException('Aborted','AbortError');
    ready=true;
    renderer.render(scene,camera);
    document.querySelector('.journey')?.classList.add('scene-ready');
    const observer=new ResizeObserver(resize);observer.observe(host);observer.observe(footer);
    const visibility=()=>{if(!document.hidden)requestRender()};document.addEventListener('visibilitychange',visibility);
    return {
      setProgress(value:number){progress=value;requestRender()},
      setPointer(x:number,y:number){pointerX=x;pointerY=y;requestRender()},
      setPaused(value:boolean){paused=value;requestRender()},
      setLight(value:boolean){light=value;requestRender()},
      setVisible(value:boolean){visible=value;if(value)requestRender()},
      setFooter(value:boolean,p=0){footerProgress=p;if(value!==isFooter){isFooter=value;(value?footer:host).append(renderer.domElement);resize();}requestRender()},
      dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',visibility);screenMaps.forEach(texture=>texture.dispose());cleanup()},
    };
  }catch(error){cleanup();throw error}
}
export type Experience = Awaited<ReturnType<typeof createExperience>>;
