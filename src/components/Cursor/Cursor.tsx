import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { useIsTouch, useReducedMotion } from '../../lib/env';
import s from './Cursor.module.css';

/**
 * The crosshair — a draughtsman's pointer rather than a collaborator's.
 *
 * It carries a live coordinate readout instead of a name, so the thing
 * following your hand is a measuring instrument reporting where it is on
 * the sheet. The centre of the cross is the hot spot, so the whole rig is
 * translated to sit on the pointer rather than hanging off it.
 *
 * Elements opt in declaratively — no context plumbing:
 *   data-cursor="hover"                             → cross locks on
 *   data-cursor="drag"    data-cursor-label="Drag"  → readout swaps to label
 *   data-cursor="measure" data-cursor-label="…"     → same, measuring accent
 *   data-cursor="idle"                              → no treatment
 */
export default function Cursor() {
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTouch) return;
    const root = rootRef.current;
    if (!root) return;

    document.documentElement.classList.add('has-custom-cursor');

    const readoutEl = root.querySelector<HTMLElement>(`.${s.readout}`);
    const labelEl = root.querySelector<HTMLElement>(`.${s.label}`);
    const dur = reduced ? 0 : 0.3;
    const xTo = gsap.quickTo(root, 'x', { duration: dur, ease: 'power3.out' });
    const yTo = gsap.quickTo(root, 'y', { duration: dur, ease: 'power3.out' });

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          xTo(e.clientX);
          yTo(e.clientY);
          // textContent only — no layout read, no style recalc beyond the
          // one text node, and it's already inside the rAF.
          if (readoutEl) {
            readoutEl.textContent = `${Math.round(e.clientX)} ${Math.round(e.clientY)}`;
          }
        });
      }
      if (root.dataset.visible !== 'true') root.dataset.visible = 'true';
    };

    const resolve = (e: Event) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '[data-cursor], a, button, input, textarea, select, [role="button"]',
      );

      const label = target?.dataset.cursorLabel ?? '';
      const mode = target?.dataset.cursor ?? (target ? 'hover' : 'idle');

      root.dataset.state = mode;
      root.dataset.hasLabel = String(Boolean(label));
      if (labelEl) labelEl.textContent = label;
    };

    const onLeave = () => (root.dataset.visible = 'false');
    const onDown = () => (root.dataset.pressed = 'true');
    const onUp = () => (root.dataset.pressed = 'false');

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', resolve, { passive: true });
    document.addEventListener('pointerout', resolve, { passive: true });
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', resolve);
      document.removeEventListener('pointerout', resolve);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [isTouch, reduced]);

  if (isTouch) return null;

  return (
    <div
      ref={rootRef}
      className={s.cursor}
      aria-hidden="true"
      data-state="idle"
      data-visible="false"
      data-has-label="false"
      data-pressed="false"
    >
      <svg className={s.cross} viewBox="0 0 32 32" fill="none">
        {/* Broken at the centre so the ring, and whatever is under it,
            stay readable — the way a centre mark is drawn. */}
        <path className={s.hair} d="M0 16h10M22 16h10M16 0v10M16 22v10" />
        <circle className={s.ring} cx="16" cy="16" r="5" />
        <circle className={s.pip} cx="16" cy="16" r="1" />
      </svg>

      <span className={s.tag}>
        <span className={s.readout}>0 0</span>
        <span className={s.label} />
      </span>
    </div>
  );
}
