import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { setupPortrait } from './portrait';
import { setupContact } from './contact';
import type { Experience } from './scene';
import './gallery.css';
import './timeline.css';
import './refinements.css';

gsap.registerPlugin(ScrollTrigger, SplitText);
const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const $$ = <T extends Element = HTMLElement>(selector: string) => Array.from(document.querySelectorAll<T>(selector));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (v: number) => Math.max(0, Math.min(1, v));
let experience: Experience | undefined, lenis: Lenis | undefined;
let motion: gsap.Context | undefined, galleryTrigger: ScrollTrigger | undefined;
let loaded = false, menuOpen = false, journeyProgress = 0, transitionProgress = 0, galleryProgress = 0, galleryActive = false;
const projectSlides = $$('.project-slide');
const splitHeadingsSeen = new WeakSet<HTMLElement>();
const loader = $('#preloader');
const nav = $('#site-nav');
const pageParts = [$('.skip-link'), $('header'), $('main'), $('footer')];
pageParts.forEach(part => part.inert = true);
const abort = new AbortController();
$('#year').textContent = String(new Date().getFullYear());
setupPortrait($('.about-portrait'), reduced);
setupContact($<HTMLFormElement>('#contact-form'));

const intro = gsap.timeline();
if (!reduced.matches) intro.from('.loader-mark span', { yPercent: 125, rotate: 10, duration: .85, stagger: .13, ease: 'power4.out' }).from('.loader-mark b', { scale: 0, rotate: -30, duration: .6, ease: 'back.out(2)' }, '-=.4');
const introReady = new Promise<void>(resolve => window.setTimeout(resolve, reduced.matches ? 0 : 1900));

function scrollState() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max ? window.scrollY / max : 0;
  $('.rail-progress i').style.transform = innerWidth <= 800 ? `scaleX(${p})` : `scaleY(${p})`;
  syncScene();
}
window.addEventListener('scroll', scrollState, { passive: true });

function setMenu(open: boolean, restoreFocus = false) {
  menuOpen = open;
  nav.hidden = !open;
  document.body.classList.toggle('nav-open', open);
  $('main').inert = open || !loaded;
  $('footer').inert = open || !loaded;
  $('.menu-toggle').setAttribute('aria-expanded', String(open));
  $('.menu-toggle').setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  $('.menu-toggle .icon').textContent = open ? 'close' : 'menu';
  $('.menu-label').textContent = open ? 'CERRAR' : 'MENÚ';
  if (open) {
    lenis?.stop();
    if (!reduced.matches) gsap.fromTo('.nav-links > a, .projects-disclosure', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .06, ease: 'power3.out', clearProps: 'all' });
    nav.querySelector<HTMLElement>('.nav-links a')?.focus({ preventScroll: true });
  } else {
    lenis?.start();
    if (restoreFocus) $('.menu-toggle').focus({ preventScroll: true });
  }
}
$('.menu-toggle').addEventListener('click', () => setMenu(!menuOpen));
document.addEventListener('keydown', event => {
  if (!menuOpen) return;
  if (event.key === 'Escape') { setMenu(false, true); return; }
  if (event.key === 'Tab') {
    const controls = $$<HTMLElement>('header a, header button, #site-nav a, #site-nav button').filter(el => el.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
const projectToggle = $('#projects-toggle'), projectMenu = $('#projects-dropdown');
projectToggle.addEventListener('click', () => {
  const open = projectMenu.hidden;
  projectMenu.hidden = !open;
  projectToggle.setAttribute('aria-expanded', String(open));
  $('#projects-toggle .icon').textContent = open ? 'close' : 'add';
});

function scrollTo(target: HTMLElement | number, done?: () => void) {
  if (lenis) lenis.scrollTo(target, { duration: 1.25, onComplete: done });
  else {
    const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY - (innerWidth <= 800 ? 88 : 24);
    window.scrollTo({ top: y, behavior: reduced.matches ? 'instant' : 'smooth' });
    done?.();
  }
}
function showProject(index: number, focus = false) {
  const target = projectSlides[index];
  const done = focus ? () => { const h = target.querySelector<HTMLElement>('h3')!; h.tabIndex = -1; h.focus({ preventScroll: true }); } : undefined;
  if (galleryTrigger) scrollTo(galleryTrigger.start + (galleryTrigger.end - galleryTrigger.start) * index / (projectSlides.length - 1) + (index === 0 ? 1 : 0), done);
  else scrollTo(target, done);
}
$$<HTMLAnchorElement>('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  event.preventDefault();
  setMenu(false);
  history.replaceState(null, '', link.hash);
  const projectIndex = projectSlides.indexOf(target);
  if (projectIndex >= 0) { showProject(projectIndex, true); return; }
  const focus = target.querySelector<HTMLElement>('h1,h2,h3') || target;
  focus.tabIndex = -1;
  scrollTo(target, () => focus.focus({ preventScroll: true }));
}));
$$('[data-project-index]').forEach(button => button.addEventListener('click', () => showProject(Number(button.dataset.projectIndex))));

function syncScene() {
  const hero = $('.journey').getBoundingClientRect(), foot = $('.contact').getBoundingClientRect();
  const stage = $('.showcase-window'), stageBounds = stage.getBoundingClientRect();
  // Prepare the laptop before it enters view and keep it in place through both
  // ends of the pin. The footer borrows the renderer once the gallery leaves.
  galleryActive = stage.classList.contains('is-pinned-gallery') && stageBounds.top < innerHeight + 400 && stageBounds.bottom > 0;
  const footerActive = !galleryActive && foot.top < innerHeight && foot.bottom > 0;
  experience?.setShowcase(galleryActive, galleryProgress, Math.round(galleryProgress * (projectSlides.length - 1)));
  experience?.setFooter(footerActive, clamp((innerHeight - foot.top) / (innerHeight + foot.height)));
  experience?.setVisible(footerActive || galleryActive || (hero.top < innerHeight && hero.bottom > 0));
}
const lenisTick = (seconds: number) => lenis?.raf(seconds * 1000);
function setupMotion() {
  motion?.revert();
  lenis?.destroy(); lenis = undefined;
  gsap.ticker.remove(lenisTick);
  galleryTrigger = undefined; galleryActive = false;
  transitionProgress = 0;
  experience?.setTransition(0);
  projectSlides.forEach(slide => slide.inert = false);
  $('.showcase-window').classList.remove('is-pinned-gallery');
  experience?.setPaused(reduced.matches);
  if (!reduced.matches) {
    lenis = new Lenis({ lerp: .085, smoothWheel: true, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(lenisTick); gsap.ticker.lagSmoothing(0);
    if (!loaded || menuOpen) lenis.stop();
  }
  motion = gsap.context(() => {
    ScrollTrigger.create({ trigger: '.journey', start: 'top top', endTrigger: '#producto', end: 'bottom bottom', onUpdate: self => {
      journeyProgress = self.progress; experience?.setProgress(self.progress);
      $('.journey').classList.toggle('has-scrolled', self.progress > .1);
      $('.scene-meter i').style.transform = `scaleX(${self.progress})`;
      const chapter = Math.min(3, Math.floor(self.progress * 3.5));
      $('#scene-index').textContent = `0${chapter + 1} / 04`;
      $('#scene-label').textContent = ['UX/UI & FRONT-END', 'EXPERIENCIA DE USUARIO', 'DESARROLLO WEB', 'PRODUCTOS DIGITALES'][chapter];
    }, onToggle: syncScene });
    ScrollTrigger.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: self => $('.journey').classList.toggle('hero-is-visible', self.isActive) });
    const transition = document.querySelector<HTMLElement>('.journey-transition');
    if (transition) {
      ScrollTrigger.create({ trigger: transition, start: 'top 55%', end: 'bottom bottom', onUpdate: self => {
        transitionProgress = reduced.matches ? 0 : self.progress;
        experience?.setTransition(transitionProgress);
        $('.journey').classList.toggle('is-transitioning', transitionProgress > 0);
      }, onToggle: syncScene });
      if (!reduced.matches) gsap.to('.chapter-outro .chapter-copy', { opacity: 0, y: -48, ease: 'none', scrollTrigger: { trigger: transition, start: 'top 90%', end: 'top 40%', scrub: true } });
    }
    ScrollTrigger.create({ trigger: '.contact', start: 'top bottom', end: 'bottom top', onUpdate: syncScene, onToggle: syncScene });
    if (reduced.matches) return;
    gsap.context(splitContext => {
      const splits: SplitText[] = [];
      let disposed = false;
      const observer = new IntersectionObserver(entries => {
        if (disposed) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const heading = entry.target as HTMLElement;
          observer.unobserve(heading);
          if (splitHeadingsSeen.has(heading)) continue;
          splitHeadingsSeen.add(heading);
          splitContext.add(() => {
            const accessibleText = heading.innerText.replace(/\s+/g, ' ').trim();
            let complete = false;
            splits.push(SplitText.create(heading, {
              type: 'lines', mask: 'lines', autoSplit: true, aria: 'auto',
              onSplit(self) {
                heading.setAttribute('aria-label', accessibleText);
                if (complete) return gsap.set(self.lines, { clearProps: 'transform' });
                return gsap.from(self.lines, {
                  yPercent: 110, rotate: 2, duration: .95, stagger: .085, ease: 'power3.out',
                  onComplete: () => { complete = true; },
                });
              },
            }));
          });
        }
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
      $$('[data-split]').forEach(heading => {
        if (!splitHeadingsSeen.has(heading)) observer.observe(heading);
      });
      return () => { disposed = true; observer.disconnect(); splits.forEach(split => split.revert()); };
    });
    $$('.section-wipe').forEach(wipe => {
      gsap.fromTo(wipe.querySelectorAll('i'), { scaleY: .03 }, { scaleY: 1, stagger: .07, ease: 'none', scrollTrigger: { trigger: wipe, start: 'top 95%', end: 'bottom 40%', scrub: .45 } });
      gsap.from(wipe.querySelector('span'), { yPercent: 45, opacity: 0, scrollTrigger: { trigger: wipe, start: 'top 70%', end: 'top 35%', scrub: .3 } });
    });
    const path = $<SVGPathElement>('.route-ink');
    const length = path.getTotalLength();
    gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, autoRound: false, ease: 'none', scrollTrigger: { trigger: '.career-route', start: 'top 65%', end: 'bottom 65%', scrub: .45 } });
    $$('.career-stop').forEach(stop => {
      gsap.fromTo(stop.querySelector('.career-year'), { y: 64, rotate: -4 }, { y: -32, rotate: 2, ease: 'none', scrollTrigger: { trigger: stop, start: 'top bottom', end: 'bottom top', scrub: .8 } });
      gsap.from(stop.querySelector('.career-card'), { x: stop.classList.contains('stop-right') ? 56 : -56, duration: .95, ease: 'power3.out', scrollTrigger: { trigger: stop, start: 'top 82%', once: true } });
    });
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1001px) and (min-height: 620px)', () => {
      const stage = $('.showcase-window'), track = $('.showcase-track');
      stage.classList.add('is-pinned-gallery');
      const fallback = document.createElement('div');
      fallback.className = 'showcase-fallbacks';
      const visuals = projectSlides.map(slide => slide.querySelector<HTMLElement>('.project-visual')!);
      visuals.forEach(visual => fallback.append(visual));
      stage.append(fallback);
      const restoreGallery = () => {
        visuals.forEach((visual, index) => { visual.hidden = false; projectSlides[index].append(visual); });
        fallback.remove();
        stage.classList.remove('is-pinned-gallery'); galleryTrigger = undefined; galleryActive = false;
        projectSlides.forEach(slide => slide.inert = false); syncScene();
      };
      // A pinned panel must contain all its text, including at browser zoom.
      // Short viewports use the ordinary document flow instead of clipping it.
      const fits = projectSlides.every(slide => {
        const information = slide.querySelector<HTMLElement>('.project-information')!;
        return information.getBoundingClientRect().bottom <= slide.getBoundingClientRect().bottom - 84;
      });
      if (!fits) { restoreGallery(); return; }
      const distance = () => stage.clientHeight * (projectSlides.length - 1);
      const update = () => {
        const index = Math.round(galleryProgress * (projectSlides.length - 1));
        stage.dataset.activeProject = String(index);
        $$('[data-project-index]').forEach((b, i) => b.setAttribute('aria-current', String(i === index)));
        projectSlides.forEach((slide, i) => slide.inert = i !== index);
        visuals.forEach((visual, i) => visual.hidden = i !== index);
        $('.gallery-progress i').style.transform = `scaleX(${1 / projectSlides.length + galleryProgress * (projectSlides.length - 1) / projectSlides.length})`;
        syncScene();
      };
      const tween = gsap.to(track, { y: () => -distance(), ease: 'none', onUpdate() { galleryProgress = this.progress(); update(); }, scrollTrigger: { trigger: stage, start: 'top top', end: () => `+=${distance() * 1.2}`, pin: true, scrub: .45, anticipatePin: 1, invalidateOnRefresh: true, onToggle: syncScene } });
      galleryTrigger = tween.scrollTrigger;
      galleryProgress = tween.progress(); update();
      return restoreGallery;
    });
  });
  ScrollTrigger.refresh(); scrollState(); syncScene();
}
reduced.addEventListener('change', setupMotion);
let viewportWidth = innerWidth, viewportHeight = innerHeight, resizeTimer = 0;
window.addEventListener('resize', () => {
  const changed = innerWidth !== viewportWidth || (innerWidth > 1000 && innerHeight !== viewportHeight);
  viewportWidth = innerWidth; viewportHeight = innerHeight;
  if (!loaded || !changed) return;
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(setupMotion, 160);
}, { passive: true });
document.addEventListener('pointermove', event => { if (event.pointerType === 'mouse') experience?.setPointer(event.clientX / innerWidth * 2 - 1, event.clientY / innerHeight * 2 - 1); }, { passive: true });

async function finishLoading(success: boolean) {
  if (loaded) return;
  loaded = true; clearTimeout(timeout);
  if (!success) document.body.classList.add('scene-fallback');
  await introReady;
  pageParts.forEach(part => part.inert = false);
  setupMotion(); lenis?.start();
  loader.classList.add('is-leaving');
  const exit = gsap.timeline({ onComplete: () => { loader.remove(); ScrollTrigger.refresh(); if (location.hash) { const target = document.getElementById(location.hash.slice(1)); if (target) { const i = projectSlides.indexOf(target); if (i >= 0) showProject(i); else scrollTo(target); } } } });
  exit.to('.loader-mark', { yPercent: -35, opacity: 0, duration: reduced.matches ? 0 : .45, ease: 'power3.in' })
    .to('.loader-shutters i', { yPercent: -100, duration: reduced.matches ? 0 : .8, stagger: reduced.matches ? 0 : .06, ease: 'power4.inOut' }, reduced.matches ? 0 : .2);
  if (!reduced.matches) exit.from('.hero h1 > span', { yPercent: 45, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', clearProps: 'all' }, .5);
}
const timeout = window.setTimeout(() => { abort.abort(); void finishLoading(false); }, 12000);
async function boot() {
  try {
    const [module] = await Promise.all([import('./scene'), document.fonts.ready]);
    if (abort.signal.aborted) return;
    experience = await module.createExperience($('#experience-canvas'), $('#footer-canvas'), { progress: () => {}, signal: abort.signal });
    experience.setProgress(journeyProgress); experience.setPaused(reduced.matches);
    experience.setTransition(transitionProgress);
    syncScene(); await finishLoading(true);
  } catch (error) {
    if (!abort.signal.aborted) console.warn('Vista 3D no disponible; el contenido sigue accesible.', error);
    await finishLoading(false);
  }
}
void boot();
