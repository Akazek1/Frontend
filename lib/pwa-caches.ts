// Service-worker Cache Storage names (from @serwist/next's defaultCache) that
// can hold user-specific data: API responses and rendered/streamed pages.
// Static assets (JS/CSS/fonts/images) and the village dataset are NOT listed —
// they contain no user data and re-downloading them would waste bandwidth.
const SENSITIVE_SW_CACHES = [
  "apis",
  "others",
  "cross-origin",
  "next-data",
  "pages",
  "pages-rsc",
  "pages-rsc-prefetch",
];

/**
 * Deletes SW caches that may contain the signed-in user's data. Must run on
 * every session end (explicit logout AND expired-session cleanup): the page
 * caches otherwise keep serving the previous user's bookings/conversations
 * offline for up to 24h on a shared device.
 */
export async function clearSensitiveSwCaches() {
  if (typeof window === "undefined" || !("caches" in window)) return;
  await Promise.all(
    SENSITIVE_SW_CACHES.map((name) => caches.delete(name).catch(() => false)),
  );
}
