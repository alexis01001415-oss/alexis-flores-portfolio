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
  const frameCount = Number(story.dataset.frames) || 90;
  const prefix = `${import.meta.env.BASE_URL}images/seicento/case/frame-`;
  let disposed = false;
  let inRange = false;
  let drawRequest = 0;
  let target = 0;
  let lastDrawn = -1;
  let activeLoads = 0;
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
  const canAnimate = !reduced && innerHeight >= 600 && Boolean(context);

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
    if (disposed || !inRange || document.hidden || !canAnimate) return;
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
    target = Math.min(frameCount - 1, Math.max(0, Math.round(value * (frameCount - 1))));
    progressBar.style.transform = `scaleX(${value})`;
    const nextPhase = value < 0.3 ? 0 : value < 0.57 ? 1 : 2;
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
    progress(0);
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(drawRequest); drawRequest = 0; }
      else { pump(); requestPaint(); }
    };
    document.addEventListener('visibilitychange', visibility);
    cleanup.push(() => document.removeEventListener('visibilitychange', visibility));
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
      scrollTrigger: { trigger: '.rubi-study', start: 'top 85%', end: 'top 20%', scrub: .4 },
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
    canvas.removeAttribute('data-frame');
  };
}
