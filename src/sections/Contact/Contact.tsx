import RevealText from '../../components/RevealText';
import MagneticButton from '../../components/MagneticButton/MagneticButton';
import LiveClock from '../../components/LiveClock';
import { SITE, waLink, BOOK_MESSAGE } from '../../data/site';
import s from './Contact.module.css';

export default function Contact() {
  return (
    <section className={s.root} id="contact" aria-labelledby="contact-title">
      <div className={s.bloom} aria-hidden="true" />

      <div className={`${s.head} label`}>
        <span className={s.headTag}>Contact</span>
        <span aria-hidden="true">/</span>
        <span>A few slots left this quarter</span>
      </div>

      <RevealText as="h2" id="contact-title" className={s.title}>
        Tell us what{' '}
        <span className={s.accent}>you’re making.</span>
      </RevealText>

      <p className={s.sub}>
        If your brand’s ready to look world-class and grow online,{' '}
        <strong>we should talk</strong>. A few slots open this quarter — first come,
        first served, no vibes-only clients.
      </p>

      <div className={s.actions}>
        {/* The visible label says "call" but this opens WhatsApp, so the
            accessible name has to say so — otherwise a screen reader user
            has no warning they're leaving for another app. */}
        <MagneticButton
          href={waLink(BOOK_MESSAGE)}
          variant="solid"
          size="lg"
          strength={0.45}
          ariaLabel="Book a call — opens WhatsApp with a message ready to send"
        >
          Book a call →
        </MagneticButton>
      </div>

      <dl className={`${s.details} label`}>
        <div className={s.detail}>
          <dt className={s.detailKey}>Email</dt>
          <dd>
            <a
              className={s.detailVal}
              href={`mailto:${SITE.email}`}
              data-cursor="hover"
            >
              {SITE.email}
            </a>
          </dd>
        </div>

        <div className={s.detail}>
          <dt className={s.detailKey}>Phone</dt>
          <dd>
            <a className={s.detailVal} href={SITE.phoneHref} data-cursor="hover">
              {SITE.phone}
            </a>
          </dd>
        </div>

        <div className={s.detail}>
          <dt className={s.detailKey}>Instagram</dt>
          <dd>
            <a
              className={s.detailVal}
              href={SITE.instagram}
              target="_blank"
              rel="noreferrer noopener"
              data-cursor="hover"
            >
              {SITE.handle}
            </a>
          </dd>
        </div>

        <div className={s.detail}>
          <dt className={s.detailKey}>LinkedIn</dt>
          <dd>
            <a
              className={s.detailVal}
              href={SITE.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              data-cursor="hover"
            >
              Make &amp; Grow
            </a>
          </dd>
        </div>

        <div className={s.detail}>
          <dt className={s.detailKey}>Coimbatore</dt>
          <dd className={s.detailVal}>
            <LiveClock timeZone={SITE.timeZone} withZone />
          </dd>
        </div>
      </dl>
    </section>
  );
}
