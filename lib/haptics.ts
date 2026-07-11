// A short vibration on touch interactions (long-press, react, swipe-to-reply).
// Uses the Web Vibration API, which works on Android Chrome but is unsupported
// on iOS Safari/PWAs (Apple blocks web access to the Taptic Engine), where it's
// a harmless no-op.
export function haptic(pattern: number | number[] = 8): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore — best-effort only */
  }
}
