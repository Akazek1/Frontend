"use client";

import { usePathname } from "next/navigation";
import { Icons } from "@/components/icons";
import { navItems as defaultNavItems } from "@/constant"; // Keep this immutable
import Link from "next/link";
import { NavItem } from "@/types";
import { useViewMode } from "@/context/view-mode-context";
import { colors } from "@/constant/colors";
import { useAuth } from "@/hooks/useAuth";
import { useAuthGate } from "@/context/auth-gate-context";

const Navigation = () => {
  const pathname = usePathname();
  const { viewMode } = useViewMode();
  const { isAuthenticated } = useAuth();
  const { openAuthGate } = useAuthGate();

  // Dynamically adjust nav items based on view mode
  // - Provider mode: Bookings nav -> "Jobs" (/jobs route)
  // - Employer mode: Bookings nav -> "Bookings" (/bookings route)
  const navItems: NavItem[] = defaultNavItems.map((item) => {
    if (item.title === "Bookings") {
      const isProvider = viewMode === "provider";
      return {
        ...item,
        title: isProvider ? "Jobs" : "Bookings",
        url: isProvider ? "/jobs" : "/bookings",
        matchPattern: isProvider ? "/jobs/*" : "/bookings/*",
      };
    }
    return item;
  });

  const isActive = (item: NavItem): boolean => {
    if (item.matchPattern) {
      const pattern = item.matchPattern.replace("/*", "");
      return pathname.startsWith(pattern);
    }
    return pathname === item.url;
  };

  // Protected routes that require authentication
  const protectedRoutes = ["/bookings", "/jobs", "/conversations", "/more"];

  return (
    <nav className="w-full bg-white shadow-md border-t p-2">
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
              onClick={(e) => { if (isDisabled) { e.preventDefault(); openAuthGate(); } }}
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
                <IconComponent
                  className="w-6 h-6"
                  style={{
                    stroke: isDisabled ? colors.textLight + "66" : (isActiveNav ? "white" : colors.textLight),
                    fill: isActiveNav ? colors.primary : "none",
                  }}
                />
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
