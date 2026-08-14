import { useEffect, useRef } from 'react';
import { gsap, Draggable } from '../../lib/gsap';
import { useIsTouch, useReducedMotion } from '../../lib/env';
import s from './DragCard.module.css';

type Props = {
  label?: string;
  hint?: string;
  className?: string;
};

/* Escalates on repeat drags. The joke is only funny once; the payoff for
   doing it again has to be that the card notices. */
const REPLIES = [
  'well, that happened.',
  'again? really.',
  'okay, you clearly enjoy this.',
  'fine. drag away.',
  'we could be doing this all day.',
];

export default function DragCard({
  label = 'do not remove',
  hint = 'this tag stays',
  className,
}: Props) {
  const floatRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLSpanElement>(null);
  const toastTextRef = useRef<HTMLSpanElement>(null);
  const homeRef = useRef<HTMLSpanElement>(null);
  const dragCount = useRef(0);
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();

  useEffect(() => {
    const card = cardRef.current;
    const floater = floatRef.current;
    const toastEl = toastRef.current;
    const homeEl = homeRef.current;
    if (!card || !floater) return;

    const ctx = gsap.context(() => {
      // The float lives on the wrapper; Draggable owns x/y on the card.
      const float = reduced
        ? null
        : gsap.to(floater, {
            y: -7,
            rotation: 1.2,
            duration: 2.8,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });

      const springBack = () =>
        gsap.to(card, {
          x: 0,
          y: 0,
          rotation: 0,
          duration: reduced ? 0.2 : isTouch ? 0.9 : 1.15,
          ease: reduced
            ? 'power2.out'
            : isTouch
              ? 'elastic.out(1, 0.75)'
              : 'elastic.out(1, 0.42)',
        });

      const showToast = () => {
        if (!toastEl || reduced) return;
        const text = toastTextRef.current;
        if (text) {
          text.textContent = REPLIES[Math.min(dragCount.current, REPLIES.length - 1)];
        }

        gsap
          .timeline()
          .set(toastEl, { y: 10, scale: 0.7, rotation: -6, opacity: 0 })
          .to(toastEl, {
            opacity: 1,
            y: 0,
            scale: 1,
            rotation: 0,
            duration: 0.55,
            ease: 'back.out(3)',
          })
          // Sits long enough to actually be read.
          .to(toastEl, { opacity: 0, y: -8, duration: 0.45, ease: 'power2.in' }, '+=1.9');
      };

      const [drag] = Draggable.create(card, {
        type: 'x,y',
        dragResistance: 0.14,
        onPress() {
          float?.pause();
          gsap.to(floater, { y: 0, rotation: 0, duration: 0.4, ease: 'power3.out' });
          gsap.to(card, {
            scale: 1.06,
            duration: 0.35,
            ease: 'back.out(2)',
          });
          // Reveal where it's going to snap back to.
          if (homeEl) gsap.to(homeEl, { opacity: 1, duration: 0.3 });
          card.dataset.dragging = 'true';
        },
        onDrag() {
          // Lean into the direction of travel.
          gsap.set(card, { rotation: gsap.utils.clamp(-12, 12, this.x * 0.07) });
        },
        onRelease() {
          gsap.to(card, { scale: 1, duration: 0.5, ease: 'power3.out' });
          if (homeEl) gsap.to(homeEl, { opacity: 0, duration: 0.45 });
          card.dataset.dragging = 'false';
        },
        onDragEnd() {
          springBack();
          showToast();
          dragCount.current += 1;
          gsap.delayedCall(1.4, () => float?.restart(true));
        },
      });

      return () => {
        drag.kill();
        float?.kill();
      };
    }, card);

    return () => ctx.revert();
  }, [isTouch, reduced]);

  return (
    <div className={`${s.wrap} ${className ?? ''}`}>
      <span ref={homeRef} className={s.home} aria-hidden="true" />

      <div ref={floatRef} className={s.floater}>
        <div
          ref={cardRef}
          className={s.card}
          data-dragging="false"
          data-cursor="drag"
          data-cursor-label="Drag me"
          role="button"
          tabIndex={0}
          aria-label={`${label} — a draggable card that springs back`}
        >
          <span className={s.chrome} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className={s.label}>{label}</span>
          <span className={s.hint}>{hint}</span>
          <span className={s.grip} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>

      <span ref={toastRef} className={s.toast} aria-live="polite">
        <span aria-hidden="true">✋</span>
        <span ref={toastTextRef}>{REPLIES[0]}</span>
      </span>
    </div>
  );
}
