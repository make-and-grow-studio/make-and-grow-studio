import { useEffect, useState } from 'react';

const match = (query: string) =>
  typeof window !== 'undefined' && window.matchMedia(query).matches;

function subscribe(query: string, cb: (matches: boolean) => void) {
  const mq = window.matchMedia(query);
  const handler = () => cb(mq.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}

/**
 * Read synchronously on first render. Deferring to an effect would let a
 * reduced-motion visitor see one frame of the full animation before it's
 * disabled — and would mount the custom cursor on touch devices.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => match(query));
  useEffect(() => {
    setMatches(match(query));
    return subscribe(query, setMatches);
  }, [query]);
  return matches;
}

const TOUCH = '(hover: none), (pointer: coarse)';
const REDUCED = '(prefers-reduced-motion: reduce)';

/** Coarse pointer / no hover — phones and tablets. */
export const useIsTouch = () => useMediaQuery(TOUCH);

/** True when the user asked the OS to calm things down. */
export const useReducedMotion = () => useMediaQuery(REDUCED);

/** Read once, outside React — for module-level guards. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
