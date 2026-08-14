import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useInView } from 'framer-motion';
import { useIsTouch } from '../../lib/env';
import s from './Dimension.module.css';

type Props = {
  children: ReactNode;
  /** Text set after the measurement, e.g. "STATEMENT". Omit for the figure alone. */
  label?: string;
  /**
   * 'click'  — click to dimension it, click away to clear. A dotted rule
   *            on hover is the affordance.
   * 'view'   — lays itself in when scrolled into view.
   * 'hover'  — shows while the pointer is over it.
   * 'always' — permanently dimensioned.
   */
  on?: 'click' | 'view' | 'hover' | 'always';
  /** Distance from the content to the registration marks. */
  pad?: number;
  className?: string;
};

/**
 * Dimensions an element the way a drawing does: registration marks at the
 * corners, extension lines dropping from each edge, and a dimension rule
 * that draws outward from a break where the figure sits.
 *
 * The figure is the element's real measured width in CSS pixels, kept live
 * by a ResizeObserver — so it's an actual measurement of an actual object,
 * not a decorative number. Resize the window and it counts.
 *
 * Purely additive: the annotation layer is `pointer-events: none` and sits
 * outside the content flow, so it can never intercept a click or reflow
 * what it's measuring.
 */
export default function Dimension({
  children,
  label,
  on = 'click',
  pad = 10,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isTouch = useIsTouch();
  const [picked, setPicked] = useState(false);
  const [width, setWidth] = useState(0);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  // Hover is meaningless without a pointer, so on touch it falls back to
  // click rather than never showing at all.
  const mode = on === 'hover' && isTouch ? 'click' : on;

  /* The live measurement. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Clicking elsewhere clears it. */
  useEffect(() => {
    if (mode !== 'click' || !picked) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPicked(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPicked(false);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [mode, picked]);

  const shown =
    mode === 'always' || (mode === 'view' && inView) || (mode === 'click' && picked);

  const clickable = mode === 'click';

  return (
    <div
      ref={ref}
      className={`${s.wrap} ${className ?? ''}`}
      style={{ '--dim-pad': `${pad}px` } as React.CSSProperties}
      data-shown={shown || undefined}
      data-dim-hover={mode === 'hover' || undefined}
      data-dim-click={clickable || undefined}
      {...(clickable
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-pressed': picked,
            'aria-label': label ? `Dimension ${label}` : 'Dimension this element',
            'data-cursor': 'measure',
            'data-cursor-label': picked ? 'Measured' : 'Measure',
            onClick: () => setPicked((v) => !v),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setPicked((v) => !v);
              }
            },
          }
        : {})}
    >
      {children}

      <span className={s.anno} aria-hidden="true">
        <span className={`${s.mark} ${s.tl}`} />
        <span className={`${s.mark} ${s.tr}`} />
        <span className={`${s.mark} ${s.bl}`} />
        <span className={`${s.mark} ${s.br}`} />

        <span className={s.dim}>
          <span className={`${s.ext} ${s.extL}`} />
          <span className={`${s.rule} ${s.ruleL}`} />
          <span className={s.figure}>
            {width}
            {label && <em className={s.figureLabel}>{label}</em>}
          </span>
          <span className={`${s.rule} ${s.ruleR}`} />
          <span className={`${s.ext} ${s.extR}`} />
        </span>
      </span>
    </div>
  );
}
