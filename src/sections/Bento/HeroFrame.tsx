import s from './HeroFrame.module.css';

/**
 * A miniature plate being set out, forever. Pure CSS keyframes — the card's
 * job is to show the studio at work, and nothing about it needs state,
 * scroll position or a pointer.
 *
 * It used to be a small design tool: marching ants, resize handles and a
 * named collaborator cursor. It's a drawing now — registration marks, a
 * dimension across the top, a datum sweeping the sheet, and a scriber
 * working its way around.
 */
export default function HeroFrame() {
  return (
    <div className={s.stage} aria-hidden="true">
      {/* The plate's overall size, dimensioned properly rather than parked
          in a corner as a readout chip. */}
      <span className={s.dim}>
        <i className={s.dimExt} />
        <i className={s.dimRule} />
        <span className={s.dimFig}>300 × 200</span>
        <i className={s.dimRule} />
        <i className={s.dimExt} />
      </span>

      <div className={s.plate}>
        <span className={s.regs}>
          <i className={`${s.reg} ${s.r1}`} />
          <i className={`${s.reg} ${s.r2}`} />
          <i className={`${s.reg} ${s.r3}`} />
          <i className={`${s.reg} ${s.r4}`} />
        </span>

        <span className={s.kicker}>Client: yours</span>
        <p className={s.title}>
          Look <span className={s.titleAccent}>expensive.</span>
        </p>
        <span className={s.cta}>Build →</span>
      </div>

      {/* Ink being tried — squares off a strip, not rounded swatches. */}
      <span className={s.chips}>
        <i className={s.chip} />
        <i className={s.chip} />
        <i className={s.chip} />
      </span>

      {/* The scriber: a crosshair sighting points around the plate. */}
      <span className={s.scriber}>
        <svg viewBox="0 0 20 20" fill="none">
          <path
            d="M0 10h6M14 10h6M10 0v6M10 14v6"
            stroke="var(--brand)"
            strokeWidth="1.2"
          />
          <circle cx="10" cy="10" r="3" stroke="var(--brand)" strokeWidth="1.2" />
        </svg>
        <span className={s.scriberTag}>Set out</span>
      </span>

      {/* A reference line crossing the sheet, on its own slow cycle so it
          never lands in step with the scriber. */}
      <span className={s.datum} />

      <span className={s.live}>
        <span className="am-eq" style={{ height: 7, color: 'var(--brand)' }}>
          <i />
          <i />
          <i />
          <i />
        </span>
        On the board
      </span>
    </div>
  );
}
