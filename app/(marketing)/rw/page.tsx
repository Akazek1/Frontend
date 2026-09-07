import type { Metadata } from "next";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { marketingRw, marketingUrl } from "@/components/marketing/marketing-content";
import { marketingJsonLd } from "@/lib/marketing-jsonld";

// Kinyarwanda marketing homepage — a real, crawlable URL (not a cookie/locale
// swap) so a Kinyarwanda Google query can rank and land here. Linked back to the
// English page at /welcome via hreflang.
export const metadata: Metadata = {
  title: marketingRw.meta.title,
  description: marketingRw.meta.description,
  alternates: {
    canonical: marketingUrl("/rw"),
    languages: {
      en: marketingUrl("/welcome"),
      rw: marketingUrl("/rw"),
      "x-default": marketingUrl("/welcome"),
    },
  },
  openGraph: {
    title: marketingRw.meta.title,
    description: marketingRw.meta.description,
    url: marketingUrl("/rw"),
    locale: "rw_RW",
    alternateLocale: ["en_RW"],
  },
};

export default function MarketingHomeRw() {
  const jsonLd = marketingJsonLd("rw", marketingUrl("/rw"), marketingRw.meta.description);
  return <MarketingHome dict={marketingRw} jsonLd={jsonLd} />;
}
