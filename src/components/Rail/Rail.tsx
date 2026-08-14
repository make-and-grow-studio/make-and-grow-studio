import { useEffect, useState } from 'react';
import { getLenis } from '../../lib/smoothScroll';
import BrandMark from '../BrandMark';
import LiveClock from '../LiveClock';
import { SITE } from '../../data/site';
import s from './Rail.module.css';

/**
 * The title block. Every drawing carries one — who drew it, what sheet you
 * are looking at, at what scale, at which revision — and it is the first
 * thing that tells you the page is a document rather than a brochure.
 *
 * Its one live field is the sheet: an IntersectionObserver keeps it on
 * whatever section is crossing the middle of the viewport, so the strip
 * reports where you are instead of just decorating the top of the page.
 */

const SHEETS = [
  { id: 'top', title: 'General arrangement' },
  { id: 'about', title: 'About' },
  { id: 'process', title: 'Process' },
  { id: 'services', title: 'Services' },
  { id: 'contact', title: 'Contact' },
] as const;

const TOTAL = String(SHEETS.length).padStart(2, '0');

export default function Rail() {
  const [pct, setPct] = useState(0);
  const [sheet, setSheet] = useState(0);

  /* Which sheet is on the board. */
  useEffect(() => {
    const nodes = SHEETS.map((sh) => document.getElementById(sh.id));

    // The band is a thin slice across the middle of the viewport, so only
    // one section is ever intersecting and there's no tie to break.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = nodes.indexOf(entry.target as HTMLElement);
          if (i !== -1) setSheet(i);
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );

    for (const node of nodes) if (node) io.observe(node);
    return () => io.disconnect();
  }, []);

  /* Plot progress. */
  useEffect(() => {
    const read = (scroll: number) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.round((scroll / max) * 100) : 0);
    };

    const lenis = getLenis();
    if (lenis) {
      const onScroll = ({ scroll }: { scroll: number }) => read(scroll);
      lenis.on('scroll', onScroll);
      return () => lenis.off('scroll', onScroll);
    }

    const onScroll = () => read(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={s.root} aria-hidden="true">
      {/* Wordmark only — BrandMark omits the tagline path rather than
          cropping it out, and takes its colour from the strip. */}
      <span className={`${s.cell} ${s.brandCell}`}>
        <BrandMark className={s.mark} title="" />
      </span>

      <span className={`${s.cell} ${s.sheetCell}`}>
        <i className={s.key}>Sheet</i>
        <span className={s.val}>
          {String(sheet + 1).padStart(2, '0')}
          <span className={s.of}>/{TOTAL}</span>
        </span>
        {/* Keyed so the title re-runs its wipe on every change. */}
        <span className={s.sheetTitle} key={sheet}>
          {SHEETS[sheet].title}
        </span>
      </span>

      <span className={`${s.cell} ${s.wide}`}>
        <i className={s.key}>Scale</i>
        <span className={s.val}>1:1</span>
      </span>

      <span className={`${s.cell} ${s.wide}`}>
        <i className={s.key}>Rev</i>
        <span className={s.val}>{SITE.year}.02</span>
      </span>

      {/* The empty ruled field a title block always has spare. */}
      <span className={`${s.cell} ${s.spacer}`} />

      <span className={s.cell}>
        <i className={s.key}>Plot</i>
        <span className={s.plot}>{pct}%</span>
      </span>

      <span className={s.cell}>
        <span className={s.liveDot} />
        <span className={s.val}>Live</span>
        <LiveClock className={s.clock} timeZone={SITE.timeZone} />
      </span>
    </div>
  );
}
