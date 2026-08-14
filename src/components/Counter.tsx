import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap } from '../lib/gsap';
import { useReducedMotion } from '../lib/env';

type Props = {
  /** e.g. "72h", "100%", "3", "∞" — the leading number is what counts up. */
  value: string;
  /** Stands in for a value with no numeral, so it can be drawn rather than set. */
  symbol?: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
};

const SPLIT = /^(\d+)(.*)$/;

/**
 * Counts up when it scrolls into view. Anything without a leading number
 * (the ∞) just gets the entrance, since there's nothing to count to.
 */
export default function Counter({
  value,
  symbol,
  className,
  duration = 1.6,
  delay = 0,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  const match = SPLIT.exec(value);
  const target = match ? Number(match[1]) : null;
  const suffix = match ? match[2] : value;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      const numEl = el.querySelector<HTMLElement>('[data-num]');
      const trigger = { trigger: el, start: 'top 88%', once: true } as const;

      gsap.from(el, {
        yPercent: 40,
        opacity: 0,
        duration: 0.9,
        delay,
        ease: 'expo.out',
        scrollTrigger: trigger,
      });

      if (numEl && target !== null) {
        const counter = { n: 0 };
        gsap.to(counter, {
          n: target,
          duration,
          delay,
          ease: 'power2.out',
          scrollTrigger: trigger,
          onUpdate: () => {
            numEl.textContent = String(Math.round(counter.n));
          },
        });
      }
    }, el);

    return () => ctx.revert();
  }, [reduced, target, duration, delay]);

  // A trailing unit ("h", "%") and a standalone symbol ("∞") look nothing
  // alike, so they get their own hooks rather than sharing :last-child.
  return (
    <span ref={ref} className={className} aria-label={value}>
      {target !== null ? (
        <>
          <span data-num aria-hidden="true">
            {reduced ? target : 0}
          </span>
          {suffix && (
            <span data-unit aria-hidden="true">
              {suffix}
            </span>
          )}
        </>
      ) : (
        <span data-symbol aria-hidden="true">
          {symbol ?? suffix}
        </span>
      )}
    </span>
  );
}
