import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { useReducedMotion } from '../../lib/env';
import { onIntroReady } from '../../lib/intro';
import s from './WordCycler.module.css';

type Props = {
  words: readonly string[];
  /** Seconds each word holds before flipping. */
  interval?: number;
  className?: string;
  /** Delay the first flip so it lands after the headline reveal. */
  startDelay?: number;
};

/**
 * Masked word flip. The box width animates with the word so the line
 * never jumps — the whole point is that it feels typeset, not glitchy.
 */
export default function WordCycler({
  words,
  interval = 3,
  className,
  startDelay = 2.4,
}: Props) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const slotsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    const slots = slotsRef.current.filter(Boolean) as HTMLSpanElement[];
    if (!root || slots.length < 2 || reduced) return;

    const ctx = gsap.context(() => {
      const widthOf = (el: HTMLElement) => el.getBoundingClientRect().width;

      gsap.set(slots, { yPercent: 145, opacity: 0 });
      gsap.set(slots[0], { yPercent: 0, opacity: 1 });
      gsap.set(root, { width: widthOf(slots[0]) });

      let index = 0;
      let timer = 0;
      let stopped = false;
      let offIntro: (() => void) | undefined;

      const advance = () => {
        if (stopped) return;
        const from = slots[index];
        index = (index + 1) % slots.length;
        const to = slots[index];

        gsap
          .timeline({
            defaults: { duration: 0.78, ease: 'expo.out' },
            onComplete: () => {
              timer = window.setTimeout(advance, interval * 1000);
            },
          })
          .to(from, { yPercent: -145, opacity: 0 }, 0)
          .fromTo(to, { yPercent: 145, opacity: 0 }, { yPercent: 0, opacity: 1 }, 0.06)
          .to(root, { width: widthOf(to) }, 0);
      };

      // Counted from the hero appearing, not from mount — otherwise the
      // preloader eats most of the first word's time on screen.
      offIntro = onIntroReady(() => {
        timer = window.setTimeout(advance, startDelay * 1000);
      });

      // The slots are max-content, so their widths only change when the type
      // does — a font swap or a viewport step. Watch both, since a stale
      // width leaves a gap between the word and whatever follows it.
      const remeasure = () => gsap.set(root, { width: widthOf(slots[index]) });
      const ro = new ResizeObserver(remeasure);
      ro.observe(document.documentElement);
      document.fonts?.ready.then(remeasure);

      return () => {
        stopped = true;
        offIntro?.();
        clearTimeout(timer);
        ro.disconnect();
      };
    }, root);

    return () => ctx.revert();
  }, [words, interval, reduced, startDelay]);

  return (
    <span ref={rootRef} className={`${s.root} ${className ?? ''}`} aria-label={words[0]}>
      {/* Screen readers and no-JS get the first word only. */}
      <span className={s.sizer} aria-hidden="true">
        {words[0]}
      </span>
      {words.map((w, i) => (
        <span
          key={w}
          ref={(el) => {
            slotsRef.current[i] = el;
          }}
          className={s.slot}
          aria-hidden="true"
          style={i === 0 ? undefined : { opacity: 0 }}
        >
          {w}
        </span>
      ))}
    </span>
  );
}
