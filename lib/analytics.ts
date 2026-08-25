// Thin wrapper around Umami's global tracker. Safe to call anywhere: it no-ops
// on the server, in dev (script not loaded), or before the script is ready — so
// callers never need to guard. See components/analytics/umami.tsx.
type TrackProps = Record<string, string | number | boolean>;

export function track(event: string, data?: TrackProps) {
  if (typeof window === "undefined") return;
  const umami = (window as unknown as { umami?: { track?: (e: string, d?: TrackProps) => void } }).umami;
  if (!umami?.track) return;
  try {
    umami.track(event, data);
  } catch {
    // Analytics must never break a user flow.
  }
}
