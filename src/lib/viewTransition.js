import { flushSync } from 'react-dom';

const canTransition = () =>
  typeof document !== 'undefined' && typeof document.startViewTransition === 'function';

const prefersReducedMotion = () => {
  if (typeof document === 'undefined') return false;
  const setting = document.documentElement.dataset.reduceMotion === 'true';
  const media =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return setting || !!media;
};

/**
 * Run a route update inside a View Transition when the browser supports it.
 * Falls back to a normal synchronous update. The `direction` is published as
 * a data attribute so CSS can distinguish entering/leaving a console route.
 */
export function withViewTransition(update, direction = 'console-in') {
  if (!canTransition() || prefersReducedMotion()) {
    update();
    return;
  }

  const root = document.documentElement;
  root.dataset.viewTransition = direction;
  let updated = false;

  const run = () => {
    if (updated) return;
    updated = true;
    flushSync(update);
  };

  try {
    const transition = document.startViewTransition(run);
    transition.finished.finally(() => {
      delete root.dataset.viewTransition;
    });
  } catch {
    delete root.dataset.viewTransition;
    run();
  }
}
