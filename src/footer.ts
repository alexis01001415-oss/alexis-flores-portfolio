import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Keep the form in normal flow whenever the full footer cannot fit on screen. */
export function setupFooterMotion(reduced: boolean) {
  const footer = document.querySelector<HTMLElement>('#contacto')!;
  const surface = footer.querySelector<HTMLElement>('.footer-surface')!;
  const letters = footer.querySelectorAll<HTMLElement>('.closing-letter');
  const fits = innerWidth > 1100 && surface.offsetHeight <= innerHeight - 8;
  if (!reduced && fits) {
    footer.style.height = `${surface.offsetHeight}px`;
    footer.classList.add('is-reveal');
    // Keep the fixed surface out of paint until the preceding page uncovers it.
    ScrollTrigger.create({
      trigger: footer, start: 'top bottom', end: 'bottom top',
      onToggle: self => footer.classList.toggle('is-revealed', self.isActive),
      onRefresh: self => footer.classList.toggle('is-revealed', self.isActive),
    });
  }

  // Keyboard focus must never remain behind the preceding section during reveal.
  const showFocusedControl = () => {
    if (!footer.classList.contains('is-reveal')) return;
    const focused = document.activeElement;
    if (!(focused instanceof HTMLElement) || !footer.contains(focused)) return;
    if (focused.getBoundingClientRect().top < footer.getBoundingClientRect().top) {
      window.scrollTo({ top: document.documentElement.scrollHeight - innerHeight, behavior: 'instant' });
      ScrollTrigger.update();
    }
  };
  footer.addEventListener('focusin', showFocusedControl);

  let surfaceHeight = surface.offsetHeight;
  const resize = new ResizeObserver(() => {
    if (surface.offsetHeight === surfaceHeight) return;
    surfaceHeight = surface.offsetHeight;
    if (footer.classList.contains('is-reveal')) {
      if (surfaceHeight > innerHeight - 8) {
        footer.classList.remove('is-reveal');
        footer.style.removeProperty('height');
      } else footer.style.height = `${surfaceHeight}px`;
    }
    ScrollTrigger.refresh();
  });
  resize.observe(surface);

  if (!reduced) {
    gsap.fromTo(letters, {
      yPercent: index => index % 2 ? 52 : 72,
      rotation: index => index % 2 ? 34 : -38,
      rotationX: index => index % 2 ? -55 : 55,
      transformOrigin: '50% 80%',
    }, {
      yPercent: 0, rotation: 0, rotationX: 0,
      stagger: .045, ease: 'power2.out',
      scrollTrigger: {
        trigger: footer, start: 'top bottom', end: 'bottom bottom',
        scrub: .55, invalidateOnRefresh: true,
      },
    });
    gsap.fromTo('.contact-beam-core', { scaleX: .22 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: footer, start: 'top bottom', end: 'bottom bottom', scrub: .7 },
    });
  }

  return () => {
    resize.disconnect();
    footer.removeEventListener('focusin', showFocusedControl);
    footer.classList.remove('is-reveal', 'is-revealed');
    footer.style.removeProperty('height');
  };
}
