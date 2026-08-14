import RevealText from '../../components/RevealText';
import LiveClock from '../../components/LiveClock';
import Counter from '../../components/Counter';
import InfinityMark from '../../components/InfinityMark';
import HeroFrame from './HeroFrame';
import { SITE } from '../../data/site';
import s from './Bento.module.css';

/* Honest for a new studio — how we work, not invented project counts. */
const FIGURES = [
  { value: '72h', label: 'brief → first draft' },
  { value: '3', label: 'people on your project' },
  { value: '1', label: 'team, start to finish' },
  { value: '∞', label: 'revisions until it’s right' },
] as const;

const REFUSALS = ['handoffs', 'retainer traps', '“that’s not us”'];

const SCOPE = [
  'Identity',
  'Interfaces',
  'Web build',
  'Motion',
  'Content',
  'Paid',
];

const TOOLS = ['Figma', 'React', 'GSAP', 'Webflow'];

/**
 * The dashboard. One grid of cards rather than three stacked full-width
 * bands — it reads as a workspace you're looking into, which is the whole
 * premise of the page.
 */
export default function Bento() {
  return (
    <section className={s.root} id="about" aria-labelledby="bento-lead">
      <div className={`${s.head} label`}>
        <span className={s.headTag}>Cover note</span>
        <span aria-hidden="true">/</span>
        <span>Why we exist</span>
        <span className={`${s.headMeta} mono`} aria-hidden="true">
          <LiveClock timeZone={SITE.timeZone} withSeconds={false} /> — Coimbatore
        </span>
      </div>

      <p className={`${s.aside} hand am-shimmer`} aria-hidden="true">
        a little about us
      </p>

      <div className={s.grid}>
        {/* ── Statement ── */}
        <article className={`${s.card} ${s.stmt}`}>
          <span className={`${s.cardLabel} label`}>
            <span className={s.cardLabelTag}>01</span> Statement
          </span>

          <RevealText
            as="h2"
            id="bento-lead"
            type="words"
            stagger={0.035}
            duration={0.9}
            className={s.lead}
          >
            Most studios stop when the design is done. That’s about{' '}
            <span className={s.quote}>halfway.</span>
          </RevealText>

          <p className={s.detail}>
            Design, build and growth are <strong>one job</strong> here — the same
            three people from the first sketch to the traffic that shows up
            afterwards. Nothing gets handed to a stranger in the middle.
          </p>

          <div className={s.nos}>
            {REFUSALS.map((r) => (
              <span className={s.no} key={r} data-cursor="hover">
                <span className={s.noX} aria-hidden="true">
                  ✕
                </span>
                No {r}
              </span>
            ))}
          </div>

          <p className={`${s.stmtFoot} label`}>
            <span>Coimbatore · Est. {SITE.year}</span>
            <span className={s.stmtFootRight}>
              <span className={`${s.dot} am-ping`} aria-hidden="true" />
              Taking work
            </span>
          </p>
        </article>

        {/* ── Metrics ── */}
        <article className={`${s.card} ${s.dark} ${s.metrics}`}>
          <span className={`${s.cardLabel} label`}>
            <span className={s.cardLabelTag}>02</span> Metrics
          </span>

          <div className={s.metricGrid}>
            {FIGURES.map((f, i) => (
              <div className={s.metric} key={f.value}>
                <Counter
                  value={f.value}
                  symbol={
                    f.value === '∞' ? <InfinityMark className={s.inf} /> : undefined
                  }
                  className={s.metricValue}
                  delay={i * 0.06}
                />
                <span className={`${s.metricLabel} label`}>{f.label}</span>
              </div>
            ))}
          </div>
        </article>

        {/* ── Capabilities ── */}
        <article className={`${s.card} ${s.caps}`}>
          <span className={`${s.cardLabel} label`}>
            <span className={s.cardLabelTag}>03</span> Scope
          </span>

          <div className={s.chips}>
            {SCOPE.map((c) => (
              <span className={s.chip} key={c} data-cursor="hover">
                <span className={s.chipDot} aria-hidden="true" />
                {c}
              </span>
            ))}
          </div>
        </article>

        {/* ── The live artboard ── */}
        <article className={`${s.card} ${s.dark} ${s.frame}`}>
          <span className={`${s.cardLabel} label`}>
            <span className={s.cardLabelTag}>04</span> Plate 04 / work in progress
          </span>
          <HeroFrame />
        </article>

        {/* ── Now playing ── */}
        <article className={`${s.card} ${s.now}`}>
          <span className={`${s.cardLabel} label`}>
            <span className={s.cardLabelTag}>05</span> On the bench right now
          </span>

          <p className={s.nowTitle}>React &amp; GSAP</p>

          <div className={s.nowTools}>
            {TOOLS.map((t) => (
              <span className={s.tool} key={t}>
                {t}
              </span>
            ))}
          </div>

          <span className={s.eqWrap}>
            <span className="am-eq">
              <i />
              <i />
              <i />
              <i />
            </span>
          </span>
        </article>

        {/* ── Signal ── */}
        <article className={`${s.card} ${s.signal}`}>
          <span className={`${s.cardLabel} label`}>
            <span className={s.cardLabelTag}>06</span> Signal
          </span>

          <p className={s.signalClock}>
            <LiveClock timeZone={SITE.timeZone} />
          </p>
          <span className={`${s.signalWhere} label`}>{SITE.location}</span>

          <p className={s.signalNote}>
            Small team. Suspiciously fast. A few slots open this quarter.
          </p>
        </article>
      </div>
    </section>
  );
}
