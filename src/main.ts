import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { profile, projects } from './content';

gsap.registerPlugin(ScrollTrigger);
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
let scene: Awaited<ReturnType<typeof import('./scene')['createStudio']>> | undefined;
const setStatus = (message: string) => { $('#live-message').textContent = message; };

// Preferences remain local. Rendering does not depend on localStorage availability.
try { const saved = localStorage.getItem('af-theme'); if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved; } catch { /* private browsing */ }
function updateThemeButton() {
  const dark = document.documentElement.dataset.theme === 'dark';
  $('.theme-toggle').setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
  $('.theme-toggle .icon').textContent = dark ? 'light_mode' : 'dark_mode';
  $('meta[name="theme-color"]').setAttribute('content', dark ? '#151713' : '#f2f2e9');
}
updateThemeButton();
$('.theme-toggle').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('af-theme', theme); } catch { /* optional preference */ }
  updateThemeButton(); scene?.setTheme(theme);
});

const menuToggle = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
function closeMenu(restoreFocus = false) { mobileNav.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Abrir menú'); $('.menu-toggle .icon').textContent = 'menu'; if (restoreFocus) menuToggle.focus(); }
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  mobileNav.hidden = !open; menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú'); $('.menu-toggle .icon').textContent = open ? 'close' : 'menu';
});
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileNav.hidden) closeMenu(true); });
document.addEventListener('pointerdown', e => { if (!mobileNav.hidden && !mobileNav.contains(e.target as Node) && !menuToggle.contains(e.target as Node)) closeMenu(); });
window.matchMedia('(min-width: 801px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

let lastScroll = window.scrollY;
let scrollFrame = 0;
const header = $('#site-header');
window.addEventListener('scroll', () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > $('#inicio').offsetHeight - 80);
    if (Math.abs(y - lastScroll) > 5) {
      header.classList.toggle('is-hidden', y > lastScroll && y > 220 && mobileNav.hidden && !header.contains(document.activeElement));
      lastScroll = y;
    }
    scrollFrame = 0;
  });
}, { passive: true });
header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
const chapterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) document.querySelectorAll('.desktop-nav a').forEach(link => { if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }); });
}, { rootMargin: '-20% 0px -50% 0px' });
document.querySelectorAll('main>section').forEach(section => chapterObserver.observe(section));

// Native dialog: keyboard focus trapping, Escape dismissal and focus restoration.
const dialog = $<HTMLDialogElement>('#project-dialog');
let dialogTrigger: HTMLElement | null = null;
function openDialog(title: string, kicker: string, children: HTMLElement[]) {
  dialogTrigger = document.activeElement as HTMLElement;
  $('#dialog-title').textContent = title; $('#dialog-kicker').textContent = kicker;
  $('#dialog-content').replaceChildren(...children);
  dialog.showModal(); document.body.classList.add('dialog-open');
}
function paragraph(text: string, className = '') { const element = document.createElement('p'); element.textContent = text; element.className = className; return element; }
function heading(text: string) { const element = document.createElement('h3'); element.textContent = text; return element; }
function link(text: string, href: string) { const element = document.createElement('a'); element.textContent = text; element.href = href; element.className = 'button button-primary'; if (href.startsWith('https:')) { element.target = '_blank'; element.rel = 'noopener noreferrer'; } return element; }
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { const rect = dialog.getBoundingClientRect(); if (e.target === dialog && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) dialog.close(); });
dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); dialogTrigger?.focus({ preventScroll: true }); });
document.querySelectorAll<HTMLButtonElement>('.project-open').forEach(button => button.addEventListener('click', () => {
  const project = projects[button.dataset.id!];
  const list = document.createElement('ul'); project.approach.forEach(item => { const li = document.createElement('li'); li.textContent = item; list.append(li); });
  openDialog(project.title, project.category, [paragraph(project.intro), heading('La pregunta de diseño'), paragraph(project.challenge), heading('La dirección'), list, paragraph('Esta es una muestra visual del portafolio. No representa un encargo real, una empresa cliente ni resultados medidos.', 'dialog-notice')]);
}));
$('#profile-open').addEventListener('click', () => openDialog(profile.name, 'Perfil profesional · En preparación', [paragraph(profile.specialization), paragraph('Una mirada que conecta las necesidades de las personas con el detalle visual y las posibilidades de la tecnología.'), heading('Áreas de interés'), paragraph('Diseño UX/UI, sistemas de diseño, prototipado y experiencias web interactivas.'), paragraph('La trayectoria, los años de experiencia, las empresas y la formación se incorporarán con información verificada de Alexis.', 'dialog-notice'), link('Explorar GitHub', profile.github)]));
$('#contact-open').addEventListener('click', () => {
  if (profile.email) openDialog('Empecemos con un hola.', 'Contacto directo', [paragraph('Cuéntame qué tienes en mente y cómo puedo ayudarte.'), link(profile.email, `mailto:${profile.email}`)]);
  else openDialog('Empecemos con un hola.', 'Alexis Flores', [paragraph('Mi canal de contacto directo estará disponible pronto. Mientras tanto, puedes conocer mis proyectos públicos en GitHub.'), link('Visitar mi GitHub', profile.github)]);
});

const stages = [
  ['El punto de partida', 'Primero, las personas. Después, las pantallas.'],
  ['Diseño con intención', 'Cada decisión visual responde a una idea.'],
  ['La experiencia cobra vida', 'Probar, ajustar y cuidar la última interacción.'],
];
const tabs = [...document.querySelectorAll<HTMLButtonElement>('.process-tabs [role=tab]')];
let activeStage = 0;
let manualStageUntil = 0;
function setStage(index: number, manual = false) {
  if (manual) manualStageUntil = Date.now() + 10000;
  else if (Date.now() < manualStageUntil || $('.process-tabs').contains(document.activeElement) || $('#process-panel').contains(document.activeElement)) return;
  activeStage = index;
  tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
  $('#process-panel').setAttribute('aria-labelledby', `tab-${index}`);
  $('.editor-artboard').dataset.stage = String(index); $('#editor-stage').textContent = stages[index][0]; $('#process-description').textContent = stages[index][1]; $('#editor-percent').textContent = `0${index + 1} / 03`;
}
tabs.forEach((tab, index) => tab.addEventListener('click', () => setStage(index, true)));
$('.process-tabs').addEventListener('keydown', e => {
  let next = activeStage;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (activeStage + 1) % 3;
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (activeStage + 2) % 3;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = 2;
  else return;
  e.preventDefault(); setStage(next, true); tabs[next].focus();
});

let motionContext: gsap.Context | undefined;
function configureMotion() {
  motionContext?.revert();
  document.documentElement.classList.toggle('motion-paused', paused);
  $('.motion-toggle').setAttribute('aria-pressed', String(paused));
  $('.motion-toggle').setAttribute('aria-label', paused ? 'Activar animaciones' : 'Pausar animaciones');
  $('.motion-toggle .icon').textContent = paused ? 'play_arrow' : 'pause';
  scene?.setPaused(paused);
  if (paused) return;
  motionContext = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('.reveal').forEach(element => gsap.from(element, { opacity: 0, y: 36, duration: .85, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 93%', once: true } }));
    gsap.to('.hero-copy', { y: 60, opacity: .5, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.studio-orbit', { rotate: 35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    const media = gsap.matchMedia();
    media.add('(min-width: 900px)', () => {
      const cards = gsap.utils.toArray<HTMLElement>('.project-card');
      cards.slice(0, -1).forEach((card, i) => {
        ScrollTrigger.create({ id: `project-${i}`, trigger: card, start: 'top 105px', endTrigger: cards[cards.length - 1], end: 'top 190px', pin: true, pinSpacing: false, invalidateOnRefresh: true });
        gsap.to(card, { scale: .94 - (cards.length - 2 - i) * .025, opacity: .45, ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top 92%', end: 'top 155px', scrub: true } });
      });
      const canPin = innerHeight > $('.freelance').offsetHeight + 20;
      ScrollTrigger.create({ trigger: '.freelance', start: canPin ? 'top top' : 'top 30%', end: canPin ? '+=950' : 'bottom 70%', pin: canPin, anticipatePin: 1, onUpdate: self => setStage(Math.min(2, Math.floor(self.progress * 3))) });
      gsap.fromTo('.editor-demo', { rotate: 3, y: 30 }, { rotate: -2, y: -20, ease: 'none', scrollTrigger: { trigger: '.freelance', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.from('.contact-main h2', { y: 80, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 15%', scrub: 1 } });
    gsap.to('.footer-orbit', { rotate: 130, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });
  });
  ScrollTrigger.refresh();
}
$('.motion-toggle').addEventListener('click', () => { paused = !paused; configureMotion(); setStatus(paused ? 'Animaciones pausadas.' : 'Animaciones activadas.'); });
reducedMotion.addEventListener('change', e => { paused = e.matches; configureMotion(); });
configureMotion();
document.querySelectorAll<HTMLElement>('.project-card').forEach((card, i) => card.addEventListener('focusin', () => {
  const pin = ScrollTrigger.getById(`project-${i}`);
  if (pin && window.scrollY > pin.start + 10) window.scrollTo({ top: Math.max(0, pin.start - 10), behavior: 'instant' });
}));

const loader = $('.preloader');
function setProgress(percent: number) { $('#load-progress').textContent = String(percent).padStart(2, '0'); $('.loader-line > span').style.width = `${percent}%`; }
setProgress(45);
const loaderStarted = performance.now();
async function finishLoader() {
  await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1100))]);
  setProgress(100);
  await new Promise(resolve => setTimeout(resolve, Math.max(0, 650 - (performance.now() - loaderStarted))));
  loader.classList.add('is-loaded');
  if (!paused) gsap.from('.hero-topline, .hero h1, .hero-copy > p, .hero-buttons', { y: 24, opacity: 0, duration: .9, stagger: .11, ease: 'power3.out' });
}
void finishLoader();
const poster = $<HTMLImageElement>('.studio-poster');
poster.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

// Heavy WebGL code loads after the readable first paint, and never on data-saver connections.
let scenePromise: Promise<void> | undefined;
function loadScene() {
  if (scenePromise) return scenePromise;
  scenePromise = import('./scene').then(async module => {
    scene = await module.createStudio({ paused, onStatus: setStatus });
    scene.setPaused(paused);
    scene.setTheme(document.documentElement.dataset.theme || 'dark');
  }).catch(() => { scenePromise = undefined; $('#cat-label').textContent = 'Tu cómplice creativo.'; $('.cat-action').textContent = 'Reintentar 3D'; setStatus('La vista 3D no está disponible. Se muestra la imagen del estudio.'); });
  return scenePromise;
}
const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
// Progressive enhancement: a real Blender render appears immediately. WebGL is
// activated by exploration instead of competing with the page's first render.
$('#cat-label').textContent = 'Conoce a tu cómplice.'; $('.cat-action').textContent = 'Explorar 3D';
if (!reducedMotion.matches && !connection?.saveData && matchMedia('(hover: hover) and (min-width: 801px)').matches) {
  $('#studio').addEventListener('pointerenter', () => { void loadScene().then(() => { if (scene) { $('#cat-label').textContent = 'Shhh… está creando.'; $('.cat-action').textContent = 'Despertar'; } }); }, { once: true });
}
if (!reducedMotion.matches && !connection?.saveData) {
  const footerEntrance = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { void loadScene(); footerEntrance.disconnect(); }
  }, { rootMargin: '180px' });
  footerEntrance.observe($('#contacto'));
}
$('#wake-cat').addEventListener('click', async () => {
  const button = $<HTMLButtonElement>('#wake-cat'); button.disabled = true;
  try { if (!scene) await loadScene(); if (scene) await scene.wakeCat(); } finally { button.disabled = false; }
});
$('#year').textContent = String(new Date().getFullYear());

window.addEventListener('pagehide', () => scene?.setPaused(true));
window.addEventListener('pageshow', () => scene?.setPaused(paused));
