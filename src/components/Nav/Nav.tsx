import { useEffect, useRef, useState } from 'react';
import { gsap } from '../../lib/gsap';
import { getLenis, scrollTo, setScrollLocked } from '../../lib/smoothScroll';
import { useReducedMotion } from '../../lib/env';
import LiveClock from '../LiveClock';
import MagneticButton from '../MagneticButton/MagneticButton';
import { NAV_LINKS, SITE } from '../../data/site';
import s from './Nav.module.css';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  const overlayRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  /* Scroll state: condense past the hero, hide when diving down. */
  useEffect(() => {
    const lenis = getLenis();
    if (!lenis) return;

    let last = 0;
    const onScroll = ({ scroll }: { scroll: number }) => {
      setScrolled(scroll > 40);
      setHidden(scroll > 220 && scroll > last + 4);
      last = scroll;
    };

    lenis.on('scroll', onScroll);
    return () => lenis.off('scroll', onScroll);
  }, []);

  /* Overlay timeline — clip-path wipe + staggered links. */
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const links = el.querySelectorAll(`.${s.menuLink}`);
      const foot = el.querySelector(`.${s.overlayFoot}`);

      const tl = gsap
        .timeline({ paused: true })
        .set(el, { visibility: 'visible' })
        .fromTo(
          el,
          { clipPath: 'inset(0 0 100% 0)' },
          {
            clipPath: 'inset(0 0 0% 0)',
            duration: reduced ? 0.01 : 0.8,
            ease: 'expo.inOut',
          },
        )
        .from(
          links,
          {
            yPercent: 118,
            opacity: 0,
            duration: reduced ? 0.01 : 0.9,
            stagger: 0.07,
            ease: 'expo.out',
          },
          '-=0.45',
        )
        .from(
          foot,
          { y: 24, opacity: 0, duration: reduced ? 0.01 : 0.7, ease: 'expo.out' },
          '-=0.5',
        );

      tlRef.current = tl;
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;

    if (open) {
      tl.play();
      setScrollLocked(true);
    } else {
      tl.reverse().then(() => {
        if (!overlayRef.current) return;
        gsap.set(overlayRef.current, { visibility: 'hidden' });
      });
      setScrollLocked(false);
    }
  }, [open]);

  /* Escape closes it. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (hash: string) => {
    setOpen(false);
    // Let the overlay start closing before the scroll takes over.
    window.setTimeout(() => scrollTo(hash, -80), open ? 240 : 0);
  };

  return (
    <>
      <header
        className={s.root}
        data-scrolled={scrolled}
        data-hidden={hidden && !open}
        data-menu={open}
      >
        {/* The wordmark lives in the dark rail above — repeating it here
            on a light canvas would only mean a second contrast problem. */}
        <span className={`${s.pill} label`}>
          <span className={s.dot} aria-hidden="true" />
          <span>{SITE.availability}</span>
        </span>

        <nav className={`${s.links} ${s.pillbox}`} aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              className={s.link}
              href={l.href}
              onClick={(e) => {
                e.preventDefault();
                go(l.href);
              }}
              data-cursor="hover"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className={s.right}>
          <a className={`${s.mail} label`} href={`mailto:${SITE.email}`} data-cursor="hover">
            {SITE.email}
          </a>

          <MagneticButton className={s.cta} onClick={() => go('#contact')} variant="solid">
            Start a project
          </MagneticButton>

          <button
            className={s.burger}
            aria-expanded={open}
            aria-controls="menu-overlay"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={s.bar} />
            <span className={s.bar} />
          </button>
        </div>
      </header>

      <div
        id="menu-overlay"
        ref={overlayRef}
        className={s.overlay}
        aria-hidden={!open}
        inert={!open}
      >
        <div className={s.overlaySheen} aria-hidden="true" />

        <nav className={s.menuList} aria-label="Mobile">
          {NAV_LINKS.map((l, i) => (
            <span className={s.menuItem} key={l.href}>
              <a
                className={s.menuLink}
                href={l.href}
                onClick={(e) => {
                  e.preventDefault();
                  go(l.href);
                }}
              >
                <span className={s.menuIndex}>0{i + 1}</span>
                {l.label}
              </a>
            </span>
          ))}
        </nav>

        <div className={s.overlayFoot}>
          <span className={s.overlayPill}>
            <span className={s.dot} aria-hidden="true" />
            {SITE.availability}
            <span className={s.divider} aria-hidden="true">
              /
            </span>
            <LiveClock />
          </span>
          <a className={s.overlayMail} href={`mailto:${SITE.email}`}>
            {SITE.email}
          </a>
          <span className="label" style={{ color: 'var(--ink-soft)' }}>
            {SITE.location}
          </span>
        </div>
      </div>
    </>
  );
}
