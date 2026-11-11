// Shared between middleware.ts (does the host-rewrite) and app/layout.tsx
// (needs the same check server-side to tell pwa-layout the rewrite happened,
// since usePathname() can't see it). Keep these in one place — the two call
// sites silently drifting would reintroduce the marketing-site-in-phone-shell bug.
export function isMarketingHost(host: string): boolean {
  const normalized = host.toLowerCase().split(":")[0];
  return normalized === "huza.app" || normalized === "www.huza.app";
}

// The public marketing pages (landing pages + blog). `isMarketingHost` covers
// the middleware's "/" -> "/welcome" rewrite, which usePathname() can't see.
export function isMarketingPath(pathname: string, onMarketingHost = false): boolean {
  return (
    (onMarketingHost && pathname === "/") ||
    pathname.startsWith("/welcome") ||
    pathname === "/rw" ||
    pathname.startsWith("/rw/") ||
    pathname === "/blog" ||
    pathname.startsWith("/blog/")
  );
}

// Pages that must be present in the server-sent HTML so search engines and
// AI crawlers (most of which don't run JavaScript) can read them: marketing
// plus the auth-free legal pages. None of them depend on persisted Redux state
// for their first render, so they don't wait for rehydration.
export function isServerRenderedPublicPath(pathname: string, onMarketingHost = false): boolean {
  return (
    isMarketingPath(pathname, onMarketingHost) ||
    pathname === "/terms" ||
    pathname === "/privacy"
  );
}
