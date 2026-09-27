import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { projects } from './content';
import { setupPortrait } from './portrait';
import { setupContact } from './contact';
import './updates.css';
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
$('#year').textContent=String(new Date().getFullYear());
setupPortrait($('.about-portrait'), reduced);
setupContact($<HTMLFormElement>('#contact-form'));

const header=$('#site-header');
function scrollState(){const y=window.scrollY;header.classList.toggle('is-scrolled',y>80);const max=document.documentElement.scrollHeight-innerHeight;$('.dock-progress').style.transform=`scaleX(${max?y/max:0})`;}
window.addEventListener('scroll',scrollState,{passive:true});
let menuOpen=false;const menu=$('#mobile-nav');
function setMenu(open:boolean){menuOpen=open;menu.hidden=!open;$('.menu-toggle').setAttribute('aria-expanded',String(open));$('.menu-toggle').setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');$('.menu-toggle .icon').textContent=open?'close':'menu';}
$('.menu-toggle').addEventListener('click',()=>setMenu(!menuOpen));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuOpen){setMenu(false);$('.menu-toggle').focus();}});
document.addEventListener('click',event=>{if(menuOpen&&!header.contains(event.target as Node)&&!menu.contains(event.target as Node))setMenu(false);});

function anchorTo(target:HTMLElement){const focusTarget=target.querySelector<HTMLElement>('h1,h2,h3')||target;if(!focusTarget.hasAttribute('tabindex'))focusTarget.tabIndex=-1;const complete=()=>focusTarget.focus({preventScroll:true});if(lenis)lenis.scrollTo(target,{offset:0,duration:1.35,onComplete:complete});else{target.scrollIntoView({behavior:paused?'instant':'smooth'});complete();}}
$$<HTMLAnchorElement>('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{const target=document.getElementById(link.hash.slice(1));if(!target)return;event.preventDefault();setMenu(false);history.replaceState(null,'',link.hash);anchorTo(target);}));

const dialog=$<HTMLDialogElement>('#detail-dialog');let returnFocus:HTMLElement|null=null;
function openDetail(title:string,kicker:string,content:HTMLElement){const active=document.activeElement as HTMLElement;returnFocus=active.closest('.projects-dropdown')?document.querySelector<HTMLElement>('#projects-toggle'):active.closest('#mobile-nav')?document.querySelector<HTMLElement>('.menu-toggle'):active;$('#dialog-title').textContent=title;$('#dialog-kicker').textContent=kicker;$('#dialog-content').replaceChildren(content);dialog.showModal();lenis?.stop();document.body.style.overflow='hidden';}
function node(tag:string,text:string){const el=document.createElement(tag);el.textContent=text;return el;}
function closeDetail(){dialog.close();}
$('.dialog-close').addEventListener('click',closeDetail);
dialog.addEventListener('click',event=>{const box=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))closeDetail();});
dialog.addEventListener('close',()=>{document.body.style.overflow='';lenis?.start();returnFocus?.focus({preventScroll:true});});
$$('.project-open').forEach(button=>button.addEventListener('click',()=>{const project=projects[button.dataset.id!];if(!project)return;const body=document.createElement('div');body.append(node('p',project.intro),node('h3','El punto de partida'),node('p',project.challenge),node('h3','La dirección'));const list=document.createElement('ul');project.approach.forEach(item=>list.append(node('li',item)));body.append(list,node('p','Concepto de muestra creado para explorar la dirección visual del portafolio. No representa un encargo de un cliente.'));openDetail(project.title,project.category,body);}));
const projectToggle=$<HTMLButtonElement>('#projects-toggle'),projectMenu=$('#projects-dropdown');
function setProjects(open:boolean){projectToggle.setAttribute('aria-expanded',String(open));projectMenu.hidden=!open;}
projectToggle.addEventListener('click',()=>setProjects(projectMenu.hidden));
projectToggle.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();setProjects(true);projectMenu.querySelector<HTMLElement>('a,button')?.focus();}});
document.addEventListener('click',event=>{if(!(event.target as Element).closest('.projects-disclosure'))setProjects(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!projectMenu.hidden){setProjects(false);projectToggle.focus();}});
projectMenu.addEventListener('click',event=>{if((event.target as Element).closest('a,button'))setProjects(false);});
$('.projects-disclosure').addEventListener('focusout',event=>{if(event.relatedTarget&&!$('.projects-disclosure').contains(event.relatedTarget as Node))setProjects(false);});
$$('#mobile-nav .project-open').forEach(button=>button.addEventListener('click',()=>setMenu(false)));
$$('details').forEach(detail=>detail.addEventListener('toggle',()=>ScrollTrigger.refresh()));

const lenisTick=(seconds:number)=>lenis?.raf(seconds*1000);
function setupMotion(){
  motionContext?.revert();lenis?.destroy();lenis=undefined;gsap.ticker.remove(lenisTick);
  document.body.classList.toggle('motion-paused',paused);
  experience?.setPaused(paused);
  if(!paused){lenis=new Lenis({lerp:.085,smoothWheel:true,autoRaf:false});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(lenisTick);gsap.ticker.lagSmoothing(0);if(!loaded)lenis.stop();}
  motionContext=gsap.context(()=>{
    ScrollTrigger.create({trigger:'.journey',start:'top top',end:'bottom bottom',onUpdate:self=>{journeyProgress=self.progress;experience?.setProgress(self.progress);$('.journey').classList.toggle('has-scrolled',self.progress>.1);$('.scene-meter i').style.transform=`scaleX(${self.progress})`;const chapter=Math.min(3,Math.floor(self.progress*3.5));$('#scene-index').textContent=`0${chapter+1} / 04`;$('#scene-label').textContent=['EL PUNTO DE PARTIDA','ABRIR POSIBILIDADES','DARLE FORMA','HACERLO SENTIR'][chapter];},onToggle:syncSceneVisibility});
    ScrollTrigger.create({trigger:'.contact',start:'top bottom',end:'bottom top',onUpdate:self=>{experience?.setFooter(self.isActive,self.progress);syncSceneVisibility();},onToggle:syncSceneVisibility});
    if(!paused){
      $$('.reveal').forEach(el=>gsap.from(el,{y:48,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 94%',once:true}}));
      $$('.process-list article').forEach(el=>gsap.from(el,{y:30,opacity:0,duration:.8,scrollTrigger:{trigger:el,start:'top 95%',once:true}}));
      gsap.fromTo('.timeline-ink',{strokeDashoffset:1},{strokeDashoffset:0,ease:'none',scrollTrigger:{trigger:'.career-timeline',start:'top 65%',end:'bottom 65%',scrub:.5}});
      $$('.career-stop').forEach(stop=>ScrollTrigger.create({trigger:stop,start:'top 60%',end:'bottom 40%',toggleClass:'is-current'}));
      $$('.case-image img').forEach(img=>gsap.fromTo(img,{yPercent:4,scale:1.08},{yPercent:-4,scale:1.08,ease:'none',scrollTrigger:{trigger:img.closest('.case-study'),start:'top bottom',end:'bottom top',scrub:1}}));
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
reduced.addEventListener('change',event=>{paused=document.body.classList.contains('scene-fallback')||event.matches;setupMotion()});
document.addEventListener('pointermove',event=>{if(event.pointerType==='mouse')experience?.setPointer(event.clientX/innerWidth*2-1,event.clientY/innerHeight*2-1)},{passive:true});
window.addEventListener('resize',()=>{if(innerWidth>800)setMenu(false)});
setupMotion();

function loadProgress(percent:number,stage:string){if(loaded)return;$('#load-progress').textContent=String(percent);$('#loader-fill').style.width=`${percent}%`;$('#load-stage').textContent=stage;}
function finishLoading(success:boolean,skipped=false){if(loaded)return;loaded=true;clearTimeout(timeout);if(success){$('#load-progress').textContent='100';$('#loader-fill').style.width='100%';$('#load-stage').textContent='El estudio está listo.';}else{$('#load-stage').textContent='Entrando con la vista estática.';document.body.classList.add('scene-fallback');if(!experience){paused=true;setupMotion();}}
  pageParts.forEach(part=>part.inert=false);lenis?.start();loader.classList.add('is-leaving');gsap.to(loader,{yPercent:-100,duration:reduced.matches?0:.85,ease:'power3.inOut',onComplete:()=>{loader.remove();ScrollTrigger.refresh();if(skipped){$('#hero-title').tabIndex=-1;$('#hero-title').focus({preventScroll:true})}}});
}
$('#skip-loader').addEventListener('click',()=>{abort.abort();finishLoading(false,true)});
const timeout=window.setTimeout(()=>{abort.abort();finishLoading(false)},20000);
async function boot(){try{const [module]=await Promise.all([import('./scene'),document.fonts.ready]);if(abort.signal.aborted)return;experience=await module.createExperience($('#experience-canvas'),$('#footer-canvas'),{progress:loadProgress,signal:abort.signal});experience.setProgress(journeyProgress);experience.setPaused(paused);syncSceneVisibility();finishLoading(true);}catch(error){if(!abort.signal.aborted)console.warn('Vista 3D no disponible; se conserva el contenido.',error);finishLoading(false);}}
void boot();
