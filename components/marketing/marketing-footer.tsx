"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { HuzaLogo } from "@/components/brand/huza-logo";
import { APP_CONFIG } from "@/constant/app.config";
import { marketingDict } from "@/components/marketing/marketing-content";

const SOCIAL = [
  { label: "Facebook", href: APP_CONFIG.social.facebook, Icon: Facebook },
  { label: "Instagram", href: APP_CONFIG.social.instagram, Icon: Instagram },
  { label: "Twitter", href: APP_CONFIG.social.twitter, Icon: Twitter },
  { label: "YouTube", href: "#", Icon: Youtube },
];

// Secondary navigation. Column copy + links come from the locale dict; the
// special href "APP" resolves to the real app URL (marketing runs on a
// different host than the app).
export function MarketingFooter() {
  const pathname = usePathname();
  const isRw = pathname === "/rw" || pathname.startsWith("/rw/");
  const dict = marketingDict(isRw ? "rw" : "en");
  const year = new Date().getFullYear();

  const resolve = (href: string) => (href === "APP" ? APP_CONFIG.appUrl : href);

  return (
    <footer className="border-t border-black/5 bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <HuzaLogo variant="full" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">{dict.footer.tagline}</p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-ink-muted transition-colors hover:border-brand hover:text-brand"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {dict.footer.columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-ink">{col.title}</h3>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={resolve(l.href)}
                      className="text-sm text-ink-muted transition-colors hover:text-brand"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-6 text-sm text-ink-subtle">
          <span>
            © {year} {APP_CONFIG.company.name}. {dict.footer.rights}
          </span>
          <Link
            href={dict.nav.otherLangHref}
            hrefLang={isRw ? "en" : "rw"}
            className="font-medium text-ink-muted transition-colors hover:text-brand"
          >
            {dict.nav.otherLangLabel}
          </Link>
        </div>
      </div>
    </footer>
  );
}
