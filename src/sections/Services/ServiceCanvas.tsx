import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../../lib/gsap';
import { useReducedMotion } from '../../lib/env';
import s from './Services.module.css';

export type CanvasKind = 'design' | 'build' | 'grow';

/**
 * The scene inside each service card: a small job, acted out on a loop.
 *
 * All three run the same four beats — a note comes in, the work happens, the
 * studio replies, then it resets for the next job. The client's note and the
 * studio's reply share a strip across the top of every card, which is what
 * makes the three read as one set rather than three unrelated diagrams, and
 * ties them to the Process section's chat thread further down the page.
 *
 * Two rules the loop is built around:
 *
 * 1. **It never empties.** The reset tweens the work back to a deliberate
 *    "before" state — a rough poster, loose parts, a flat line — rather than
 *    fading the scene out. A card caught between cycles still shows a
 *    finished picture. An earlier version modelled these as build-ups from
 *    nothing, and any card sitting at the start of its cycle looked broken.
 *
 * 2. **The cards are out of phase.** Staggered start delays, so you never
 *    catch three identical beats side by side during the horizontal pan.
 */

/* Token values, duplicated as literals because GSAP interpolates colour
   channels and cannot tween to or from a `var(--x)` string. Keep in step
   with styles/tokens.css. */
const C = {
  brand: '#e4551c',
  ink: '#191b1c',
  iron: '#1c1f21',
  anno: '#3d4f57',
  frame: '#f3f0e9',
  soft: '#e6e2d7',
  grow: '#2e7a62',
  rough: '#bdb8ab',
  roughInk: '#8f8b80',
};

/* A third of the cycle apart. */
const START: Record<CanvasKind, number> = { design: 0, build: 3.4, grow: 6.8 };

const MONO = 'JetBrains Mono, monospace';
const HAND = 'Caveat, cursive';

/* Beat boundaries, shared so the three loops stay in the same rhythm. */
const T = {
  noteIn: 0,
  noteText: 1.5,
  work: 2.2,
  workEnd: 5.2,
  reply: 5.4,
  payoff: 5.9,
  hold: 8.2,
  reset: 8.2,
  end: 9.4,
};

export default function ServiceCanvas({
  kind,
  active,
  className,
}: {
  kind: CanvasKind;
  active: boolean;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  /* ── Press and hold ───────────────────────────────────────
     The loop runs itself until you touch it. Pressing seizes the work beat
     and advances it by hand; letting go early rewinds. `hold` is a ref, not
     state, because it changes every frame — the ring is painted straight
     onto the DOM. Only the revision counter, which changes once per
     completed job, is worth a render. */
  const [rev, setRev] = useState(1);
  const ringRef = useRef<SVGCircleElement>(null);
  const hold = useRef({ v: 0, down: false, raf: 0, last: 0 });

  const paintRing = (v: number) => {
    if (ringRef.current) ringRef.current.style.strokeDashoffset = String(1 - v);
  };

  const step = () => {
    const h = hold.current;
    const tl = tlRef.current;
    if (!tl) return;

    const now = performance.now();
    // Clamped: a backgrounded tab resumes with a huge delta, which would
    // otherwise complete or cancel the hold in a single frame.
    const dt = Math.min(now - h.last, 50);
    h.last = now;

    // Rewinding runs faster than filling — losing progress should sting,
    // but not leave you waiting to try again.
    h.v = gsap.utils.clamp(0, 1, h.v + (h.down ? dt : -dt * 1.7) / HOLD_MS);
    paintRing(h.v);
    tl.time(T.work + h.v * (T.payoff - T.work));

    if (h.down && h.v >= 1) {
      h.down = false;
      h.raf = 0;
      // Discharge the ring into the payoff. Leaving it full would strand a
      // finished progress indicator on screen for the rest of the cycle,
      // and the stamp / LIVE chip / ceiling break is the real reward.
      h.v = 0;
      paintRing(0);
      setRev((r) => Math.min(99, r + 1));
      tl.play();
      return;
    }
    if (!h.down && h.v <= 0) {
      h.raf = 0;
      tl.play();
      return;
    }
    h.raf = requestAnimationFrame(step);
  };

  const onDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const tl = tlRef.current;
    if (!tl) return;
    // Capture keeps the release on this button even if the finger slides
    // off it mid-hold. Throws on a pointer id the browser no longer treats
    // as active, which is not a reason to drop the whole interaction.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* not capturable — the hold still works, it just ends on pointerup
         wherever that lands */
    }

    if (reduced) {
      setRev((r) => Math.min(99, r + 1));
      tl.time(T.payoff);
      paintRing(1);
      return;
    }

    // Past the payoff the job is already done for this cycle; wait for the
    // loop to come back round rather than yanking it backwards.
    if (tl.time() > T.payoff) return;

    tl.pause();
    if (tl.time() < T.work) tl.time(T.work);

    const h = hold.current;
    // Pick up wherever the auto-loop had got to, so taking over is seamless
    // rather than a jump back to the start of the work.
    h.v = gsap.utils.clamp(0, 1, (tl.time() - T.work) / (T.payoff - T.work));
    h.down = true;
    h.last = performance.now();
    if (!h.raf) h.raf = requestAnimationFrame(step);
  };

  const onUp = () => {
    const h = hold.current;
    if (!h.down) return;
    h.down = false;
    h.last = performance.now();
    if (!h.raf) h.raf = requestAnimationFrame(step);
  };

  /* Space and Enter hold too — keydown repeats while the key is down. */
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (hold.current.down) return;
    const tl = tlRef.current;
    if (!tl || (!reduced && tl.time() > T.payoff)) return;
    if (reduced) {
      setRev((r) => Math.min(99, r + 1));
      tl.time(T.payoff);
      paintRing(1);
      return;
    }
    tl.pause();
    if (tl.time() < T.work) tl.time(T.work);
    const h = hold.current;
    h.v = gsap.utils.clamp(0, 1, (tl.time() - T.work) / (T.payoff - T.work));
    h.down = true;
    h.last = performance.now();
    if (!h.raf) h.raf = requestAnimationFrame(step);
  };

  useEffect(
    () => () => {
      if (hold.current.raf) cancelAnimationFrame(hold.current.raf);
    },
    [],
  );

  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const ctx = gsap.context(() => {
      const q = <E extends Element>(sel: string) => svg.querySelectorAll<E>(sel);
      const one = <E extends Element>(sel: string) => svg.querySelector<E>(sel);

      const note = one<SVGGElement>('[data-el="note"]');
      const noteText = one<SVGTextElement>('[data-el="noteText"]');
      const dots = one<SVGGElement>('[data-el="dots"]');
      const reply = one<SVGGElement>('[data-el="reply"]');

      const tl = gsap.timeline({
        repeat: -1,
        paused: true,
        delay: START[kind],
      });

      /* ── The message strip, identical on all three ────────── */
      tl.fromTo(
        note,
        { opacity: 0, y: -7, scale: 0.96, transformOrigin: '0% 50%' },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.7)' },
        T.noteIn,
      )
        // The dots pulse from CSS; the timeline only decides when they're
        // present, so a looping tween never stacks up.
        .to(dots, { opacity: 0, duration: 0.2 }, T.noteText)
        .fromTo(
          noteText,
          { opacity: 0, x: -4 },
          { opacity: 1, x: 0, duration: 0.32, ease: 'power2.out' },
          T.noteText + 0.1,
        );

      /* ── 01 Design ──────────────────────────────────────────
         A rough poster gets refined: the mark squares up and takes colour,
         the wordmark gains weight and tightens, the copy fills out, and the
         guides fall away as the thing stops needing them. */
      if (kind === 'design') {
        const badge = one<SVGRectElement>('[data-el="badge"]');
        const glyph = one<SVGTextElement>('[data-el="badgeGlyph"]');
        const word = one<SVGTextElement>('[data-el="word"]');
        const rule = one<SVGRectElement>('[data-el="rule"]');
        const sub = one<SVGTextElement>('[data-el="sub"]');
        const panel = one<SVGRectElement>('[data-el="panel"]');
        const cross = one<SVGGElement>('[data-el="cross"]');
        const art = q<SVGElement>('[data-el="art"]');
        const guides = q<SVGLineElement>('[data-el="guide"]');
        const stamp = one<SVGGElement>('[data-el="stamp"]');

        // One progress value drives both weight axes, so the mark and the
        // wordmark thicken together instead of drifting apart.
        const setWght = (p: number) => {
          word?.style.setProperty(
            'font-variation-settings',
            `"wght" ${Math.round(300 + p * 420)}`,
          );
          glyph?.style.setProperty(
            'font-variation-settings',
            `"wght" ${Math.round(400 + p * 400)}`,
          );
        };

        const BEFORE = {
          badge: { fill: C.rough, x: 6, rotation: 3.5 },
          badgeRx: 2,
          glyph: { fill: C.roughInk },
          word: { fill: C.roughInk, letterSpacing: '0.14em' },
          rule: { scaleX: 0.3, fill: C.rough },
          sub: { opacity: 0.3, fill: C.roughInk },
          panel: { fill: C.rough },
          cross: { opacity: 0.6 },
          art: { scale: 0, opacity: 0 },
          guide: { opacity: 1 },
        };
        const AFTER = {
          badge: { fill: C.brand, x: 0, rotation: 0 },
          badgeRx: 11,
          glyph: { fill: C.frame },
          word: { fill: C.ink, letterSpacing: '-0.025em' },
          rule: { scaleX: 1, fill: C.ink },
          sub: { opacity: 1, fill: C.brand },
          panel: { fill: C.soft },
          cross: { opacity: 0 },
          art: { scale: 1, opacity: 1 },
          guide: { opacity: 0 },
        };

        // The before-state has to be written to the DOM here, not left
        // implicit in the markup. A `.to()` records its start value the
        // first time it runs and re-applies that recording on every repeat
        // — so if the elements start at their markup defaults rather than
        // at BEFORE, the loop restores the defaults and silently undoes the
        // reset tweens at the bottom of the timeline.
        gsap.set(badge, { transformOrigin: '50% 50%' });
        gsap.set(rule, { transformOrigin: 'left center' });
        gsap.set(art, { transformOrigin: '50% 50%' });
        gsap.set(badge, { ...BEFORE.badge, attr: { rx: BEFORE.badgeRx } });
        gsap.set(glyph, BEFORE.glyph);
        gsap.set(word, BEFORE.word);
        gsap.set(rule, BEFORE.rule);
        gsap.set(sub, BEFORE.sub);
        gsap.set(panel, BEFORE.panel);
        gsap.set(cross, BEFORE.cross);
        gsap.set(art, BEFORE.art);
        gsap.set(guides, BEFORE.guide);

        const w = { p: 0 };
        setWght(0);

        tl.to(
          badge,
          {
            ...AFTER.badge,
            attr: { rx: AFTER.badgeRx },
            duration: 1.4,
            ease: 'power3.inOut',
          },
          T.work,
        )
          .to(glyph, { ...AFTER.glyph, duration: 1 }, T.work + 0.2)
          .to(word, { ...AFTER.word, duration: 1.5, ease: 'power2.inOut' }, T.work + 0.15)
          .to(
            w,
            {
              p: 1,
              duration: 1.5,
              ease: 'power2.inOut',
              onUpdate: () => setWght(w.p),
            },
            T.work + 0.15,
          )
          .to(rule, { ...AFTER.rule, duration: 1, ease: 'power3.out' }, T.work + 0.5)
          .to(sub, { ...AFTER.sub, duration: 0.9 }, T.work + 0.7)
          .to(panel, { ...AFTER.panel, duration: 1.2, ease: 'power2.inOut' }, T.work + 0.35)
          // The placeholder cross clears as the real artwork lands in it.
          .to(cross, { ...AFTER.cross, duration: 0.6 }, T.work + 0.55)
          .to(
            art,
            { ...AFTER.art, duration: 0.55, stagger: 0.13, ease: 'back.out(1.9)' },
            T.work + 0.75,
          )
          .to(guides, { ...AFTER.guide, duration: 0.8, stagger: 0.08 }, T.work + 1.5)

          // The payoff: a stamp thunks on, over-rotated then settling.
          .fromTo(
            stamp,
            { opacity: 0, scale: 2.1, rotation: -26, transformOrigin: '50% 50%' },
            { opacity: 1, scale: 1, rotation: -13, duration: 0.42, ease: 'back.out(2.2)' },
            T.payoff,
          )

          /* Reset — tweened back, never faded out. */
          .to(stamp, { opacity: 0, scale: 0.9, duration: 0.4 }, T.reset)
          .to(
            badge,
            {
              ...BEFORE.badge,
              attr: { rx: BEFORE.badgeRx },
              duration: 0.9,
              ease: 'power2.inOut',
            },
            T.reset,
          )
          .to(glyph, { ...BEFORE.glyph, duration: 0.7 }, T.reset)
          .to(word, { ...BEFORE.word, duration: 0.9, ease: 'power2.inOut' }, T.reset)
          .to(
            w,
            {
              p: 0,
              duration: 0.9,
              ease: 'power2.inOut',
              onUpdate: () => setWght(w.p),
            },
            T.reset,
          )
          .to(rule, { ...BEFORE.rule, duration: 0.7 }, T.reset)
          .to(sub, { ...BEFORE.sub, duration: 0.6 }, T.reset)
          .to(panel, { ...BEFORE.panel, duration: 0.9, ease: 'power2.inOut' }, T.reset)
          .to(art, { ...BEFORE.art, duration: 0.45, stagger: 0.06 }, T.reset)
          .to(cross, { ...BEFORE.cross, duration: 0.6 }, T.reset + 0.3)
          .to(guides, { ...BEFORE.guide, duration: 0.6 }, T.reset);
      }

      /* ── 02 Build ───────────────────────────────────────────
         Loose parts converge and seat, each one snapping as it lands, then
         the thing deploys. */
      if (kind === 'build') {
        const parts = q<SVGGElement>('[data-el="part"]');
        const snaps = q<SVGRectElement>('[data-el="snap"]');
        // The bob lives on a wrapper, not on the part itself. Two tweens
        // writing `y` on one element would fight every frame — GSAP does not
        // overwrite by default, so the last writer of each tick wins and the
        // parts judder. Separate nodes, separate properties, no conflict.
        const bobbers = q<SVGGElement>('[data-el="bob"]');
        const barFill = one<SVGRectElement>('[data-el="barFill"]');
        const bar = one<SVGGElement>('[data-el="bar"]');
        const live = one<SVGGElement>('[data-el="live"]');

        // Where each part drifts to while it's still loose. Paired with the
        // markup by index, so the seated layout stays the single source of
        // truth for position — these are only offsets from it.
        const LOOSE = [
          { x: -30, y: -16, rotation: -3 },
          { x: 34, y: -10, rotation: 2.5 },
          { x: -26, y: 14, rotation: 2 },
          { x: 30, y: 18, rotation: -2 },
          { x: 0, y: 26, rotation: 1.5 },
        ];

        gsap.set(parts, { transformOrigin: '50% 50%' });
        parts.forEach((p, i) => gsap.set(p, LOOSE[i] ?? {}));

        // Bobbing while loose, on the wrappers. Wound back to rest as the
        // parts seat, so the flash that fires on landing lines up with the
        // part exactly rather than a few pixels off wherever the bob had
        // drifted to.
        const bob = gsap.to(bobbers, {
          y: 4,
          duration: 2.1,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          stagger: 0.22,
          paused: true,
        });

        tl.call(() => bob.play(), undefined, 0)
          .call(() => bob.pause(), undefined, T.work)
          .to(bobbers, { y: 0, duration: 0.4, ease: 'power2.out' }, T.work)
          .to(
            parts,
            {
              x: 0,
              y: 0,
              rotation: 0,
              duration: 0.62,
              stagger: 0.16,
              ease: 'power3.out',
            },
            T.work,
          );

        // Each part flashes as it lands — offset to match its own stagger.
        snaps.forEach((s, i) => {
          tl.fromTo(
            s,
            { opacity: 0.9, scale: 1, transformOrigin: '50% 50%' },
            { opacity: 0, scale: 1.07, duration: 0.5, ease: 'power2.out' },
            T.work + 0.16 * i + 0.5,
          );
        });

        tl.fromTo(bar, { opacity: 0 }, { opacity: 1, duration: 0.2 }, T.workEnd - 0.4)
          .fromTo(
            barFill,
            { scaleX: 0, transformOrigin: 'left center' },
            { scaleX: 1, duration: 0.85, ease: 'power2.inOut' },
            T.workEnd - 0.3,
          )
          .to(bar, { opacity: 0, duration: 0.25 }, T.payoff)
          .fromTo(
            live,
            { opacity: 0, scale: 0.5, transformOrigin: '50% 50%' },
            { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(3)' },
            T.payoff,
          )

          /* Reset — back to loose, and the bobbing picks up again. */
          .to(live, { opacity: 0, scale: 0.8, duration: 0.35 }, T.reset)
          .to(
            parts,
            {
              x: (i: number) => LOOSE[i]?.x ?? 0,
              y: (i: number) => LOOSE[i]?.y ?? 0,
              rotation: (i: number) => LOOSE[i]?.rotation ?? 0,
              duration: 0.75,
              stagger: 0.07,
              ease: 'power2.inOut',
            },
            T.reset,
          );
      }

      /* ── 03 Grow ────────────────────────────────────────────
         A flat line climbs, audience marks pile on as it goes, the channels
         light up one by one, and it breaks the ceiling. */
      if (kind === 'grow') {
        const plot = one<SVGGElement>('[data-el="plotGroup"]');
        const line = one<SVGPathElement>('[data-el="line"]');
        const marks = q<SVGGElement>('[data-el="aud"]');
        const chips = q<SVGGElement>('[data-el="chip"]');
        const counter = one<SVGTextElement>('[data-el="counter"]');
        const burst = q<SVGPathElement>('[data-el="burst"]');
        const ceiling = one<SVGLineElement>('[data-el="ceiling"]');

        // Seat the audience marks on the curve rather than guessing
        // coordinates that would drift the moment the path is edited.
        const len = line ? line.getTotalLength() : 0;
        marks.forEach((m, i) => {
          const pt = line?.getPointAtLength((len * (i + 1)) / (marks.length + 1));
          if (pt) gsap.set(m, { x: pt.x, y: pt.y });
        });

        // Flat is the curve squashed onto its own baseline: one transform
        // instead of a second path to morph between.
        gsap.set(plot, { scaleY: 0.06, transformOrigin: '50% 100%' });
        gsap.set(marks, { opacity: 0, scale: 0 });
        gsap.set(burst, { opacity: 0 });

        const n = { v: 0.4 };
        const writeCount = () =>
          counter && (counter.textContent = `${n.v.toFixed(1)}k`);
        writeCount();

        tl.to(plot, { scaleY: 1, duration: 2.4, ease: 'power2.out' }, T.work)
          .to(
            n,
            { v: 18.6, duration: 2.6, ease: 'power2.out', onUpdate: writeCount },
            T.work,
          )
          .to(
            marks,
            {
              opacity: 1,
              scale: 1,
              duration: 0.34,
              stagger: 0.19,
              ease: 'back.out(2.6)',
            },
            T.work + 0.5,
          )
          .to(
            chips,
            { opacity: 1, duration: 0.3, stagger: 0.28, ease: 'power2.out' },
            T.work + 0.4,
          )

          // The ceiling gets broken rather than approached.
          .to(plot, { scaleY: 1.07, duration: 0.34, ease: 'back.out(3)' }, T.payoff)
          .fromTo(
            ceiling,
            { opacity: 0.4 },
            { opacity: 1, duration: 0.2, yoyo: true, repeat: 3 },
            T.payoff,
          )
          .fromTo(
            burst,
            { opacity: 1, scale: 0, x: 0, y: 0, transformOrigin: '50% 50%' },
            {
              opacity: 0,
              scale: 1,
              x: (i: number) => [-13, -7, 0, 8, 14][i] ?? 0,
              y: (i: number) => [-6, -14, -17, -13, -5][i] ?? 0,
              duration: 0.75,
              stagger: 0.04,
              ease: 'power2.out',
            },
            T.payoff + 0.05,
          )

          /* Reset — the line settles back down, marks lift off. */
          .to(plot, { scaleY: 0.06, duration: 0.85, ease: 'power2.inOut' }, T.reset)
          .to(
            n,
            { v: 0.4, duration: 0.85, ease: 'power2.inOut', onUpdate: writeCount },
            T.reset,
          )
          .to(
            marks,
            { opacity: 0, scale: 0, duration: 0.4, stagger: 0.05 },
            T.reset,
          )
          .to(chips, { opacity: 0.25, duration: 0.4 }, T.reset);
      }

      /* ── Reply, and the strip resetting ───────────────────── */
      tl.to(note, { opacity: 0, y: -6, duration: 0.35, ease: 'power2.in' }, T.reply)
        .fromTo(
          reply,
          { opacity: 0, y: 7, scale: 0.96, transformOrigin: '100% 50%' },
          { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.7)' },
          T.reply + 0.15,
        )
        .to(reply, { opacity: 0, y: -5, duration: 0.35 }, T.reset)
        // Dots back for the next job, and the note text cleared.
        .set(dots, { opacity: 1 }, T.reset + 0.4)
        .set(noteText, { opacity: 0 }, T.reset + 0.4)
        // Nothing to animate — this just holds the timeline open to `end`
        // so the loop has a beat of stillness before the next note.
        .to({}, { duration: 0.01 }, T.end);

      /* One resolved, static frame when motion is not wanted — but the
         timeline is still handed over, so the hold button can jump straight
         to the payoff rather than being dead for anyone on reduced motion. */
      if (reduced) tl.time(T.payoff).pause();

      tlRef.current = tl;
    }, svg);

    return () => {
      ctx.revert();
      tlRef.current = null;
    };
  }, [kind, reduced]);

  /* The loop only runs while the card is actually on screen. Scrolling away
     mid-hold abandons it rather than leaving a rAF spinning against a
     paused timeline. */
  useLayoutEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (active && !reduced) {
      tl.play();
    } else {
      tl.pause();
      const h = hold.current;
      if (h.raf) cancelAnimationFrame(h.raf);
      h.raf = 0;
      h.down = false;
      h.v = 0;
      paintRing(0);
    }
  }, [active, reduced]);

  const uid = `sc-${kind}`;
  const note = NOTES[kind];
  const job = HOLD[kind];

  return (
    <>
      {/* Revision count, in the title block's language: every job you see
          through bumps the drawing's revision. */}
      <span className={s.rev} aria-hidden="true">
        REV {String(rev).padStart(2, '0')}
      </span>

      <button
        type="button"
        className={s.hold}
        aria-label={job.aria}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKeyDown}
        onKeyUp={onUp}
        onContextMenu={(e) => e.preventDefault()}
        data-cursor="hover"
        data-cursor-label={job.label}
      >
        <svg className={s.holdRing} viewBox="0 0 44 44" aria-hidden="true">
          <circle className={s.holdTrack} cx="22" cy="22" r="19" />
          {/* pathLength=1 means the dash maths is the hold fraction itself,
              with no circumference to compute or keep in step with r. */}
          <circle
            ref={ringRef}
            className={s.holdFill}
            cx="22"
            cy="22"
            r="19"
            pathLength="1"
          />
        </svg>
        <span className={s.holdDot} aria-hidden="true" />
        <span className={s.holdLabel}>{job.label}</span>
      </button>

      <svg
        ref={ref}
        className={className}
        viewBox="0 0 320 200"
        fill="none"
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
      >
      <defs>
        <pattern
          id={`${uid}-hatch`}
          width="8"
          height="8"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--ink)" strokeWidth="1" />
        </pattern>
        <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
        <filter id={`${uid}-cast`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="4"
            floodColor="#191b1c"
            floodOpacity="0.18"
          />
        </filter>
      </defs>

      {/* Board behind the sheet. */}
      <g opacity="0.45">
        <path d="M-20 132 96 44 96 210 -20 210Z" fill={`url(#${uid}-hatch)`} opacity="0.5" />
        <rect
          x="212"
          y="-24"
          width="150"
          height="130"
          stroke="var(--line-2)"
          transform="rotate(9 287 41)"
        />
      </g>

      <rect
        x="40"
        y="22"
        width="240"
        height="156"
        fill="var(--frame)"
        stroke="var(--line-2)"
        filter={`url(#${uid}-cast)`}
      />

      {/* ── The message strip ────────────────────────────────
          Client note left in the marker hand, studio reply right in mono on
          iron. Same strip on all three cards. */}
      <g data-el="note" opacity="0">
        <path
          d="M50 30h150a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H62l-6 6v-6h-6a3 3 0 0 1-3-3V33a3 3 0 0 1 3-3z"
          fill="var(--soft)"
          stroke="var(--line-2)"
        />
        <g data-el="dots">
          <circle data-el="dot" cx="60" cy="41" r="2" fill="var(--ink-faint)" />
          <circle data-el="dot" cx="67" cy="41" r="2" fill="var(--ink-faint)" />
          <circle data-el="dot" cx="74" cy="41" r="2" fill="var(--ink-faint)" />
        </g>
        <text
          data-el="noteText"
          x="57"
          y="45"
          opacity="0"
          fill="var(--ink)"
          fontFamily={HAND}
          fontSize="11"
        >
          {note.ask}
        </text>
      </g>

      <g data-el="reply" opacity="0">
        <path
          d="M118 30h149a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3h-6v6l-6-6H118a3 3 0 0 1-3-3V33a3 3 0 0 1 3-3z"
          fill="var(--iron)"
        />
        <text x="125" y="44" fill="var(--frame)" fontFamily={MONO} fontSize="8.5">
          {note.reply}
        </text>
      </g>

      {/* ── 01 Design ─────────────────────────────────────── */}
      {kind === 'design' && (
        <g>
          {/* Setting-out lines: the left margin the identity hangs off,
              the baseline it sits on, and the bottom of the art panel. */}
          <g stroke="var(--anno-line)" strokeDasharray="3 3">
            <line data-el="guide" x1="56" y1="56" x2="56" y2="172" />
            <line data-el="guide" x1="46" y1="92" x2="274" y2="92" />
            <line data-el="guide" x1="46" y1="170" x2="274" y2="170" />
          </g>

          {/* ── Identity row ── */}
          <rect data-el="badge" x="56" y="60" width="38" height="38" fill={C.rough} />
          <text
            data-el="badgeGlyph"
            x="75"
            y="88"
            textAnchor="middle"
            fill={C.roughInk}
            fontFamily="Archivo, sans-serif"
            fontSize="22"
            style={{ fontVariationSettings: '"wght" 400' }}
          >
            M
          </text>

          <text
            data-el="word"
            x="104"
            y="84"
            fill={C.roughInk}
            fontFamily="Archivo, sans-serif"
            fontSize="25"
            style={{ fontVariationSettings: '"wght" 300' }}
          >
            Make
          </text>
          <rect data-el="rule" x="104" y="90" width="100" height="2.5" fill={C.rough} />
          <text
            data-el="sub"
            x="104"
            y="105"
            fill={C.roughInk}
            fontFamily={MONO}
            fontSize="6.5"
            letterSpacing="0.16em"
          >
            DESIGN · BUILD · GROW
          </text>

          {/* ── Art panel ──
              Starts as an empty frame with the placeholder cross everyone
              recognises, then the real composition lands inside it. */}
          <rect
            data-el="panel"
            x="56"
            y="114"
            width="208"
            height="54"
            fill={C.rough}
            stroke="var(--line-2)"
          />
          <g data-el="cross" stroke="var(--anno-line)" strokeWidth="1">
            <line x1="56" y1="114" x2="264" y2="168" />
            <line x1="264" y1="114" x2="56" y2="168" />
          </g>

          <circle data-el="art" cx="88" cy="141" r="16" fill={C.brand} />
          <rect data-el="art" x="114" y="124" width="66" height="34" fill={C.iron} />
          <rect
            data-el="art"
            x="190"
            y="124"
            width="66"
            height="34"
            fill={`url(#${uid}-hatch)`}
            opacity="0.55"
          />

          <g data-el="stamp" opacity="0" transform="rotate(-13 206 146)">
            <rect x="158" y="135" width="96" height="23" stroke={C.brand} strokeWidth="1.6" />
            <text
              x="206"
              y="150"
              textAnchor="middle"
              fill={C.brand}
              fontFamily={MONO}
              fontSize="9.5"
              letterSpacing="0.14em"
            >
              APPROVED
            </text>
          </g>
        </g>
      )}

      {/* ── 02 Build ──────────────────────────────────────── */}
      {kind === 'build' && (
        <g>
          {/* Three nested groups per part, each owning one job: the bob
              wrapper drifts while loose, the part group is what seats, and
              the flash rides inside it so it can never land misaligned. */}
          {BUILD_PARTS.map((p) => (
            <g data-el="bob" key={`p-${p.x}-${p.y}`}>
              <g data-el="part">
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={p.h}
                  fill={p.fill === 'hatch' ? `url(#${uid}-hatch)` : p.fill}
                  fillOpacity={p.o}
                  stroke="var(--line-2)"
                />
                <rect
                  data-el="snap"
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={p.h}
                  stroke="var(--brand)"
                  strokeWidth="1.6"
                  opacity="0"
                />
              </g>
            </g>
          ))}

          <g data-el="bar" opacity="0">
            <rect x="58" y="166" width="184" height="3" fill="var(--ink)" fillOpacity="0.12" />
            <rect data-el="barFill" x="58" y="166" width="184" height="3" fill={C.brand} />
            <text x="58" y="162" fill="var(--ink-faint)" fontFamily={MONO} fontSize="7">
              DEPLOYING
            </text>
          </g>

          <g data-el="live" opacity="0">
            <rect x="182" y="160" width="60" height="15" fill={C.grow} />
            <circle cx="191" cy="167.5" r="2.6" fill={C.frame} />
            <text x="198" y="171" fill={C.frame} fontFamily={MONO} fontSize="8">
              LIVE
            </text>
          </g>
        </g>
      )}

      {/* ── 03 Grow ───────────────────────────────────────── */}
      {kind === 'grow' && (
        <g>
          <g stroke="var(--line-2)">
            <line x1="58" y1="146" x2="262" y2="146" />
            <line x1="58" y1="124" x2="262" y2="124" />
            <line x1="58" y1="102" x2="262" y2="102" />
            <line x1="58" y1="80" x2="262" y2="80" />
          </g>
          {/* The ceiling — the line the curve is meant to break. */}
          <line
            data-el="ceiling"
            x1="58"
            y1="66"
            x2="262"
            y2="66"
            stroke="var(--brand)"
            strokeDasharray="5 3"
            opacity="0.4"
          />

          {/* Upper-left, not upper-right: a rising curve ends exactly where
              a right-aligned readout would sit, and it collided with both
              the peak and the ceiling line. This corner empties out as the
              curve climbs away from it. */}
          <text
            data-el="counter"
            x="60"
            y="82"
            fill="var(--ink)"
            fontFamily={MONO}
            fontSize="13"
          >
            0.4k
          </text>

          <g data-el="plotGroup">
            <path
              d="M58 142C94 134 110 120 138 110S184 98 206 80s34-24 56-30v88H58z"
              fill={`url(#${uid}-area)`}
            />
            <path
              data-el="line"
              d="M58 142C94 134 110 120 138 110S184 98 206 80s34-24 56-30"
              stroke={C.brand}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {Array.from({ length: 5 }, (_, i) => (
              <g data-el="aud" key={i}>
                <circle r="3.2" fill={C.brand} stroke={C.frame} strokeWidth="1.6" />
              </g>
            ))}
          </g>

          {/* Scattered off the peak when the ceiling goes. */}
          <g transform="translate(258 52)">
            {Array.from({ length: 5 }, (_, i) => (
              <path
                data-el="burst"
                key={i}
                d="M-2.5 0h5M0 -2.5v5"
                stroke={C.brand}
                strokeWidth="1.2"
                opacity="0"
              />
            ))}
          </g>

          {CHANNELS.map((c, i) => (
            <g data-el="chip" key={c} opacity="0.25">
              <rect x={58 + i * 62} y="158" width="56" height="15" stroke="var(--line-2)" />
              <circle cx={66 + i * 62} cy="165.5" r="2.4" fill={C.brand} />
              <text
                x={73 + i * 62}
                y="169"
                fill="var(--ink-soft)"
                fontFamily={MONO}
                fontSize="7"
              >
                {c}
              </text>
            </g>
          ))}
          </g>
        )}
      </svg>
    </>
  );
}

/* The job each card acts out. Placeholder voice — these are the three lines
   most worth rewriting, since they're the only copy on the page I wrote
   rather than you. */
/* How long a completed hold takes, and what the gesture is called on each
   card. The verb is the service. */
const HOLD_MS = 1500;

const HOLD: Record<CanvasKind, { label: string; aria: string }> = {
  design: { label: 'Hold to refine', aria: 'Press and hold to refine the design' },
  build: { label: 'Hold to assemble', aria: 'Press and hold to assemble the build' },
  grow: { label: 'Hold to push', aria: 'Press and hold to push the growth' },
};

const NOTES: Record<CanvasKind, { ask: string; reply: string }> = {
  design: { ask: 'Make it feel premium?', reply: "That's the one." },
  build: { ask: 'Live by Friday?', reply: 'Shipped Thursday.' },
  grow: { ask: "Nobody's finding us.", reply: "Now they're finding you." },
};

/* The seated layout. Loose positions are offsets from this, so the assembled
   arrangement stays the single source of truth. */
const BUILD_PARTS = [
  { x: 58, y: 62, w: 184, h: 13, fill: '#1c1f21', o: 0.85 },
  { x: 58, y: 81, w: 112, h: 42, fill: '#e4551c', o: 0.85 },
  { x: 180, y: 81, w: 62, h: 42, fill: 'hatch', o: 0.5 },
  { x: 58, y: 129, w: 88, h: 24, fill: '#3d4f57', o: 0.55 },
  { x: 154, y: 129, w: 88, h: 24, fill: '#191b1c', o: 0.14 },
];

const CHANNELS = ['SOCIAL', 'CONTENT', 'PAID'];
