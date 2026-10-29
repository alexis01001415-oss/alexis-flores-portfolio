import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './product-design.css';

type Frame = ImageBitmap;

/** Scroll-scrubbed Blender renders, with a bounded decoded-image cache. */
export function setupProductDesign(reduced: boolean): () => void {
  const section = document.querySelector<HTMLElement>('#diseno-3d');
  if (!section) return () => {};
  const story = section.querySelector<HTMLElement>('.product-case-story')!;
  const stage = section.querySelector<HTMLElement>('.product-case-stage')!;
  const canvas = section.querySelector<HTMLCanvasElement>('.product-sequence')!;
  const visual = section.querySelector<HTMLElement>('.product-case-visual')!;
  const progressBar = section.querySelector<HTMLElement>('.product-sequence-progress i')!;
  const phases = Array.from(section.querySelectorAll<HTMLElement>('[data-product-phase]'));
  const caption = section.querySelector<HTMLElement>('.product-case-caption')!;
  const notes = Array.from(section.querySelectorAll<HTMLElement>('.case-note'));
  const frameCount = Number(story.dataset.frames) || 90;
  const prefix = `${import.meta.env.BASE_URL}images/seicento/case/frame-`;
  let disposed = false;
  let inRange = false;
  let drawRequest = 0;
  let target = 0;
  let lastDrawn = -1;
  let activeLoads = 0;
  let sequenceUnavailable = false;
  let restoreSequenceFallback = () => {};
  let width = 1;
  let height = 1;
  let currentPhase = -1;
  const bitmaps = new Map<number, Frame>();
  const pending = new Set<number>();
  const failed = new Set<number>();
  const controllers = new Set<AbortController>();
  const cacheLimit = innerWidth <= 800 ? 16 : 28;
  const lookAhead = innerWidth <= 800 ? 5 : 8;
  const cleanup: Array<() => void> = [];
  const context = canvas.getContext('2d', { alpha: true });
  const canAnimate = !reduced && innerHeight >= 660 && Boolean(context);
  const compact = innerWidth <= 800;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const range = (p: number, start: number, end: number) => clamp((p - start) / (end - start));
  const showText = (element: HTMLElement, amount: number, direction = 1) => {
    const visible = clamp(amount);
    element.style.opacity = String(visible);
    element.style.filter = `blur(${(1 - visible) * 8}px)`;
    element.style.transform = `translateY(${(1 - visible) * 24 * direction}px)`;
  };
  const windowed = (p: number, a: number, b: number, c: number, d: number) => range(p, a, b) * (1 - range(p, c, d));

  function paint() {
    drawRequest = 0;
    if (disposed || !inRange || document.hidden || !context || !bitmaps.size) return;
    let nearest = target;
    if (!bitmaps.has(nearest)) {
      nearest = Array.from(bitmaps.keys()).reduce((best, index) =>
        Math.abs(index - target) < Math.abs(best - target) ? index : best);
    }
    const frame = bitmaps.get(nearest)!;
    if (nearest === lastDrawn) return;
    lastDrawn = nearest;
    const scale = Math.min(width / frame.width, height / frame.height);
    context.clearRect(0, 0, width, height);
    context.drawImage(frame, (width - frame.width * scale) / 2, (height - frame.height * scale) / 2,
      frame.width * scale, frame.height * scale);
    stage.classList.add('has-sequence');
    canvas.dataset.frame = String(nearest);
  }

  function requestPaint() {
    if (!disposed && inRange && !document.hidden && !drawRequest) drawRequest = requestAnimationFrame(paint);
  }

  function trimCache() {
    if (bitmaps.size <= cacheLimit) return;
    const farthest = Array.from(bitmaps.keys()).sort((a, b) => Math.abs(b - target) - Math.abs(a - target));
    for (const index of farthest) {
      if (bitmaps.size <= cacheLimit) break;
      if (index === lastDrawn) continue;
      bitmaps.get(index)?.close();
      bitmaps.delete(index);
    }
  }

  function desiredFrames() {
    const wanted = [target];
    for (let offset = 1; offset <= lookAhead; offset++) {
      if (target + offset < frameCount) wanted.push(target + offset);
      if (target - offset >= 0) wanted.push(target - offset);
    }
    return wanted;
  }

  function pump() {
    if (disposed || sequenceUnavailable || !inRange || document.hidden || !canAnimate) return;
    for (const index of desiredFrames()) {
      if (activeLoads >= 3) break;
      if (bitmaps.has(index) || pending.has(index) || failed.has(index)) continue;
      const controller = new AbortController();
      controllers.add(controller);
      pending.add(index);
      activeLoads++;
      void fetch(`${prefix}${String(index).padStart(3, '0')}.webp`, { signal: controller.signal })
        .then(response => {
          if (!response.ok) throw new Error('Product frame unavailable');
          return response.blob();
        })
        .then(blob => createImageBitmap(blob))
        .then(bitmap => {
          if (disposed) { bitmap.close(); return; }
          bitmaps.set(index, bitmap);
          trimCache();
          requestPaint();
        })
        .catch(error => {
          if (!disposed && error?.name !== 'AbortError') failed.add(index);
        })
        .finally(() => {
          pending.delete(index);
          controllers.delete(controller);
          activeLoads--;
          if (!disposed && failed.size >= 6 && !bitmaps.size && !sequenceUnavailable) {
            sequenceUnavailable = true;
            restoreSequenceFallback();
            return;
          }
          pump();
        });
    }
  }

  function resize() {
    if (disposed || !context) return;
    const bounds = visual.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    width = Math.max(1, Math.round(bounds.width * ratio));
    height = Math.max(1, Math.round(bounds.height * ratio));
    canvas.width = width;
    canvas.height = height;
    lastDrawn = -1;
    requestPaint();
  }

  function progress(value: number) {
    // Hold the closed case while the introduction is read, then open it.
    const frameProgress = range(value, .09, .95);
    target = Math.min(frameCount - 1, Math.max(0, Math.round(frameProgress * (frameCount - 1))));
    progressBar.style.transform = `scaleX(${value})`;
    showText(caption, 1 - range(value, .1, .23), -1);
    if (compact) {
      showText(notes[0], windowed(value, .34, .41, .53, .59));
      showText(notes[1], windowed(value, .59, .65, .85, .92));
    } else {
      notes.forEach(note => showText(note, windowed(value, .35, .43, .76, .86)));
    }
    const nextPhase = frameProgress < 0.3 ? 0 : frameProgress < 0.65 ? 1 : 2;
    if (currentPhase !== nextPhase) {
      currentPhase = nextPhase;
      phases.forEach((phase, index) => phase.classList.toggle('is-active', index === nextPhase));
    }
    requestPaint();
    pump();
  }

  if (canAnimate) {
    section.classList.add('has-product-motion');
    const observer = new IntersectionObserver(entries => {
      inRange = entries[0]?.isIntersecting ?? false;
      if (inRange) { resize(); pump(); requestPaint(); }
      else { cancelAnimationFrame(drawRequest); drawRequest = 0; }
    }, { rootMargin: '700px 0px' });
    observer.observe(story);
    cleanup.push(() => observer.disconnect());
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(visual);
    cleanup.push(() => resizeObserver.disconnect());
    const playhead = { value: 0 };
    const scrub = gsap.to(playhead, {
      value: 1, ease: 'none', onUpdate: () => progress(playhead.value),
      scrollTrigger: {
        trigger: story, start: 'top top', end: 'bottom bottom', scrub: .35,
        invalidateOnRefresh: true,
      },
    });
    cleanup.push(() => { scrub.scrollTrigger?.kill(); scrub.kill(); });
    restoreSequenceFallback = () => {
      observer.disconnect(); resizeObserver.disconnect();
      controllers.forEach(controller => controller.abort());
      cancelAnimationFrame(drawRequest); drawRequest = 0; inRange = false;
      scrub.scrollTrigger?.kill(); scrub.kill();
      section.classList.remove('has-product-motion');
      [caption, ...notes].forEach(el => { el.style.removeProperty('opacity'); el.style.removeProperty('filter'); el.style.removeProperty('transform'); });
      ScrollTrigger.refresh();
    };
    progress(0);
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(drawRequest); drawRequest = 0; }
      else { pump(); requestPaint(); }
    };
    document.addEventListener('visibilitychange', visibility);
    cleanup.push(() => document.removeEventListener('visibilitychange', visibility));
  }

  // The bottle is actual Blender geometry. Fetch and create its WebGL view only
  // when this part of the portfolio approaches the viewport.
  const rubiStory = section.querySelector<HTMLElement>('.rubi-story')!;
  const rubiCanvas = section.querySelector<HTMLCanvasElement>('.rubi-model canvas')!;
  const rubiIntro = section.querySelector<HTMLElement>('.rubi-heading')!;
  const rubiNotes = Array.from(section.querySelectorAll<HTMLElement>('[data-rubi-note]'));
  const rubiProgress = section.querySelector<HTMLElement>('.rubi-progress i')!;
  if (!reduced && innerHeight >= 660) {
    type RubiView = Awaited<ReturnType<typeof import('./rubi-scene')['createRubiScene']>>;
    let view: RubiView | undefined;
    let started = false;
    let visible = false;
    let rubiValue = 0;
    const modelAbort = new AbortController();
    section.classList.add('has-rubi-motion');
    const updateRubi = (value: number) => {
      rubiValue = value;
      view?.setProgress(value);
      if (compact) {
        const detail = range(value, .08, .24);
        const top = innerWidth <= 560 ? 320 : 260;
        rubiStory.style.setProperty('--rubi-top', `${top + (88 - top) * detail}px`);
        rubiStory.style.setProperty('--rubi-bottom', `${72 + 208 * detail}px`);
      }
      showText(rubiIntro, 1 - range(value, .08, .2), -1);
      showText(rubiNotes[0], windowed(value, .19, .25, .38, .46));
      showText(rubiNotes[1], windowed(value, .44, .5, .62, .7));
      showText(rubiNotes[2], windowed(value, .69, .76, .96, 1.03));
      rubiProgress.style.transform = `scaleX(${value})`;
    };
    const playhead = { value: 0 };
    const tween = gsap.to(playhead, { value: 1, ease: 'none', onUpdate: () => updateRubi(playhead.value),
      scrollTrigger: { trigger: rubiStory, start: compact ? 'top 72px' : 'top top', end: 'bottom bottom', scrub: .5, invalidateOnRefresh: true },
    });
    updateRubi(tween.progress());
    const observer = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? false;
      view?.setActive(visible && !document.hidden);
      if (!visible || started || disposed) return;
      started = true;
      void import('./rubi-scene').then(module => {
        if (disposed) return undefined;
        return module.createRubiScene(rubiCanvas, modelAbort.signal);
      }).then(result => {
        if (!result) return;
        if (disposed) { result.dispose(); return; }
        view = result;
        view.setProgress(rubiValue);
        view.setActive(visible && !document.hidden);
      }).catch(() => {
        if (disposed) return;
        // A readable, unpinned poster and notes survive unavailable WebGL/assets.
        tween.scrollTrigger?.kill(); tween.kill();
        section.classList.remove('has-rubi-motion');
        [rubiIntro, ...rubiNotes].forEach(el => { el.style.removeProperty('opacity'); el.style.removeProperty('filter'); el.style.removeProperty('transform'); });
        ScrollTrigger.refresh();
      });
    }, { rootMargin: '500px 0px' });
    observer.observe(rubiStory);
    const onVisibility = () => view?.setActive(visible && !document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    cleanup.push(() => {
      modelAbort.abort(); observer.disconnect(); view?.dispose();
      tween.scrollTrigger?.kill(); tween.kill();
      document.removeEventListener('visibilitychange', onVisibility);
      section.classList.remove('has-rubi-motion');
      [rubiIntro, ...rubiNotes].forEach(el => { el.style.removeProperty('opacity'); el.style.removeProperty('filter'); el.style.removeProperty('transform'); });
      rubiProgress.style.removeProperty('transform');
      rubiStory.style.removeProperty('--rubi-top');
      rubiStory.style.removeProperty('--rubi-bottom');
    });
  }

  if (!reduced) {
    const panels = section.querySelectorAll<HTMLElement>('.rubi-panel');
    panels.forEach((panel, index) => {
      const picture = panel.querySelector('.rubi-image');
      const movement = gsap.fromTo(picture, {
        yPercent: index === 1 ? 12 : 6,
        scale: 1.07,
      }, {
        yPercent: 0, scale: 1, ease: 'none',
        scrollTrigger: { trigger: panel, start: 'top bottom', end: 'center center', scrub: .6 },
      });
      cleanup.push(() => { movement.scrollTrigger?.kill(); movement.kill(); });
    });
    const rule = section.querySelector('.rubi-rule');
    const line = gsap.fromTo(rule, { scaleX: 0 }, {
      scaleX: 1, ease: 'none', transformOrigin: 'left center',
      scrollTrigger: { trigger: '.rubi-photography', start: 'top 85%', end: 'top 20%', scrub: .4 },
    });
    cleanup.push(() => { line.scrollTrigger?.kill(); line.kill(); });
  }

  return () => {
    disposed = true;
    cancelAnimationFrame(drawRequest);
    controllers.forEach(controller => controller.abort());
    cleanup.forEach(dispose => dispose());
    bitmaps.forEach(bitmap => bitmap.close());
    bitmaps.clear();
    section.classList.remove('has-product-motion');
    stage.classList.remove('has-sequence');
    progressBar.style.removeProperty('transform');
    phases.forEach(phase => phase.classList.remove('is-active'));
    [caption, ...notes].forEach(el => { el.style.removeProperty('opacity'); el.style.removeProperty('filter'); el.style.removeProperty('transform'); });
    canvas.removeAttribute('data-frame');
  };
}
