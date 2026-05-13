"use client";

import { usePathname } from "next/navigation";
import { Icons } from "@/components/icons";
import { navItems as defaultNavItems } from "@/constant"; // Keep this immutable
import Link from "next/link";
import { NavItem } from "@/types";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { useViewMode } from "@/context/view-mode-context";
import { colors } from "@/constant/colors";

const Navigation = () => {
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const { viewMode } = useViewMode();

  // Dynamically adjust nav items based on user type
  const navItems: NavItem[] = defaultNavItems.map((item) => {
    if (item.title === "Bookings") {
      return {
        ...item,
        title: viewMode === "provider" ? "Jobs" : "Bookings",
      };
    }

    if (item.title === "Get Hired" && user?.userType?.toLowerCase() === "individual") {
      return {
        ...item,
        title: "Request Service",
        url: "/request-service"
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

  return (
    <nav className="w-full bg-white shadow-md border-t p-2">
      <div className="flex justify-around items-center">
        {navItems?.map((item) => {
          const IconComponent = item.icon ? Icons[item.icon] : null;
          const isActiveNav = isActive(item);

          return (
            <Link
              key={item.title}
              href={item.url}
              className="flex flex-col items-center text-[10px] leading-3 w-20"
              style={{
                color: isActiveNav ? colors.primaryHover : colors.textLight,
                fontWeight: isActiveNav ? "600" : "400",
              }}
            >
              {IconComponent && (
                <IconComponent
                  className="w-6 h-6"
                  style={{
                    stroke: isActiveNav ? "white" : colors.textLight,
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
