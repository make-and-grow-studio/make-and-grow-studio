import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message } from './script';

type Options = {
  script: Message[];
  /** Nothing plays until this flips true — the thread scrolls into view. */
  active: boolean;
  /** Skip the performance entirely and show the finished thread. */
  instant?: boolean;
  /** Phones get a brisker read; nobody wants to wait on a mockup. */
  fast?: boolean;
};

/**
 * Plays the conversation one message at a time: a typing indicator on the
 * side about to speak, then the bubble. Message length sets the typing
 * time, so a long line genuinely takes longer to "write".
 */
export function useChatSequence({ script, active, instant, fast }: Options) {
  const [shown, setShown] = useState(0);
  const [typingFor, setTypingFor] = useState<number | null>(null);
  const [runId, setRunId] = useState(0);
  const timers = useRef<number[]>([]);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const replay = useCallback(() => {
    clear();
    setShown(0);
    setTypingFor(null);
    setRunId((n) => n + 1);
  }, [clear]);

  useEffect(() => {
    if (!active) return;

    if (instant) {
      setShown(script.length);
      setTypingFor(null);
      return;
    }

    clear();
    const at = (fn: () => void, ms: number) => {
      timers.current.push(window.setTimeout(fn, ms));
    };

    const pace = fast ? 0.62 : 1;
    let t = fast ? 260 : 420;

    script.forEach((msg, i) => {
      // Longer lines take longer to type, within reason.
      const think = Math.min(340 + msg.text.length * 17, 1150) * pace;
      const settle = (msg.attach ? 620 : 430) * pace;

      at(() => setTypingFor(i), t);
      t += think;
      at(() => {
        setTypingFor(null);
        setShown(i + 1);
      }, t);
      t += settle;
    });

    return clear;
  }, [active, instant, fast, script, clear, runId]);

  return { shown, typingFor, done: shown >= script.length, replay };
}
