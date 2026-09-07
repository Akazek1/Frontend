import type { Metadata } from "next";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { marketingEn, marketingUrl } from "@/components/marketing/marketing-content";
import { marketingJsonLd } from "@/lib/marketing-jsonld";

// English marketing homepage. Served at huza.app/ (middleware rewrites "/" here)
// and directly at /welcome. The Kinyarwanda twin lives at /rw; the two are
// linked with hreflang so Google can surface whichever matches the searcher's
// language — a Kinyarwanda query can land on /rw even though the app's own i18n
// is cookie-based and invisible to crawlers.
export const metadata: Metadata = {
  title: marketingEn.meta.title,
  description: marketingEn.meta.description,
  alternates: {
    canonical: marketingUrl("/welcome"),
    languages: {
      en: marketingUrl("/welcome"),
      rw: marketingUrl("/rw"),
      "x-default": marketingUrl("/welcome"),
    },
  },
  openGraph: {
    title: marketingEn.meta.title,
    description: marketingEn.meta.description,
    url: marketingUrl("/welcome"),
    locale: "en_RW",
    alternateLocale: ["rw_RW"],
  },
};

export default function MarketingHomeEn() {
  const jsonLd = marketingJsonLd("en", marketingUrl("/welcome"), marketingEn.meta.description);
  return <MarketingHome dict={marketingEn} jsonLd={jsonLd} />;
}
