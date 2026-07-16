import type { ReactNode } from "react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

// Chrome for the public marketing site. pwa-layout treats /welcome as
// "standalone" (no phone frame, no bottom app-nav), so this layout owns the
// full-width header + footer around every marketing page.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-ink">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
