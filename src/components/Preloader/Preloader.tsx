import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { setScrollLocked } from '../../lib/smoothScroll';
import { completeIntro } from '../../lib/intro';
import { useIsTouch, useReducedMotion } from '../../lib/env';
import BrandMark from '../BrandMark';
import { SITE } from '../../data/site';
import s from './Preloader.module.css';

/** Never let a slow font hold the page hostage. */
const FONT_TIMEOUT = 2200;

/**
 * Place, craft, principle — then the mark. Three beats is the most a
 * loading screen has earned; anything longer is a toll booth.
 */
const BEATS = [
  { lead: 'Coimbatore', tail: ' → worldwide.' },
  { lead: 'Design, build, growth.', tail: '' },
  { lead: 'One team.', tail: ' Start to finish.' },
] as const;

/* One beat: rise, sit, clear — then the next. They share a slot, so the
   outgoing line has to be almost gone before the incoming one arrives;
   HANDOFF is the small deliberate overlap that keeps it from stepping. */
const RISE = 0.4;
const HOLD = 0.12;
const EXIT = 0.26;
const HANDOFF = 0.08;
const CYCLE = RISE + HOLD + EXIT - HANDOFF;
const FIRST_BEAT_AT = 0.12;

const pad = (n: number) => String(Math.round(n)).padStart(3, '0');

export default function Preloader() {
  const reduced = useReducedMotion();
  const isTouch = useIsTouch();
  const [gone, setGone] = useState(false);

  // A phone pays for every beat. Keep the two with the most character and
  // drop the middle one — ~0.6s off the wait where it matters most.
  const beatCopy = isTouch ? [BEATS[0], BEATS[2]] : BEATS;

  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    // The browser will happily restore a mid-page scroll position behind
    // the ink screen, which then jumps when it lifts.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    if (reduced) {
      setScrollLocked(false);
      completeIntro();
      setGone(true);
      return;
    }

    // Once the intro is over this component renders null. A dependency
    // changing after that (a media query settling, an HMR remount) would
    // otherwise re-enter with no beats in the DOM and crash the outro.
    if (!rootRef.current) return;

    setScrollLocked(true);
    let cancelled = false;

    const ctx = gsap.context(() => {
      const counter = countRef.current;
      const value = { n: 0 };
      const write = () => {
        if (counter) counter.textContent = pad(value.n);
      };

      // Scoped to the preloader: gsap.utils.toArray queries the document,
      // and an empty result would make the outro reach for a beat that
      // isn't there.
      const beats = gsap.utils.toArray<HTMLElement>(
        rootRef.current?.querySelectorAll(`.${s.beat}`) ?? [],
      );
      if (!beats.length) return;
      const inner = (b: HTMLElement) =>
        Array.from(b.querySelectorAll<HTMLElement>(`.${s.beatIndex}, .${s.beatText}`));

      // How far a beat's parts travel to clear their mask. Measured from the
      // beat box, not each element: yPercent would move the little mono index
      // by 120% of its own tiny height and leave it sitting in plain sight.
      const below = (beat: HTMLElement) => () =>
        beat.getBoundingClientRect().height * 1.3;
      const above = (beat: HTMLElement) => () =>
        -beat.getBoundingClientRect().height * 1.3;

      // Every beat starts below its mask; the timeline lifts them one at a
      // time. Set in a layout effect, so this lands before first paint.
      beats.forEach((beat) => gsap.set(inner(beat), { y: below(beat) }));

      // The story runs to its own length; the count is paced to match.
      const storyEnd = FIRST_BEAT_AT + (beats.length - 1) * CYCLE + RISE;

      const tl = gsap.timeline();

      tl.from([`.${s.top}`, `.${s.counter}`, `.${s.place}`], {
        opacity: 0,
        duration: 0.6,
        stagger: 0.06,
        ease: 'power2.out',
      })
        // The count and the rule run underneath the whole story.
        .to(
          value,
          { n: 90, duration: storyEnd, ease: 'power1.inOut', onUpdate: write },
          0,
        )
        .to(`.${s.fill}`, { scaleX: 0.9, duration: storyEnd, ease: 'power1.inOut' }, 0);

      // Each beat rises into the slot, holds, then clears out the top.
      beats.forEach((beat, i) => {
        const at = FIRST_BEAT_AT + i * CYCLE;
        tl.fromTo(
          inner(beat),
          { y: below(beat) },
          { y: 0, duration: RISE, stagger: 0.04, ease: 'expo.out' },
          at,
        );
        // The last one is cleared by the outro, so the logo can take its place.
        if (i < beats.length - 1) {
          tl.to(
            inner(beat),
            { y: above(beat), duration: EXIT, stagger: 0.03, ease: 'power3.in' },
            at + RISE + HOLD,
          );
        }
      });

      // Fonts are the whole identity here — the last 10% is genuinely
      // waiting for them, not a fake stall. But never hostage to them.
      const fonts = Promise.race([
        document.fonts?.ready ?? Promise.resolve(),
        new Promise((r) => setTimeout(r, FONT_TIMEOUT)),
      ]);

      // Fonts are usually ready long before the story is. Waiting on both
      // stops the outro from cutting the last line off mid-rise.
      const story = new Promise<void>((resolve) => {
        tl.eventCallback('onComplete', resolve);
      });
      Promise.all([fonts, story]).then(() => {
        // The promise outlives a StrictMode remount; without this the wipe
        // runs twice over the same elements.
        if (cancelled) return;

        // Measurements taken before the real font landed are all stale.
        ScrollTrigger.refresh();

        const last = beats[beats.length - 1];

        gsap
          .timeline({
            onComplete: () => {
              setScrollLocked(false);
              setGone(true);
            },
          })
          .to(value, { n: 100, duration: 0.4, ease: 'power2.inOut', onUpdate: write })
          .to(`.${s.fill}`, { scaleX: 1, duration: 0.4, ease: 'power2.inOut' }, 0)
          // Last line clears, the mark takes its place — the payoff.
          .to(
            inner(last),
            { y: above(last), duration: EXIT, stagger: 0.03, ease: 'power3.in' },
            0,
          )
          .set(`.${s.logoWrap}`, { opacity: 1 }, 0.2)
          .fromTo(
            `.${s.logo}`,
            { yPercent: 118 },
            { yPercent: 0, duration: 0.62, ease: 'expo.out' },
            0.2,
          )
          // Let the mark sit for a beat before the room opens up.
          .to(
            [`.${s.top}`, `.${s.bottom}`, `.${s.story}`],
            { yPercent: -14, opacity: 0, duration: 0.62, ease: 'expo.inOut' },
            '+=0.26',
          )
          .to(
            rootRef.current,
            { clipPath: 'inset(0 0 100% 0)', duration: 0.78, ease: 'expo.inOut' },
            '<',
          )
          // Release the hero mid-wipe so it is already moving when the ink
          // clears. Waiting for the end reads as two separate events.
          .add(completeIntro, '<+=0.25');
      });

      return () => tl.kill();
    }, rootRef);

    return () => {
      cancelled = true;
      ctx.revert();
      setScrollLocked(false);
    };
  }, [reduced, isTouch]);

  if (gone || reduced) return null;

  return (
    <div ref={rootRef} className={s.root} role="status" aria-label="Loading">
      <div className={s.bloom} aria-hidden="true" />

      <div className={s.top}>
        <span className={`${s.label} label`}>{SITE.tagline}</span>
        <span className={`${s.label} ${s.labelWide} label`}>© {SITE.year}</span>
      </div>

      <div className={s.story}>
        {beatCopy.map((b, i) => (
          <p className={s.beat} key={b.lead}>
            <span className={s.beatIndex}>0{i + 1}</span>
            <span className={s.beatText}>
              {b.lead}
              {b.tail && <span className={s.beatAccent}>{b.tail}</span>}
            </span>
          </p>
        ))}

        <span className={s.logoWrap} aria-hidden="true">
          <BrandMark className={s.logo} title="" />
        </span>
      </div>

      <div className={s.track} aria-hidden="true">
        <span className={s.fill} />
      </div>

      <div className={s.bottom}>
        <span className={s.counter}>
          <span ref={countRef}>000</span>
          <span className={s.percent}>%</span>
        </span>
        <span className={`${s.place} label`}>{SITE.location}</span>
      </div>
    </div>
  );
}
