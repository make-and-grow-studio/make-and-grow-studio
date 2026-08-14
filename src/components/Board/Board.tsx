import s from './Board.module.css';

/**
 * The drawing board behind everything.
 *
 * Three layers, none of them driven by JS: a drafting grid, a set of
 * construction figures that draw themselves in and fade, and a section-hatch
 * band along the bottom.
 *
 * The construction layer is the ambient motion. On a board you strike the
 * compass arcs and centrelines *before* the object exists — so geometry
 * quietly appearing and dissolving is the one kind of background movement
 * this metaphor actually asks for, rather than decoration bolted on.
 *
 * Every figure carries pathLength="1", so a single dasharray/dashoffset pair
 * in CSS draws all of them regardless of their real arc length. No measuring.
 */

type Figure = {
  /** `c` = circle, `p` = path */
  d: string;
  /** seconds for one full draw → hold → fade cycle */
  dur: number;
  /** negative, so they're mid-cycle at load instead of starting together */
  delay: number;
  w?: number;
};

const FIGURES: Figure[] = [
  // Compass work, upper right.
  { d: 'M1440 300a260 260 0 1 1-520 0 260 260 0 0 1 520 0', dur: 46, delay: -4 },
  { d: 'M1180 40a260 260 0 0 1 225 130', dur: 28, delay: -19, w: 1.4 },
  { d: 'M1240 300a60 60 0 1 1-120 0 60 60 0 0 1 120 0', dur: 34, delay: -26 },

  // Struck from a second centre, lower left.
  { d: 'M480 760a180 180 0 1 1-360 0 180 180 0 0 1 360 0', dur: 52, delay: -33 },
  { d: 'M300 580 300 940', dur: 24, delay: -11 },
  { d: 'M120 760 480 760', dur: 24, delay: -14 },

  // Setting-out lines across the sheet.
  { d: 'M0 520 1600 520', dur: 62, delay: -40, w: 1.2 },
  { d: 'M980 0 980 1000', dur: 58, delay: -22, w: 1.2 },

  // An angle laid off between the two centres.
  { d: 'M300 760 1180 300 1180 760Z', dur: 44, delay: -50, w: 1.3 },
];

export default function Board() {
  return (
    <div className={s.board} aria-hidden="true">
      <div className={s.grid} />

      <svg
        className={s.construction}
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {FIGURES.map((f, i) => (
          <path
            key={i}
            className={s.figure}
            d={f.d}
            pathLength="1"
            strokeWidth={f.w ?? 1.6}
            style={{
              animationDuration: `${f.dur}s`,
              animationDelay: `${f.delay}s`,
            }}
          />
        ))}
      </svg>

      <div className={s.hatch} />
    </div>
  );
}
