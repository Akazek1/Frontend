"use client";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Navigation from "@/components/layout/app-navigation";
import { EnablePushCard } from "@/components/pwa/enable-push-card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";

// Routes that should return the user to where they left off even on a forward
// (push / tab / link) navigation — not just on browser back/forward. These are
// the "feed" tabs where re-entering to the top and losing your place is jarring
// (e.g. the home marketplace feed). Every other route still starts at the top
// on a fresh push. Keep these to entries the user re-enters as a standing tab.
const RESTORE_ON_RETURN_ROUTES = new Set<string>(["/"]);

// sessionStorage key for scroll offsets, so a reload (or a SW-update reload)
// doesn't drop the remembered positions. Session-scoped: cleared when the tab
// closes, never shared across tabs or persisted to disk.
const SCROLL_POSITIONS_KEY = "huza:scroll-positions";

const Layout = ({
  children,
  isMarketingHost = false,
}: {
  children: React.ReactNode;
  // True when the request came in on huza.app / www.huza.app. The middleware
  // rewrites "/" to "/welcome" on those hosts, but that rewrite is invisible
  // to the client — usePathname() still reports "/", so pathname alone can't
  // tell this apart from the real app's home page on app.huza.app. Passed
  // down from the server so it's correct on first render, no client-only
  // hostname check that would flash the phone-shell before correcting itself.
  isMarketingHost?: boolean;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const mainRef = useRef<HTMLElement | null>(null);
  const [isNavigationHidden, setIsNavigationHidden] = useState(false);
  // Scroll-restoration state: the app scrolls inside this persistent <main>, not
  // the window, so the browser can't restore scroll for us. We remember each
  // route's scroll offset and replay it on back/forward navigation.
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  const navTypeRef = useRef<"push" | "pop">("push");
  usePushNotifications();
  useSocketConnection();

  // Browser back/forward fires popstate; Link clicks / router.push do not.
  useEffect(() => {
    const onPopState = () => { navTypeRef.current = "pop"; };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Hydrate remembered offsets once, so a reload keeps them (see restore below).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SCROLL_POSITIONS_KEY);
      if (raw) {
        const entries = JSON.parse(raw) as [string, number][];
        scrollPositionsRef.current = new Map(entries);
      }
    } catch {
      // Corrupt/oversized storage — start fresh, never block render.
    }
  }, []);

  // Keep the live pathname in a ref so the mount-once snapshot listener below
  // always attributes a saved offset to the route that is currently on screen.
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Snapshot the current route's scroll offset the instant *before* a navigation
  // starts. Reacting to the `scroll` event instead is unreliable: leaving a
  // route unmounts its tall content, <main> shrinks, and the browser clamps
  // scrollTop to 0 — a synthetic scroll that overwrites the very position we
  // want to keep. A capture-phase click fires before React's own handlers (so
  // before both <Link> navigation and onClick `router.push` card taps) and
  // before any DOM change, so scrollTop is still the real value here. `pagehide`
  // covers reloads / tab close.
  useEffect(() => {
    const snapshot = () => {
      const main = mainRef.current;
      if (!main) return;
      scrollPositionsRef.current.set(pathnameRef.current, main.scrollTop);
      try {
        sessionStorage.setItem(
          SCROLL_POSITIONS_KEY,
          JSON.stringify([...scrollPositionsRef.current.entries()]),
        );
      } catch {
        // Storage full/unavailable — the in-memory Map still works this session.
      }
    };
    document.addEventListener("click", snapshot, { capture: true });
    window.addEventListener("pagehide", snapshot);
    return () => {
      document.removeEventListener("click", snapshot, { capture: true });
      window.removeEventListener("pagehide", snapshot);
    };
  }, []);

  // "Tap the active tab again to scroll to top" — the bottom nav dispatches this
  // when you re-tap the tab you're already on. Smooth-scroll <main> up and reset
  // the route's saved offset so a later return doesn't jump back down. (The
  // capture-phase snapshot above already recorded the pre-tap offset for this
  // same click, so overwrite it here — this runs synchronously afterwards.)
  useEffect(() => {
    const scrollToTop = () => {
      const main = mainRef.current;
      if (!main) return;
      main.scrollTo({ top: 0, behavior: "smooth" });
      scrollPositionsRef.current.set(pathnameRef.current, 0);
      try {
        sessionStorage.setItem(
          SCROLL_POSITIONS_KEY,
          JSON.stringify([...scrollPositionsRef.current.entries()]),
        );
      } catch {
        // Storage unavailable — the in-memory Map still reflects the reset.
      }
    };
    window.addEventListener("huza:scroll-to-top", scrollToTop);
    return () => window.removeEventListener("huza:scroll-to-top", scrollToTop);
  }, []);

  // On navigation: restore the saved offset when going back/forward, and also
  // when returning to a "feed" tab via a forward push (RESTORE_ON_RETURN_ROUTES)
  // so re-entering Home lands where you left off. Every other fresh push starts
  // at the top.
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const shouldRestore =
      navTypeRef.current === "pop" || RESTORE_ON_RETURN_ROUTES.has(pathname);
    const saved = shouldRestore ? scrollPositionsRef.current.get(pathname) ?? 0 : 0;
    navTypeRef.current = "push";

    // The effect runs after the new route has committed to the DOM, so a
    // returned-to feed with cached cards is usually already tall enough here —
    // apply the offset synchronously first.
    main.scrollTop = saved;
    if (saved <= 0 || Math.abs(main.scrollTop - saved) <= 2) return;

    // Otherwise the content is still painting (data/image reflow). Re-apply on a
    // short timer (not rAF — rAF is paused while the tab is backgrounded) until
    // <main> is tall enough for the offset to stick, then stop. Time-budgeted so
    // it never fights a genuinely shorter page.
    const deadline = Date.now() + 2000;
    let stopped = false;
    const retry = () => {
      if (stopped || !mainRef.current) return;
      mainRef.current.scrollTop = saved;
      if (Math.abs(mainRef.current.scrollTop - saved) > 2 && Date.now() < deadline) {
        setTimeout(retry, 50);
      }
    };
    setTimeout(retry, 50);

    return () => {
      stopped = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const notificationId = searchParams.get("notificationId");
    if (!isAuthenticated || !notificationId) return;

    api.patch(`/users/notifications/${notificationId}/read`).catch(() => {});

    const params = new URLSearchParams(searchParams.toString());
    params.delete("notificationId");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [isAuthenticated, pathname, router]);

  // Full-width surfaces that break out of the phone-width app shell and the
  // bottom nav: the agency console, the business auth screens, and the public
  // marketing site (/welcome) which has its own header + footer.
  const usesStandaloneChrome =
    pathname.startsWith("/agency") ||
    pathname.startsWith("/business") ||
    pathname.startsWith("/welcome") ||
    (isMarketingHost && pathname === "/");
  const hideNavigationPaths = ["/onboarding", "/auth/login", "/auth/register", "/onboarding/organization", "/logout"];
  const isServiceDetail =
    /^\/service\/[^/]+$/.test(pathname) ||
    /^\/[^/]+\/services\/[^/]+(\/edit)?$/.test(pathname);
  const isJobDetail = /^\/jobs\/[^/]+/.test(pathname);
  const isInquiryDetail = /^\/inquiries\/[^/]+$/.test(pathname);
  const shouldHideNavigation =
    hideNavigationPaths.includes(pathname) ||
    // Every chat room is full-bleed: booking rooms (/conversations/inbox) and
    // unified rooms (/conversations/thread) alike.
    pathname.startsWith("/conversations/inbox") ||
    pathname.startsWith("/conversations/thread") ||
    isServiceDetail ||
    isInquiryDetail ||
    (isJobDetail && !isAuthenticated);

  useEffect(() => {
    setIsNavigationHidden(false);
  }, [pathname]);

  useEffect(() => {
    const main = mainRef.current;
    if (!main || shouldHideNavigation || usesStandaloneChrome) {
      setIsNavigationHidden(false);
      return;
    }

    let lastScrollTop = main.scrollTop;

    const handleScroll = () => {
      const nextScrollTop = main.scrollTop;
      const delta = nextScrollTop - lastScrollTop;

      if (Math.abs(delta) < 6) return;

      const atBottom = main.scrollHeight - (nextScrollTop + main.clientHeight) < 24;
      if (atBottom) {
        setIsNavigationHidden(false);
        lastScrollTop = nextScrollTop;
        return;
      }

      const stickySearch = main.querySelector("[data-home-sticky-search]") as HTMLElement | null;
      const stickyCategories = main.querySelector("[data-home-sticky-categories]") as HTMLElement | null;
      const hideStart = stickyCategories
        ? stickyCategories.offsetTop
        : stickySearch
          ? stickySearch.offsetTop
          : 40;

      if (nextScrollTop < hideStart + 4) {
        setIsNavigationHidden(false);
      } else {
        setIsNavigationHidden(delta > 0);
      }

      lastScrollTop = nextScrollTop;
    };

    main.addEventListener("scroll", handleScroll, { passive: true });
    return () => main.removeEventListener("scroll", handleScroll);
  }, [pathname, shouldHideNavigation, usesStandaloneChrome]);

  // The agency console (Tier 2) and the business auth screens are full-width,
  // responsive surfaces with their own chrome. They break out of the phone
  // container that wraps the consumer (worker/employer) app.
  if (usesStandaloneChrome) {
    return <>{children}</>;
  }

  return (
    <div className="bg-surface max-w-[428px] mx-auto relative flex flex-col h-dvh overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Main content area with scrolling */}
      <main
        ref={mainRef}
        className={`flex-1 overflow-x-hidden ${
          shouldHideNavigation
            ? (isServiceDetail || isJobDetail)
              ? "overflow-y-auto scrollbar-hide"
              : "overflow-hidden"
            : "overflow-y-auto scrollbar-hide pb-[calc(6rem+env(safe-area-inset-bottom))]"
        }`}
      >
        {children}
      </main>

      <EnablePushCard />

      {/* Fixed Navigation */}
      {!shouldHideNavigation && (
        <nav
          className={`fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-[428px] border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-lg transition-transform duration-300 ease-out ${
            isNavigationHidden ? "translate-y-full" : "translate-y-0"
          }`}
        >
          <Navigation />
        </nav>
      )}
    </div>
  );
};

export default Layout;
