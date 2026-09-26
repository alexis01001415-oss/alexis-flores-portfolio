import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { profile, projects } from './content';
import type { Experience } from './scene';

gsap.registerPlugin(ScrollTrigger);
const $=<T extends Element=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const $$=<T extends Element=HTMLElement>(selector:string)=>Array.from(document.querySelectorAll<T>(selector));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches,experience:Experience|undefined,lenis:Lenis|undefined,journeyProgress=0,loaded=false;
let motionContext:gsap.Context|undefined;
const loader=$('#preloader');
const pageParts=[$('.skip-link'),$('header'),$('main'),$('footer')];
pageParts.forEach(part=>part.inert=true);
const abort=new AbortController();
const storage={get(key:string){try{return localStorage.getItem(key)}catch{return null}},set(key:string,value:string){try{localStorage.setItem(key,value)}catch{/* Storage may be disabled. */}}};
function theme(light:boolean){document.documentElement.dataset.theme=light?'light':'dark';$('.theme-toggle').setAttribute('aria-label',light?'Activar modo oscuro':'Activar modo claro');$('.theme-toggle .icon').textContent=light?'dark_mode':'light_mode';$('meta[name="theme-color"]').setAttribute('content',light?'#f2eae3':'#131211');experience?.setLight(light);storage.set('af-theme',light?'light':'dark');}
theme(storage.get('af-theme')==='light');
$('.theme-toggle').addEventListener('click',()=>theme(document.documentElement.dataset.theme!=='light'));
$('#year').textContent=String(new Date().getFullYear());

const header=$('#site-header');let lastY=0;
function scrollState(){const y=window.scrollY;header.classList.toggle('is-scrolled',y>80);if(Math.abs(y-lastY)>5){header.classList.toggle('is-hidden',y>160&&y>lastY&&!menuOpen);lastY=y;}const max=document.documentElement.scrollHeight-innerHeight;$('.dock-progress').style.transform=`scaleX(${max?y/max:0})`;}
window.addEventListener('scroll',scrollState,{passive:true});
let menuOpen=false;const menu=$('#mobile-nav');
function setMenu(open:boolean){menuOpen=open;menu.hidden=!open;$('.menu-toggle').setAttribute('aria-expanded',String(open));$('.menu-toggle').setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');$('.menu-toggle .icon').textContent=open?'close':'menu';header.classList.remove('is-hidden');}
$('.menu-toggle').addEventListener('click',()=>setMenu(!menuOpen));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuOpen){setMenu(false);$('.menu-toggle').focus();}});
document.addEventListener('click',event=>{if(menuOpen&&!header.contains(event.target as Node)&&!menu.contains(event.target as Node))setMenu(false);});

function anchorTo(target:HTMLElement){const focusTarget=target.querySelector<HTMLElement>('h1,h2')||target;if(!focusTarget.hasAttribute('tabindex'))focusTarget.tabIndex=-1;const complete=()=>{focusTarget.focus({preventScroll:true});header.classList.remove('is-hidden');};if(lenis)lenis.scrollTo(target,{offset:0,duration:1.35,onComplete:complete});else{target.scrollIntoView({behavior:paused?'instant':'smooth'});complete();}}
$$<HTMLAnchorElement>('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{const target=document.getElementById(link.hash.slice(1));if(!target)return;event.preventDefault();setMenu(false);history.replaceState(null,'',link.hash);anchorTo(target);}));

const dialog=$<HTMLDialogElement>('#detail-dialog');let returnFocus:HTMLElement|null=null;
function openDetail(title:string,kicker:string,content:HTMLElement){returnFocus=document.activeElement as HTMLElement;$('#dialog-title').textContent=title;$('#dialog-kicker').textContent=kicker;$('#dialog-content').replaceChildren(content);dialog.showModal();lenis?.stop();document.body.style.overflow='hidden';}
function node(tag:string,text:string){const el=document.createElement(tag);el.textContent=text;return el;}
function closeDetail(){dialog.close();}
$('.dialog-close').addEventListener('click',closeDetail);
dialog.addEventListener('click',event=>{const box=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))closeDetail();});
dialog.addEventListener('close',()=>{document.body.style.overflow='';lenis?.start();returnFocus?.focus({preventScroll:true});});
$$('.project-open').forEach(button=>button.addEventListener('click',()=>{const project=projects[button.dataset.id!];if(!project)return;const body=document.createElement('div');body.append(node('p',project.intro),node('h3','El punto de partida'),node('p',project.challenge),node('h3','La dirección'));const list=document.createElement('ul');project.approach.forEach(item=>list.append(node('li',item)));body.append(list,node('p','Concepto de muestra creado para explorar la dirección visual del portafolio. No representa un encargo de un cliente.'));openDetail(project.title,project.category,body);}));
$('#profile-open').addEventListener('click',()=>{const body=document.createElement('div');body.append(node('p',profile.specialization),node('h3','Un perfil en construcción'),node('p','Este prototipo presenta mi dirección visual y mis áreas de interés. Mi trayectoria, experiencia, formación y casos reales se incorporarán con información verificada.'));openDetail('Alexis Flores','PERFIL PROFESIONAL',body);});
$('#contact-open').addEventListener('click',()=>{const body=document.createElement('div');body.append(node('p','El correo profesional se incorporará al completar el portafolio. Mientras tanto, puedes consultar mi perfil de GitHub.'));const link=document.createElement('a');link.className='button button-primary';link.href=profile.email?`mailto:${profile.email}`:profile.github;link.textContent=profile.email?'Escribir a Alexis':'Visitar GitHub';if(!profile.email){link.target='_blank';link.rel='noopener noreferrer'}body.append(link);openDetail('Sigamos la conversación.','CONTACTO',body);});

const lenisTick=(seconds:number)=>lenis?.raf(seconds*1000);
function setupMotion(){
  motionContext?.revert();lenis?.destroy();lenis=undefined;gsap.ticker.remove(lenisTick);
  document.body.classList.toggle('motion-paused',paused);
  $('.motion-toggle').setAttribute('aria-pressed',String(paused));$('.motion-toggle').setAttribute('aria-label',paused?'Activar recorrido animado':'Pausar movimiento');$('.motion-toggle .icon').textContent=paused?'play_arrow':'pause';
  experience?.setPaused(paused);
  if(!paused){lenis=new Lenis({lerp:.085,smoothWheel:true,autoRaf:false});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(lenisTick);gsap.ticker.lagSmoothing(0);if(!loaded)lenis.stop();}
  motionContext=gsap.context(()=>{
    ScrollTrigger.create({trigger:'.journey',start:'top top',end:'bottom bottom',onUpdate:self=>{journeyProgress=self.progress;experience?.setProgress(self.progress);$('.journey').classList.toggle('has-scrolled',self.progress>.1);$('.scene-meter i').style.transform=`scaleX(${self.progress})`;const chapter=Math.min(3,Math.floor(self.progress*3.5));$('#scene-index').textContent=`0${chapter+1} / 04`;$('#scene-label').textContent=['EL PUNTO DE PARTIDA','ABRIR POSIBILIDADES','DARLE FORMA','HACERLO SENTIR'][chapter];},onToggle:syncSceneVisibility});
    ScrollTrigger.create({trigger:'.contact',start:'top bottom',end:'bottom top',onUpdate:self=>{experience?.setFooter(self.isActive,self.progress);syncSceneVisibility();},onToggle:syncSceneVisibility});
    if(!paused){
      $$('.reveal').forEach(el=>gsap.from(el,{y:48,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 94%',once:true}}));
      $$('.process-list article').forEach(el=>gsap.from(el,{y:30,opacity:0,duration:.8,scrollTrigger:{trigger:el,start:'top 95%',once:true}}));
      gsap.from('.about-portrait img',{scale:1.08,scrollTrigger:{trigger:'.about-portrait',start:'top bottom',end:'bottom top',scrub:1}});
      const media=gsap.matchMedia();media.add('(min-width: 801px) and (min-height: 700px)',()=>{
        const track=$('.work-track');const distance=()=>Math.max(0,track.scrollWidth-innerWidth);
        const tween=gsap.to(track,{x:()=>-distance(),ease:'none',scrollTrigger:{trigger:'.work-window',start:'top 12%',end:()=>`+=${distance()+innerHeight*.5}`,pin:true,scrub:.7,invalidateOnRefresh:true,onUpdate:self=>{const p=self.progress;$('.work-progress i').style.transform=`scaleX(${.333+p*.667})`;$('#work-index').textContent=`0${Math.min(3,Math.floor(p*3)+1)}`;}}});
        const focus=(event:FocusEvent)=>{const card=(event.target as Element).closest('.project') as HTMLElement|null;if(!card||!tween.scrollTrigger)return;const index=$$('.project').indexOf(card);const trigger=tween.scrollTrigger;const p=Math.min(1,(index*(card.offsetWidth+40))/distance());const y=trigger.start+(trigger.end-trigger.start)*p;if(lenis)lenis.scrollTo(y,{immediate:true});else window.scrollTo(0,y);};track.addEventListener('focusin',focus);return()=>track.removeEventListener('focusin',focus);
      });
      gsap.from('.contact h2',{y:60,scrollTrigger:{trigger:'.contact',start:'top bottom',end:'top 20%',scrub:1}});
    }
  });
  ScrollTrigger.refresh();scrollState();syncSceneVisibility();
}
function syncSceneVisibility(){const hero=$('.journey').getBoundingClientRect(),foot=$('.contact').getBoundingClientRect();const footerActive=foot.top<innerHeight&&foot.bottom>0;experience?.setFooter(footerActive,THREEClamp((innerHeight-foot.top)/(innerHeight+foot.height)));experience?.setVisible(footerActive||(hero.top<innerHeight&&hero.bottom>0));}
function THREEClamp(n:number){return Math.max(0,Math.min(1,n));}
$('.motion-toggle').addEventListener('click',()=>{const previous=window.scrollY;paused=!paused;setupMotion();window.scrollTo(0,Math.min(previous,document.documentElement.scrollHeight-innerHeight));$('#live-message').textContent=paused?'Movimiento pausado. El contenido está disponible en una vista continua.':'Recorrido animado activado.';});
reduced.addEventListener('change',event=>{paused=document.body.classList.contains('scene-fallback')||event.matches;setupMotion()});
document.addEventListener('pointermove',event=>{if(event.pointerType==='mouse')experience?.setPointer(event.clientX/innerWidth*2-1,event.clientY/innerHeight*2-1)},{passive:true});
window.addEventListener('resize',()=>{if(innerWidth>800)setMenu(false)});
setupMotion();

function loadProgress(percent:number,stage:string){if(loaded)return;$('#load-progress').textContent=String(percent);$('#loader-fill').style.width=`${percent}%`;$('#load-stage').textContent=stage;}
function finishLoading(success:boolean,skipped=false){if(loaded)return;loaded=true;clearTimeout(timeout);if(success){$('#load-progress').textContent='100';$('#loader-fill').style.width='100%';$('#load-stage').textContent='El estudio está listo.';}else{$('#load-stage').textContent='Entrando con la vista estática.';document.body.classList.add('scene-fallback');if(!experience){paused=true;setupMotion();$<HTMLButtonElement>('.motion-toggle').disabled=true;$('.motion-toggle').setAttribute('aria-label','Vista estática activada');}}
  pageParts.forEach(part=>part.inert=false);lenis?.start();loader.classList.add('is-leaving');gsap.to(loader,{yPercent:-100,duration:reduced.matches?0:.85,ease:'power3.inOut',onComplete:()=>{loader.remove();ScrollTrigger.refresh();if(skipped){$('#hero-title').tabIndex=-1;$('#hero-title').focus({preventScroll:true})}}});
}
$('#skip-loader').addEventListener('click',()=>{abort.abort();finishLoading(false,true)});
const timeout=window.setTimeout(()=>{abort.abort();finishLoading(false)},20000);
async function boot(){try{const [module]=await Promise.all([import('./scene'),document.fonts.ready]);if(abort.signal.aborted)return;experience=await module.createExperience($('#experience-canvas'),$('#footer-canvas'),{progress:loadProgress,signal:abort.signal});experience.setProgress(journeyProgress);experience.setPaused(paused);experience.setLight(document.documentElement.dataset.theme==='light');syncSceneVisibility();finishLoading(true);}catch(error){if(!abort.signal.aborted)console.warn('Vista 3D no disponible; se conserva el contenido.',error);finishLoading(false);}}
void boot();
