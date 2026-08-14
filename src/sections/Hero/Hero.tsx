import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { scrollTo } from '../../lib/smoothScroll';
import { useReducedMotion } from '../../lib/env';
import { onIntroReady } from '../../lib/intro';
import RevealText from '../../components/RevealText';
import Dimension from '../../components/Dimension/Dimension';
import ParticleText from '../../components/ParticleText/ParticleText';
import DragCard from '../../components/DragCard/DragCard';
import MagneticButton from '../../components/MagneticButton/MagneticButton';
import LiveClock from '../../components/LiveClock';
import { SITE } from '../../data/site';
import s from './Hero.module.css';

/* Module-level so their identity is stable. Inline array literals would be
   new objects on every render, tearing down and rebuilding the particle
   field — and stacking a fresh morph timer each time. */
/* The name is the proposition: most studios stop at "make". */
const HEADLINE_LINES = ['We make it.', 'Then we make', 'it grow.'];
const HEADLINE_CYCLE = ['it grow.', 'it sell.', 'it spread.', 'it last.'];

/* Shorter breaks for narrow screens. The field fits its type to the box, so
   long lines mean small type — a phone needs fewer words per line to keep
   the headline the size a hero deserves. */
const HEADLINE_LINES_SM = ['We make it.', 'Then we', 'make it', 'grow.'];
const HEADLINE_CYCLE_SM = ['grow.', 'sell.', 'last.'];

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  /* Everything that isn't split text fades up on a shared timeline. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;

    let off: (() => void) | undefined;

    const ctx = gsap.context(() => {
      const tl = gsap
        .timeline({ delay: 0.35, paused: true })
        .from(`.${s.corner}`, {
          opacity: 0,
          y: 12,
          duration: 1,
          stagger: 0.08,
          ease: 'power3.out',
        })
        .from(
          `.${s.foot} > *`,
          { opacity: 0, y: 26, duration: 1.1, stagger: 0.12, ease: 'expo.out' },
          '-=0.75',
        )
        .from(
          `.${s.dragSlot}`,
          { opacity: 0, y: 30, scale: 0.94, duration: 1.2, ease: 'expo.out' },
          '-=0.9',
        )
        .from(
          `.${s.bloom}`,
          { opacity: 0, scale: 0.8, duration: 2, ease: 'power2.out' },
          0,
        );

      off = onIntroReady(() => tl.play());

      // Bloom drifts a touch with the pointer — parallax, barely there.
      const xTo = gsap.quickTo(`.${s.bloom}`, 'x', { duration: 1.6, ease: 'power3' });
      const yTo = gsap.quickTo(`.${s.bloom}`, 'y', { duration: 1.6, ease: 'power3' });
      const onMove = (e: PointerEvent) => {
        xTo((e.clientX / window.innerWidth - 0.5) * 60);
        yTo((e.clientY / window.innerHeight - 0.5) * 40);
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      return () => window.removeEventListener('pointermove', onMove);
    }, root);

    return () => {
      off?.();
      ctx.revert();
    };
  }, [reduced]);

  return (
    <section ref={rootRef} className={s.root} id="top" aria-label="Introduction">
      <div className={s.bloom} aria-hidden="true" />
      <div className={s.rules} aria-hidden="true">
        <span style={{ left: '25%' }} />
        <span style={{ left: '50%' }} />
        <span style={{ left: '75%' }} />
      </div>

      {/* ── Corner detailing ── */}
      <div className={s.corners} aria-hidden="true">
        <span className={`${s.corner} ${s.tl} label`}>
          Make &amp; Grow © {SITE.year}
        </span>
        <span className={`${s.corner} ${s.tr} label`}>
          <span>AI-Native Studio</span>
          <LiveClock timeZone={SITE.timeZone} withZone />
        </span>
        <span className={`${s.corner} ${s.bl} label`}>
          Est. {SITE.year} — Coimbatore
          <span className={s.blLong}> → Worldwide</span>
        </span>
      </div>

      <span className={`${s.corner} ${s.br}`}>
        <a
          className={`${s.scrollCue} label`}
          href="#about"
          onClick={(e) => {
            e.preventDefault();
            scrollTo('#about', -60);
          }}
          data-cursor="hover"
        >
          Scroll <span className={s.scrollArrow}>↓</span>
        </a>
      </span>

      {/* Words, not chars — a char split drops word boundaries and the
          label breaks mid-word once it wraps on a phone. */}
      <RevealText
        as="p"
        type="words"
        immediate
        delay={0.5}
        stagger={0.03}
        duration={0.8}
        className={`${s.kicker} label`}
      >
        An AI-native studio — Coimbatore → Worldwide
      </RevealText>

      <div className={s.dragSlot}>
        <DragCard />
      </div>

      <div className={s.headlineWrap}>
        {/* Not type — a field of dots that scatters under the pointer and
            morphs when the last word changes. */}
        <ParticleText
          className={s.headline}
          lines={HEADLINE_LINES}
          cycle={HEADLINE_CYCLE}
          linesSm={HEADLINE_LINES_SM}
          cycleSm={HEADLINE_CYCLE_SM}
          /* This becomes the page's only <h1>, since the visible headline
             is a canvas. It opens with exactly what is drawn on screen —
             so a screen reader and a sighted visitor get the same thing —
             and then says who and where, which is what the headline alone
             never could. Keep the first sentence in step with the artwork. */
          label="We make it. Then we make it grow. — Make & Grow, a design, build and growth studio in Coimbatore."
        />
      </div>

      <div className={s.foot}>
        <Dimension label="statement" pad={14} className={s.subSel}>
          <p className={s.sub}>
            Design, build, growth — <strong>the whole thing</strong>. Done fast, done
            properly, done like it matters.
          </p>
        </Dimension>

        <div className={s.actions}>
          <MagneticButton variant="solid" onClick={() => scrollTo('#contact', -60)}>
            Start a project
          </MagneticButton>
          <MagneticButton onClick={() => scrollTo('#services', -60)}>
            See what we do
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
