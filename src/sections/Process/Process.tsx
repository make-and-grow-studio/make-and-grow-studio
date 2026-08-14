import { Fragment, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import RevealText from '../../components/RevealText';
import { useIsTouch, useMediaQuery, useReducedMotion } from '../../lib/env';
import { SCRIPT, STEPS, type Message } from './script';
import { useChatSequence } from './useChatSequence';
import s from './Process.module.css';

const WHO: Record<Message['from'], string> = {
  you: 'You',
  mg: 'Make & Grow',
};

/* Everything arrives from the same edge — it's one thread, not two sides. */
const bubbleIn = () => ({
  initial: { opacity: 0, y: 12, x: -6 },
  animate: { opacity: 1, y: 0, x: 0 },
  transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const },
});

export default function Process() {
  const threadRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const isTouch = useIsTouch();
  const isPhone = useMediaQuery('(max-width: 699px)');

  // Fires once, a little before the panel is centred.
  const inView = useInView(threadRef, { once: true, amount: 0.35 });

  const { shown, typingFor, done, replay } = useChatSequence({
    script: SCRIPT,
    active: inView,
    instant: reduced,
    fast: isPhone || isTouch,
  });

  const visible = SCRIPT.slice(0, shown);
  const activeStep = SCRIPT[Math.min(shown, SCRIPT.length - 1)].step;

  return (
    <section className={s.root} id="process" aria-labelledby="process-title">
      <div className={`${s.head} label`}>
        <span className={s.headTag}>Process</span>
        <span aria-hidden="true">/</span>
        <span>Start to shipped</span>
      </div>

      <RevealText as="h2" id="process-title" className={s.title}>
        You’ll never chase us for an update.
      </RevealText>
      <p className={s.sub}>
        Everything happens in one thread. Here’s a real one.
      </p>

      <div className={s.body}>
        {/* Rail lights up as the conversation reaches each stage. */}
        <ol className={s.steps}>
          {STEPS.map((step, i) => {
            const n = i + 1;
            const state = n < activeStep ? 'done' : n === activeStep ? 'active' : 'idle';
            return (
              <li className={`${s.step} label`} key={step.n} data-state={state}>
                <span className={s.stepN}>{step.n}</span>
                <span className={s.stepLabel}>{step.label}</span>
                <span className={s.stepBar} aria-hidden="true" />
              </li>
            );
          })}
        </ol>

        <div>
          <div className={s.panel}>
            <div className={s.panelHead}>
              <span className={s.chrome} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className={`${s.channel} label`}>
                Make &amp; Grow{' '}
                <span className={s.channelMuted}>· project thread</span>
              </span>
              <span className={`${s.live} label`}>
                <span className={`${s.liveDot} am-ping`} aria-hidden="true" />
                Live
              </span>
            </div>

            {/* Column is bottom-anchored, so arrivals push history off the
                top and the mask dissolves it — no scroll maths, and no
                nested scroller for Lenis to fight. */}
            <div
              className={s.thread}
              ref={threadRef}
              role="log"
              aria-live="polite"
              aria-label="How a project goes, start to finish"
            >
              {visible.map((m, i) => {
                const startsStep = i === 0 || visible[i - 1].step !== m.step;
                const step = STEPS[m.step - 1];

                return (
                  <Fragment key={i}>
                    {startsStep && (
                      <motion.p
                        className={`${s.divider} label`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        {step.n} · {step.label}
                        <span className={s.dividerRule} aria-hidden="true" />
                      </motion.p>
                    )}

                    <motion.div
                      className={s.row}
                      data-from={m.from}
                      {...(reduced ? {} : bubbleIn())}
                    >
                      <span className={s.avatar} aria-hidden="true">
                        {m.from === 'you' ? 'Y' : 'M'}
                      </span>

                      <div className={s.bubble}>
                        <span className={s.who}>
                          <span className={s.whoName}>{WHO[m.from]}</span>
                          <span className={s.whoAt}>{m.at}</span>
                        </span>
                        {m.text}
                        {m.attach && (
                          <span className={s.attach}>
                            <span className={s.attachIcon} aria-hidden="true" />
                            <span className={s.attachName}>{m.attach.name}</span>
                          </span>
                        )}
                        {m.react && (
                          <span className={s.react}>
                            <span aria-hidden="true">{m.react.emoji}</span>
                            {m.react.count}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </Fragment>
                );
              })}

              {/* No exit animation: the indicator and the message it becomes
                  are swapped in one batched update, so an animated exit would
                  hold its space open and bounce the bottom-anchored stack. */}
              {typingFor !== null && (
                <motion.div
                  className={s.row}
                  data-from={SCRIPT[typingFor].from}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <span className={s.avatar} aria-hidden="true">
                    {SCRIPT[typingFor].from === 'you' ? 'Y' : 'M'}
                  </span>
                    <span className={s.typing} aria-label="Typing">
                      {[0, 1, 2].map((d) => (
                        <motion.i
                          className={s.typingDot}
                          key={d}
                          animate={reduced ? {} : { y: [0, -4, 0], opacity: [0.45, 1, 0.45] }}
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            delay: d * 0.14,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </span>
                </motion.div>
              )}
            </div>

            <div className={`${s.composer} label`}>
              <span className={s.composerField}>
                Message the studio
                {!reduced && <span className={s.caret} aria-hidden="true" />}
              </span>
              <span className={s.send} aria-hidden="true">
                ↑
              </span>
            </div>
          </div>

          <button
            type="button"
            className={`${s.replay} label`}
            data-done={done}
            onClick={replay}
            data-cursor="hover"
          >
            ↺ Replay
          </button>
        </div>
      </div>
    </section>
  );
}
