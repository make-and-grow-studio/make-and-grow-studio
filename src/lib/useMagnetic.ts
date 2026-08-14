import { useEffect, useRef } from 'react';
import { gsap } from './gsap';
import { useIsTouch, useReducedMotion } from './env';

type Options = {
  /** How far the element travels toward the pointer, 0–1. */
  strength?: number;
  /** Extra hit area around the element, in px. */
  padding?: number;
  /** Inner element that travels further than its container. */
  childStrength?: number;
  /**
   * Hard cap on travel, in px. Two buttons sitting side by side both pull
   * toward a pointer between them; without a cap they meet and overlap.
   */
  maxOffset?: number;
};

/**
 * Magnetic pull. Returns a ref for the container; any child carrying
 * `data-magnetic-child` drifts a little further for a parallax feel.
 */
export function useMagnetic<T extends HTMLElement>({
  strength = 0.22,
  padding = 10,
  childStrength = 0.14,
  maxOffset = 12,
}: Options = {}) {
  const ref = useRef<T>(null);
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || isTouch || reduced) return;

    const child = el.querySelector<HTMLElement>('[data-magnetic-child]');
    const to = (t: Element, p: string) =>
      gsap.quickTo(t, p, { duration: 0.7, ease: 'elastic.out(1, 0.55)' });

    const xTo = to(el, 'x');
    const yTo = to(el, 'y');
    const cxTo = child ? to(child, 'x') : null;
    const cyTo = child ? to(child, 'y') : null;

    let inside = false;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      const near =
        Math.abs(dx) < r.width / 2 + padding && Math.abs(dy) < r.height / 2 + padding;

      if (near) {
        inside = true;
        const clamp = (v: number) => Math.max(-maxOffset, Math.min(maxOffset, v));
        xTo(clamp(dx * strength));
        yTo(clamp(dy * strength));
        cxTo?.(clamp(dx * childStrength));
        cyTo?.(clamp(dy * childStrength));
      } else if (inside) {
        inside = false;
        xTo(0);
        yTo(0);
        cxTo?.(0);
        cyTo?.(0);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.set(el, { x: 0, y: 0 });
      if (child) gsap.set(child, { x: 0, y: 0 });
    };
  }, [isTouch, reduced, strength, padding, childStrength, maxOffset]);

  return ref;
}
