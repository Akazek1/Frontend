import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { HuzaLogo } from "@/components/brand/huza-logo";
import { APP_CONFIG } from "@/constant/app.config";

// Secondary navigation lives here, not in the top nav. Links point at real
// routes where they exist (/privacy, /terms, the app) and to "#" placeholders
// for pages not built yet — wire them up as those pages land.
const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "For workers",
    links: [
      { label: "Find jobs", href: "/" },
      { label: "How it works", href: "#how" },
      { label: "Tips & resources", href: "#" },
    ],
  },
  {
    title: "For employers",
    links: [
      { label: "Hire help", href: "/" },
      { label: "Post a job", href: "/" },
      { label: "Pricing", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Trust & safety", href: "#trust" },
      { label: "Contact", href: `mailto:${APP_CONFIG.contact.email}` },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "#" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
    ],
  },
];

const SOCIAL = [
  { label: "Facebook", href: APP_CONFIG.social.facebook, Icon: Facebook },
  { label: "Instagram", href: APP_CONFIG.social.instagram, Icon: Instagram },
  { label: "Twitter", href: APP_CONFIG.social.twitter, Icon: Twitter },
  { label: "YouTube", href: "#", Icon: Youtube },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-black/5 bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <HuzaLogo variant="full" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
              Building trust. Creating opportunities across Rwanda.
            </p>
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

          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-ink">{col.title}</h3>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
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

        <div className="mt-12 border-t border-black/5 pt-6 text-sm text-ink-subtle">
          © {year} {APP_CONFIG.company.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
