"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu, User, X } from "lucide-react";
import { AgencyNotificationBell } from "@/components/agency/agency-notification-bell";
import { AGENCY_NAV, type AgencyNavItem } from "@/constant/agency-nav";
import { useAgency } from "@/context/agency-context";
import { cn } from "@/lib/utils";
import { HuzaLogo } from "@/components/brand/huza-logo";

function badgeCount(item: AgencyNavItem, counts: Record<string, number>): number {
  if (!item.badgeKey) return 0;
  return counts[item.badgeKey] ?? 0;
}

function NavLinks({
  counts,
  onNavigate,
}: {
  counts: Record<string, number>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (item: AgencyNavItem) => {
    if (item.url === "/agency") return pathname === "/agency";
    return item.matchPrefix ? pathname.startsWith(item.url) : pathname === item.url;
  };

  return (
    <nav className="flex flex-col gap-1 px-3">
      {AGENCY_NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        const count = badgeCount(item, counts);
        return (
          <Link
            key={item.url}
            href={item.url}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
              active
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1 truncate">{item.title}</span>
            {count > 0 && (
              <span
                className={cn(
                  "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                  item.badgeKey === "openIssues"
                    ? "bg-red-500 text-white"
                    : "bg-[#FB9400] text-white",
                )}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  counts,
  onNavigate,
}: {
  counts: Record<string, number>;
  onNavigate?: () => void;
}) {
  const { org } = useAgency();
  const [menuOpen, setMenuOpen] = useState(false);
  const orgName = org?.name ?? "Staffing Agency";
  const initials = orgName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0E3F0B] to-[#06250B] text-white">
      {/* Brand + org switcher */}
      <div className="px-5 pb-4 pt-6">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
            {org?.logoUrl ? (
              <Image src={org.logoUrl} alt={orgName} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="text-[15px] font-black">A</span>
            )}
          </div>
          <HuzaLogo tone="light" markClassName="h-7 w-7" wordClassName="text-[20px]" />
        </div>
        <button className="mt-4 flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/10">
          <span className="truncate text-[13px] font-semibold text-white/90">{orgName}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/60" />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        <NavLinks counts={counts} onNavigate={onNavigate} />
      </div>

      {/* User footer + account menu */}
      <div className="relative border-t border-white/10 px-4 py-4">
        {menuOpen && (
          <div className="absolute inset-x-3 bottom-[76px] z-10 overflow-hidden rounded-xl border border-white/10 bg-[#0B3208] shadow-lg">
            <Link
              href="/agency/profile"
              onClick={() => { setMenuOpen(false); onNavigate?.(); }}
              className="flex items-center gap-2.5 px-3.5 py-3 text-[13px] font-medium text-white/90 hover:bg-white/10"
            >
              <User className="h-4 w-4" /> Agency Profile
            </Link>
            <Link
              href="/logout"
              onClick={() => { setMenuOpen(false); onNavigate?.(); }}
              className="flex items-center gap-2.5 border-t border-white/10 px-3.5 py-3 text-[13px] font-medium text-red-300 hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> Log out
            </Link>
          </div>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-white/10"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-[13px] font-bold">
            {initials || "KS"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{orgName}</p>
            <p className="text-[11px] text-white/60">Agency Admin</p>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-white/50 transition-transform", menuOpen && "rotate-180")} />
        </button>
      </div>
    </div>
  );
}

export function AgencyShell({ children }: { children: React.ReactNode }) {
  const { stats, unreadMessages } = useAgency();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const counts: Record<string, number> = {
    pendingRequests: stats?.pendingRequests ?? 0,
    openIssues: stats?.openIssues ?? 0,
    unreadMessages,
  };

  return (
    <div className="min-h-dvh bg-[#F4F7F3]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent counts={counts} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-[78%] max-w-[300px]">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute -right-12 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent counts={counts} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Content column */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur lg:h-16 lg:px-8">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <HuzaLogo markClassName="h-6 w-6" wordClassName="text-[16px]" className="lg:hidden" />
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <AgencyNotificationBell />
            <Link href="/agency/profile" className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white">
              KS
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] px-4 py-5 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
