import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { scrollTo } from '../../lib/smoothScroll';
import { useReducedMotion } from '../../lib/env';
import BrandMark from '../../components/BrandMark';
import { SITE } from '../../data/site';
import s from './Footer.module.css';

const SOCIALS = [
  { label: 'Instagram', href: SITE.instagram },
  { label: 'LinkedIn', href: SITE.linkedin },
  { label: 'WhatsApp', href: SITE.whatsapp },
  { label: 'Email', href: `mailto:${SITE.email}` },
];

export default function Footer() {
  const markRef = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();

  /* The wordmark rises out of its mask as the footer arrives. */
  useLayoutEffect(() => {
    const el = markRef.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        yPercent: 110,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <footer className={s.root}>
      <span className={s.markWrap}>
        <BrandMark ref={markRef} className={s.mark} withTagline />
      </span>

      <div className={s.row}>
        <nav className={`${s.socials} label`} aria-label="Social">
          {SOCIALS.map((l) => (
            <a
              className={s.social}
              key={l.label}
              href={l.href}
              target={l.href.startsWith('http') ? '_blank' : undefined}
              rel={l.href.startsWith('http') ? 'noreferrer noopener' : undefined}
              data-cursor="hover"
            >
              <span className={s.socialLabel}>{l.label}</span>
              <span className={s.socialArrow} aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </nav>

        <button
          type="button"
          className={`${s.top} label`}
          onClick={() => scrollTo(0)}
          data-cursor="hover"
          aria-label="Back to top"
        >
          Back to top
          <span className={s.topRing} aria-hidden="true">
            <span className={s.topArrow}>↑</span>
            <span className={`${s.topArrow} ${s.topArrowGhost}`}>↑</span>
          </span>
        </button>
      </div>

      <div className={`${s.bottom} label`}>
        <span>Made in Coimbatore, served worldwide. © {SITE.year}</span>
        <span className={s.signoff}>
          still scrolling? go on then — book the call.
        </span>
      </div>
    </footer>
  );
}
