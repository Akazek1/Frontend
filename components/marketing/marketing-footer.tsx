"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Instagram } from "lucide-react";
import { HuzaLogo } from "@/components/brand/huza-logo";
import { APP_CONFIG } from "@/constant/app.config";
import { marketingDict } from "@/components/marketing/marketing-content";

// lucide-react dropped its brand icons, so WhatsApp is an inline glyph.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a12.062 12.062 0 005.71 1.447h.005c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
    </svg>
  );
}

const SOCIAL = [
  { label: "Facebook", href: APP_CONFIG.social.facebook, Icon: Facebook },
  { label: "Instagram", href: APP_CONFIG.social.instagram, Icon: Instagram },
  { label: "WhatsApp", href: APP_CONFIG.social.whatsapp, Icon: WhatsAppIcon },
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
                  target="_blank"
                  rel="noopener noreferrer me"
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
