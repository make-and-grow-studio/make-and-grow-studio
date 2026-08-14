import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../../lib/gsap';
import { getLenis } from '../../lib/smoothScroll';
import { useMediaQuery, useReducedMotion } from '../../lib/env';
import s from './Marquee.module.css';

type Props = {
  words: readonly string[];
  /** Idle speed in px/sec. */
  speed?: number;
  /** 1 travels left, -1 travels right. */
  direction?: 1 | -1;
  variant?: 'display' | 'mono';
  /** Drop this strip on phones — two bands is too much viewport. */
  phoneHide?: boolean;
  className?: string;
};

/**
 * Infinite strip whose speed rides the scroll. Driven off the GSAP ticker
 * rather than a tween so scroll velocity can push it around frame by frame
 * — including reversing it when you scroll back up.
 */
export default function Marquee({
  words,
  speed = 60,
  direction = 1,
  variant = 'display',
  phoneHide = false,
  className,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // The same px/sec crosses a phone far faster than a desktop; ease it off
  // so the strip drifts rather than races.
  const isPhone = useMediaQuery('(max-width: 699px)');
  const rate = isPhone ? speed * 0.62 : speed;

  // Enough copies to cover the viewport plus one full set to wrap into.
  const [copies, setCopies] = useState(2);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const set = setRef.current;
    if (!root || !set) return;

    const measure = () => {
      const setW = set.getBoundingClientRect().width;
      if (!setW) return;
      setCopies(Math.max(2, Math.ceil(root.offsetWidth / setW) + 1));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [words]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const set = setRef.current;
    if (!track || !set || reduced) return;

    const ctx = gsap.context(() => {
      const setX = gsap.quickSetter(track, 'x', 'px');
      let x = 0;
      let velocity = 0;

      const lenis = getLenis();
      const onScroll = ({ velocity: v }: { velocity: number }) => {
        velocity = v;
      };
      lenis?.on('scroll', onScroll);

      const tick = (_t: number, deltaMs: number) => {
        const setW = set.getBoundingClientRect().width;
        if (!setW) return;

        // Lenis only reports velocity while scrolling; decay it ourselves so
        // the strip eases back to its idle drift instead of snapping.
        velocity *= 0.92;
        if (Math.abs(velocity) < 0.01) velocity = 0;

        // Scrolling up runs the strip backwards — the page and the type
        // agree on which way the world is moving.
        const dir = velocity < -0.2 ? -direction : direction;
        const boost = Math.min(Math.abs(velocity) * 22, rate * 9);

        x -= ((rate + boost) * dir * deltaMs) / 1000;
        // Wrap within one set so the seam never shows.
        x = ((x % setW) + setW) % setW;
        setX(x - setW);
      };

      gsap.ticker.add(tick);
      return () => {
        lenis?.off('scroll', onScroll);
        gsap.ticker.remove(tick);
      };
    }, track);

    return () => ctx.revert();
  }, [reduced, rate, direction, copies]);

  const item = (word: string, key: string) => (
    <span className={s.item} key={key}>
      <span>{word}</span>
      <i className={s.star} aria-hidden="true" />
    </span>
  );

  return (
    <div
      ref={rootRef}
      className={[
        s.root,
        variant === 'mono' ? s.mono : s.display,
        phoneHide && s.phoneHide,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <div ref={trackRef} className={s.track}>
        {Array.from({ length: copies }, (_, c) => (
          <div className={s.set} key={c} ref={c === 0 ? setRef : undefined}>
            {words.map((w, i) => item(w, `${c}-${i}`))}
          </div>
        ))}
      </div>
    </div>
  );
}
