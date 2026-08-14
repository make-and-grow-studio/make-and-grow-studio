import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useIsTouch, useMediaQuery, useReducedMotion } from '../../lib/env';
import s from './HorizontalPan.module.css';

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Pins the section and pans it sideways as you scroll.
 *
 * Touch devices get a plain vertical stack instead: a pinned horizontal
 * track hijacks the one gesture a phone user has, and fighting native
 * scroll is never worth the trick.
 */
export default function HorizontalPan({ children, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  const isNarrow = useMediaQuery('(max-width: 899px)');
  const pan = !isTouch && !reduced && !isNarrow;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track || !pan) return;

    const ctx = gsap.context(() => {
      // Recomputed on every refresh — the distance depends on the track's
      // rendered width, which moves with the font and the viewport.
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      // Scroll further than we pan, so the section holds long enough to
      // register as a place you arrived at. A 1:1 mapping flies past.
      //
      // This ratio is the pan *rate*, and it's the only thing that controls
      // it: widening the cards lengthens the track, but the scroll length
      // scales with it, so the wheel-to-pan speed would stay exactly the
      // same. Raising the multiplier is what actually slows it down.
      const scrollLength = () =>
        Math.max(distance() * 2.1, window.innerHeight * 0.75);

      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => `+=${scrollLength()}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (fillRef.current) {
              gsap.set(fillRef.current, { scaleX: self.progress });
            }
          },
        },
      });
    }, root);

    // The track is type-driven, so its width isn't final until fonts land.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, [pan]);

  return (
    <div
      ref={rootRef}
      className={`${s.root} ${className ?? ''}`}
      data-pan={pan}
    >
      <div className={s.viewport}>
        <div ref={trackRef} className={s.track}>
          {children}
        </div>

        <span className={s.progress} aria-hidden="true">
          <span ref={fillRef} className={s.progressFill} />
        </span>
      </div>
    </div>
  );
}
