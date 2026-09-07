import type { ReactNode } from "react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { publishedByLocale } from "@/content/blog";

// Chrome for the public marketing site. pwa-layout treats /welcome as
// "standalone" (no phone frame, no bottom app-nav), so this layout owns the
// full-width header + footer around every marketing page.
//
// The "Blog" nav/footer link is hidden for a language until that language has a
// published article — a link to "New articles are on the way" reads as broken.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  const blogEnabled = {
    en: publishedByLocale("en").length > 0,
    rw: publishedByLocale("rw").length > 0,
  };
  return (
    <div className="flex min-h-dvh flex-col bg-white text-ink">
      <MarketingNav blogEnabled={blogEnabled} />
      <main className="flex-1">{children}</main>
      <MarketingFooter blogEnabled={blogEnabled} />
    </div>
  );
}
