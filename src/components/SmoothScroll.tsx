import { useLayoutEffect } from 'react';
import { initSmoothScroll, destroySmoothScroll } from '../lib/smoothScroll';
import { ScrollTrigger } from '../lib/gsap';
import { useReducedMotion } from '../lib/env';

/**
 * Mounts Lenis once, high in the tree. Renders nothing.
 *
 * Layout effect, not a passive one: the preloader locks scrolling from its
 * own layout effect, and layout effects run ahead of every passive effect
 * in the tree — so Lenis has to exist by then.
 */
export default function SmoothScroll() {
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    initSmoothScroll({ reducedMotion: reduced });
    // Fonts land after first paint and shift every measurement.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => destroySmoothScroll();
  }, [reduced]);

  return null;
}
