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

const Layout = ({ children }: { children: React.ReactNode }) => {
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

  // Continuously remember the current route's scroll offset.
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const save = () => { scrollPositionsRef.current.set(pathname, main.scrollTop); };
    main.addEventListener("scroll", save, { passive: true });
    return () => {
      save();
      main.removeEventListener("scroll", save);
    };
  }, [pathname]);

  // On navigation: restore the saved offset when going back/forward, otherwise
  // start a freshly-pushed route at the top.
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    if (navTypeRef.current === "pop") {
      const saved = scrollPositionsRef.current.get(pathname) ?? 0;
      let attempts = 0;
      const restore = () => {
        if (!mainRef.current) return;
        mainRef.current.scrollTop = saved;
        // Content (e.g. cached lists) may still be growing — retry until it sticks.
        if (Math.abs(mainRef.current.scrollTop - saved) > 2 && attempts < 20) {
          attempts += 1;
          requestAnimationFrame(restore);
        }
      };
      requestAnimationFrame(restore);
    } else {
      main.scrollTop = 0;
    }
    navTypeRef.current = "push";
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

  const usesStandaloneChrome = pathname.startsWith("/agency") || pathname.startsWith("/business");
  const hideNavigationPaths = ["/onboarding", "/auth/login", "/auth/register", "/onboarding/organization", "/logout"];
  const isServiceDetail =
    /^\/service\/[^/]+$/.test(pathname) ||
    /^\/[^/]+\/services\/[^/]+(\/edit)?$/.test(pathname);
  const isJobDetail = /^\/jobs\/[^/]+/.test(pathname);
  const isInquiryDetail = /^\/inquiries\/[^/]+$/.test(pathname);
  const shouldHideNavigation =
    hideNavigationPaths.includes(pathname) ||
    pathname.startsWith("/conversations/inbox") ||
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
            : "overflow-y-auto scrollbar-hide pb-24"
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
