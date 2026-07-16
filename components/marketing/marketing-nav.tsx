"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { HuzaLogo } from "@/components/brand/huza-logo";
import LanguageSwitcher from "@/components/header/language-switcher";

// Public marketing header. Full-width (the app shell's `usesStandaloneChrome`
// branch in pwa-layout lets /welcome break out of the phone frame). The nav is
// deliberately lean — understand (How it works, Trust), self-identify (workers
// vs employers), convert (Open the app). Secondary pages live in the footer.
const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#workers", label: "For workers" },
  { href: "#employers", label: "For employers" },
  { href: "#trust", label: "Trust & safety" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link href="/welcome" aria-label="Huza home" className="shrink-0">
          <HuzaLogo variant="full" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
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
          <LanguageSwitcher />
          <Link
            href="/"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Open the app
          </Link>
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
            {LINKS.map((l) => (
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
              <LanguageSwitcher />
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full bg-brand px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Open the app
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
