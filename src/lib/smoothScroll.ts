import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

let lenis: Lenis | null = null;

/**
 * One Lenis instance for the whole app, driven by the GSAP ticker so that
 * ScrollTrigger, Draggable and Lenis all agree on the same frame.
 */
export function initSmoothScroll(opts?: { reducedMotion?: boolean }) {
  if (lenis) return lenis;

  lenis = new Lenis({
    duration: opts?.reducedMotion ? 0 : 1.1,
    // Long, soft tail — momentum without the drift.
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: !opts?.reducedMotion,
    // Native momentum on touch beats anything we can fake.
    syncTouch: false,
    touchMultiplier: 1.6,
    wheelMultiplier: 1,
    autoRaf: false,
  });

  lenis.on('scroll', ScrollTrigger.update);

  const raf = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function destroySmoothScroll() {
  lenis?.destroy();
  lenis = null;
}

export const getLenis = () => lenis;

export function scrollTo(target: string | HTMLElement | number, offset = 0) {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.4 });
    return;
  }
  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' });
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: 'smooth' });
  }
}

/** Pause/resume — the preloader and the mobile menu both need this. */
export function setScrollLocked(locked: boolean) {
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}
