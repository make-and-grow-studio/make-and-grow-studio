import { useSyncExternalStore } from 'react';

/**
 * One flag, shared outside React: has the preloader handed the page over?
 * Hero-level entrance animations gate on this so they don't play out of
 * sight behind the ink screen.
 */
let ready = false;
const subscribers = new Set<() => void>();

export const isIntroReady = () => ready;

export function completeIntro() {
  if (ready) return;
  ready = true;
  subscribers.forEach((fn) => fn());
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

/**
 * Imperative flavour for GSAP-land: fires straight away if the intro is
 * already done, so a component mounting late still gets its entrance.
 * Returns an unsubscribe.
 */
export function onIntroReady(cb: () => void) {
  if (ready) {
    cb();
    return () => {};
  }
  return subscribe(cb);
}

export function useIntroReady() {
  return useSyncExternalStore(subscribe, isIntroReady, () => true);
}
