"use client";
import { usePathname } from "next/navigation";
import Navigation from "@/components/layout/app-navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const hideNavigationPaths = ["/onboarding", "/auth/login", "/auth/register"];
  const isServiceDetail =
    /^\/service\/[^/]+$/.test(pathname) ||
    /^\/[^/]+\/services\/[^/]+$/.test(pathname);
  const shouldHideNavigation =
    hideNavigationPaths.includes(pathname) ||
    pathname.startsWith("/conversations/inbox") ||
    isServiceDetail;

  return (
    <div className="bg-[#F1FCEF] max-w-[428px] mx-auto relative flex flex-col h-screen overflow-hidden">
      {/* Main content area with scrolling */}
      <main
        className={`flex-1 ${
          shouldHideNavigation
            ? isServiceDetail
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