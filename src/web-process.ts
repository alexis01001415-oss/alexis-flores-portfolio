import gsap from 'gsap';
import './web-process.css';

/** One deliberately activated preview at a time; no remote WebGL during page load. */
export function setupWebProcess(): () => void {
  const root = document.querySelector<HTMLElement>('#en-proceso');
  if (!root) return () => {};
  const section = root;
  const choices = [...section.querySelectorAll<HTMLButtonElement>('[data-process-project]')];
  const title = section.querySelector<HTMLElement>('[data-process-title]')!;
  const copy = section.querySelector<HTMLElement>('[data-process-copy]')!;
  const category = section.querySelector<HTMLElement>('[data-process-category]')!;
  const address = section.querySelector<HTMLElement>('[data-process-address]')!;
  const image = section.querySelector<HTMLImageElement>('[data-process-image]')!;
  const caption = section.querySelector<HTMLElement>('[data-process-caption]')!;
  const external = section.querySelector<HTMLAnchorElement>('[data-process-external]')!;
  const viewport = section.querySelector<HTMLElement>('.process-viewport')!;
  const launcher = section.querySelector<HTMLElement>('.process-launcher')!;
  const start = section.querySelector<HTMLButtonElement>('[data-process-start]')!;
  const close = section.querySelector<HTMLButtonElement>('[data-process-close]')!;
  const status = section.querySelector<HTMLElement>('[data-process-status]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 0;
  let frame: HTMLIFrameElement | null = null;
  let pending = 0;
  let transition: gsap.core.Tween | undefined;
  const events = new AbortController();
  const allowed = new Set(['https://alexis01001415-oss.github.io', 'https://nurtured-bear-621750.framer.app']);

  function stop(restoreFocus = false) {
    window.clearTimeout(pending);
    frame?.remove();
    frame = null;
    viewport.classList.remove('is-live');
    viewport.removeAttribute('data-lenis-prevent');
    launcher.hidden = false;
    close.hidden = true;
    status.textContent = 'VISTA PREVIA';
    if (restoreFocus) start.focus({ preventScroll: true });
  }

  function select(index: number) {
    if (!choices[index]) return;
    stop();
    selected = index;
    const item = choices[index].dataset;
    choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    title.textContent = item.title!;
    copy.textContent = item.copy!;
    category.textContent = item.category!;
    image.src = item.image!;
    image.alt = item.alt!;
    caption.textContent = item.caption!;
    external.href = item.url!;
    external.setAttribute('aria-label', `Abrir ${item.title} en otra pestaña`);
    address.textContent = new URL(item.url!).hostname + new URL(item.url!).pathname;
    start.setAttribute('aria-label', `Explorar ${item.title} aquí`);
    section.dataset.current = item.processProject;
    transition?.kill();
    if (!reduced.matches) transition = gsap.fromTo(image, { opacity: .35, scale: 1.035 }, { opacity: 1, scale: 1, duration: .65, ease: 'power2.out', clearProps: 'transform,opacity' });
  }

  choices.forEach((button, index) => {
    button.addEventListener('click', () => select(index), { signal: events.signal });
    button.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % choices.length
        : event.key === 'ArrowLeft' ? (index + choices.length - 1) % choices.length
          : event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : -1;
      if (next < 0) return;
      event.preventDefault();
      select(next);
      choices[next].focus({ preventScroll: true });
    }, { signal: events.signal });
  });

  start.addEventListener('click', () => {
    if (frame) return;
    const item = choices[selected].dataset;
    const url = new URL(item.url!);
    if (!allowed.has(url.origin)) return;
    const embed = document.createElement('iframe');
    embed.title = `Sitio interactivo: ${item.title}`;
    embed.referrerPolicy = 'strict-origin-when-cross-origin';
    // These are the owner's sites; permit their interaction, never top navigation.
    embed.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads');
    embed.allow = 'fullscreen';
    embed.src = url.href;
    embed.addEventListener('load', () => {
      if (frame !== embed) return;
      window.clearTimeout(pending);
      status.textContent = 'VISTA INTERACTIVA';
    }, { once: true });
    frame = embed;
    viewport.append(embed);
    viewport.classList.add('is-live');
    viewport.setAttribute('data-lenis-prevent', '');
    launcher.hidden = true;
    close.hidden = false;
    status.textContent = 'CARGANDO SITIO…';
    pending = window.setTimeout(() => {
      if (frame === embed) status.textContent = 'TAMBIÉN PUEDES ABRIR EL SITIO EN OTRA PESTAÑA';
    }, 12000);
    close.focus({ preventScroll: true });
  }, { signal: events.signal });
  close.addEventListener('click', () => stop(true), { signal: events.signal });
  section.addEventListener('keydown', event => {
    if (event.key === 'Escape' && frame) stop(true);
  }, { signal: events.signal });
  // Keep old shared #gomez links meaningful after moving this unfinished case here.
  const chooseHash = () => { if (location.hash === '#gomez') select(choices.findIndex(button => button.id === 'gomez')); };
  window.addEventListener('hashchange', chooseHash, { signal: events.signal });
  document.addEventListener('click', event => {
    if ((event.target as Element | null)?.closest('a[href="#gomez"]')) select(choices.findIndex(button => button.id === 'gomez'));
  }, { signal: events.signal });
  const observer = new IntersectionObserver(entries => {
    if (!entries[0]?.isIntersecting && frame) stop();
  }, { rootMargin: '200px 0px' });
  observer.observe(viewport);
  chooseHash();

  return () => {
    stop();
    transition?.kill();
    events.abort();
    observer.disconnect();
  };
}
