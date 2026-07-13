type BackCapableRouter = { back: () => void; push: (href: string) => void };

/**
 * Go back in history, or to `fallback` when there is no history to pop.
 *
 * Pages can be opened DIRECTLY — a push-notification tap, a shared link, a
 * fresh PWA window. There, `router.back()` silently does nothing and the
 * back button becomes a dead end. Same behavior as BackButtonHeader's
 * backHref-less mode; use this for ad-hoc back arrows.
 */
export function goBackOr(router: BackCapableRouter, fallback: string) {
  if (typeof window !== "undefined" && window.history.length > 1) {
    router.back();
  } else {
    router.push(fallback);
  }
}
