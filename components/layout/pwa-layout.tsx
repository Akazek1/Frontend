"use client";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Navigation from "@/components/layout/app-navigation";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useEffect } from "react";
import api from "@/lib/axios";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  usePushNotifications();
  useSocketConnection();

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

  const hideNavigationPaths = ["/onboarding", "/auth/login", "/auth/register", "/onboarding/organization", "/logout"];
  const isServiceDetail =
    /^\/service\/[^/]+$/.test(pathname) ||
    /^\/[^/]+\/services\/[^/]+$/.test(pathname);
  const isJobDetail = /^\/jobs\/[^/]+/.test(pathname);
  const shouldHideNavigation =
    hideNavigationPaths.includes(pathname) ||
    pathname.startsWith("/conversations/inbox") ||
    isServiceDetail ||
    (isJobDetail && !isAuthenticated);

  return (
    <div className="bg-[#F1FCEF] max-w-[428px] mx-auto relative flex flex-col h-screen overflow-hidden">
      {/* Main content area with scrolling */}
      <main
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

      {/* Fixed Navigation */}
      {!shouldHideNavigation && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto w-full bg-white shadow-lg z-50 border-t border-gray-200">
          <Navigation />
        </nav>
      )}
    </div>
  );
};

export default Layout;
