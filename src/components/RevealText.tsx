import { useLayoutEffect, useRef, type ElementType, type ReactNode } from 'react';
import { gsap, SplitText, ScrollTrigger } from '../lib/gsap';
import { useReducedMotion } from '../lib/env';
import { onIntroReady } from '../lib/intro';

type Props = {
  children: ReactNode;
  as?: ElementType;
  /** lines — headlines. words — manifesto-style rise. chars — small kickers. */
  type?: 'lines' | 'words' | 'chars';
  delay?: number;
  stagger?: number;
  duration?: number;
  /**
   * Play on page entrance instead of on scroll. These wait for the
   * preloader to hand over — an above-the-fold reveal that runs behind the
   * ink screen is one nobody sees.
   */
  immediate?: boolean;
  start?: string;
  className?: string;
  id?: string;
};

/**
 * SplitText mask reveal. Every heading on the site goes through this so the
 * whole page shares one entrance.
 */
export default function RevealText({
  children,
  as: Tag = 'div',
  type = 'lines',
  delay = 0,
  stagger = 0.09,
  duration = 1.1,
  immediate = false,
  start = 'top 85%',
  className,
  id,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      gsap.set(el, { opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      // autoSplit re-runs onSplit on resize, so the previous intro
      // subscription has to go with it.
      let offIntro: (() => void) | undefined;

      const split = SplitText.create(el, {
        type,
        mask: type,
        autoSplit: true,
        linesClass: 'rt-line',
        wordsClass: 'rt-word',
        charsClass: 'rt-char',
        onSplit(self) {
          const targets =
            type === 'lines' ? self.lines : type === 'words' ? self.words : self.chars;

          const tween = gsap.from(targets, {
            yPercent: 118,
            rotate: type === 'lines' ? 2.5 : 0,
            opacity: 0,
            duration,
            delay,
            stagger,
            ease: 'expo.out',
            paused: immediate,
            scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
            // The mask exists to hide the text below the line while it
            // slides up, so it has to clip tightly for the duration. Once
            // the reveal has landed it does nothing but slice the tail off
            // any descender that hangs past a 0.94 line-height — which the
            // display face's "g" and "p" both do. Retire it on completion.
            // Padding the masked box instead does not work: the word and
            // char wrappers take their height from the line box's strut,
            // not from the child's border-box.
            onComplete() {
              gsap.set(self.masks, { overflow: 'visible' });
            },
          });

          if (immediate) {
            offIntro?.();
            offIntro = onIntroReady(() => tween.play());
          }

          return tween;
        },
      });

      gsap.set(el, { opacity: 1 });
      return () => {
        offIntro?.();
        split.revert();
      };
    }, el);

    // The split measures text, so it has to re-run once the real font lands.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, [reduced, type, delay, stagger, duration, immediate, start]);

  return (
    <Tag
      ref={ref as never}
      id={id}
      className={className}
      style={{ opacity: 0, willChange: 'transform' }}
    >
      {children}
    </Tag>
  );
}
