"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/icons";
import { navItems as getNavItems } from "@/constant";
import Link from "next/link";
import { NavItem } from "@/types";
import { colors } from "@/constant/colors";
import { useAuth } from "@/hooks/useAuth";
import { useAuthGate } from "@/context/auth-gate-context";
import { useUnreadMessagesBadge } from "@/hooks/useUnreadMessagesBadge";

const Navigation = () => {
  const t = useTranslations("appNavigation");
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { openAuthGate } = useAuthGate();
  const navItems = getNavItems(t);
  const unreadMessages = useUnreadMessagesBadge();

  const isActive = (item: NavItem): boolean => {
    if (item.matchPattern) {
      const pattern = item.matchPattern.replace("/*", "");
      return pathname.startsWith(pattern);
    }
    return pathname === item.url;
  };

  // Protected routes that require authentication
  const protectedRoutes = ["/work", "/conversations", "/more"];

  return (
    <nav className="w-full bg-white p-2">
      <div className="flex justify-around items-center">
        {navItems?.map((item) => {
          const IconComponent = item.icon ? Icons[item.icon] : null;
          const isActiveNav = isActive(item);
          const isProtected = protectedRoutes.includes(item.url);
          const isDisabled = !isAuthenticated && isProtected;

          return (
            <Link
              key={item.title}
              href={isDisabled ? "#" : item.url}
              // The app owns scroll restoration for its custom <main> scroller
              // (see pwa-layout). Next's default scroll-to-top would fire after
              // our restore and yank a returned-to feed back to the top.
              scroll={false}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault();
                  openAuthGate();
                  return;
                }
                // Re-tapping the tab you're already on (its root, not a
                // sub-route) scrolls that tab's content back to the top —
                // pwa-layout owns <main> and the saved offsets, so hand off
                // to it rather than navigating redundantly.
                if (pathname === item.url) {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("huza:scroll-to-top"));
                }
              }}
              className="flex flex-col items-center text-[10px] leading-3 w-20"
              style={{
                color: isDisabled ? colors.textLight + "66" : (isActiveNav ? colors.primaryHover : colors.textLight),
                fontWeight: isActiveNav ? "600" : "400",
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
              }}
              aria-disabled={isDisabled}
            >
              {IconComponent && (
                <span className="relative">
                  <IconComponent
                    className="w-6 h-6"
                    style={{
                      stroke: isDisabled ? colors.textLight + "66" : (isActiveNav ? "white" : colors.textLight),
                      fill: isActiveNav ? colors.primary : "none",
                    }}
                  />
                  {/* New messages since Messages was last opened. */}
                  {item.url === "/conversations" && unreadMessages > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </span>
                  )}
                </span>
              )}
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
