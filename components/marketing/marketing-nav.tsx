"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Menu, X } from "lucide-react";
import { HuzaLogo } from "@/components/brand/huza-logo";
import { APP_CONFIG } from "@/constant/app.config";
import { marketingDict } from "@/components/marketing/marketing-content";

// Public marketing header. Full-width (the app shell's `usesStandaloneChrome`
// branch in pwa-layout lets the marketing pages break out of the phone frame).
// Locale-aware: on /rw it renders the Kinyarwanda labels and the language chip
// links to the English page (and vice-versa) — a real navigation between two
// crawlable URLs, not a cookie switch.
export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isRw = pathname === "/rw" || pathname.startsWith("/rw/");
  const dict = marketingDict(isRw ? "rw" : "en");
  const homeHref = isRw ? "/rw" : "/welcome";
  const links = dict.nav.links;

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link href={homeHref} aria-label="Huza home" className="shrink-0">
          <HuzaLogo variant="full" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-brand"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={dict.nav.otherLangHref}
            hrefLang={isRw ? "en" : "rw"}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/70 px-2.5 py-1.5 text-[12px] font-semibold text-ink shadow-sm transition-colors hover:border-brand hover:text-brand"
          >
            <Globe className="h-3.5 w-3.5 text-brand" /> {dict.nav.otherLangLabel}
          </Link>
          <a
            href={APP_CONFIG.appUrl}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            {dict.nav.openApp}
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-black/5 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-base font-medium text-ink transition-colors hover:bg-surface"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-black/5 pt-3">
              <Link
                href={dict.nav.otherLangHref}
                hrefLang={isRw ? "en" : "rw"}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-2 text-[13px] font-semibold text-ink"
              >
                <Globe className="h-4 w-4 text-brand" /> {dict.nav.otherLangLabel}
              </Link>
              <a
                href={APP_CONFIG.appUrl}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full bg-brand px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                {dict.nav.openApp}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
