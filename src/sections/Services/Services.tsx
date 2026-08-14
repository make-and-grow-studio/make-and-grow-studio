import { useRef } from 'react';
import { useInView } from 'framer-motion';
import RevealText from '../../components/RevealText';
import HorizontalPan from '../../components/HorizontalPan/HorizontalPan';
import ServiceCanvas, { type CanvasKind } from './ServiceCanvas';
import s from './Services.module.css';

const SERVICES: {
  n: string;
  name: string;
  copy: string;
  tags: string[];
  kind: CanvasKind;
}[] = [
  {
    n: '01',
    name: 'Design',
    copy: 'Brand, UI/UX, and visuals that make you look premium.',
    tags: ['Brand Identity', 'UI/UX', 'Social & Ad Creatives'],
    kind: 'design',
  },
  {
    n: '02',
    name: 'Build',
    copy: 'Fast, modern, AI-native. You launch sooner, not “eventually”.',
    tags: ['Websites', 'Web Apps', 'Motion & 3D'],
    kind: 'build',
  },
  {
    n: '03',
    name: 'Grow',
    copy: 'Marketing that turns attention into customers.',
    tags: ['Social', 'Content', 'Paid Ads'],
    kind: 'grow',
  },
];

type Service = (typeof SERVICES)[number];

function Panel({ svc }: { svc: Service }) {
  const ref = useRef<HTMLElement>(null);
  /* Not `once`: the scene idles while off-screen and picks up when the pan
     brings it back. IntersectionObserver reads the transformed position,
     so the horizontal pan drives it for free. */
  const inView = useInView(ref, { amount: 0.45 });

  return (
    // No cursor treatment on the panel itself any more — the hold button
    // carries its own label, and the card as a whole is not draggable.
    <article className={s.panel} ref={ref}>
      <div className={s.canvasWrap}>
        <ServiceCanvas kind={svc.kind} active={inView} className={s.canvas} />
      </div>

      <div className={s.body}>
        <p className={`${s.num} label`}>
          {svc.n}
          <span className={s.numRule} aria-hidden="true" />
        </p>
        <h3 className={s.name}>{svc.name}</h3>
        <p className={s.copy}>{svc.copy}</p>

        <div className={s.tags}>
          {svc.tags.map((t) => (
            <span className={s.tag} key={t}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function Services() {
  return (
    <section className={s.root} id="services" aria-labelledby="services-title">
      <div className={s.head}>
        <div className={`${s.headTop} label`}>
          <span className={s.headTag}>What we do</span>
          <span aria-hidden="true">/</span>
          <span>Three jobs, one team</span>
        </div>

        <RevealText as="h2" id="services-title" className={s.title}>
          Three jobs. One team.
        </RevealText>

        {/* Only shown where the pan is actually running. */}
        <p className={`${s.hint} label`}>
          Keep scrolling — they run sideways
          <span className={`${s.hintArrow} am-nudge-x`} aria-hidden="true">
            →
          </span>
        </p>
      </div>

      <HorizontalPan>
        {SERVICES.map((svc) => (
          <Panel svc={svc} key={svc.n} />
        ))}
      </HorizontalPan>
    </section>
  );
}
