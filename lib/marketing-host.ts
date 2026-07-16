// Shared between middleware.ts (does the host-rewrite) and app/layout.tsx
// (needs the same check server-side to tell pwa-layout the rewrite happened,
// since usePathname() can't see it). Keep these in one place — the two call
// sites silently drifting would reintroduce the marketing-site-in-phone-shell bug.
export function isMarketingHost(host: string): boolean {
  const normalized = host.toLowerCase().split(":")[0];
  return normalized === "huza.app" || normalized === "www.huza.app";
}
