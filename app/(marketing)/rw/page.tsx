import type { Metadata } from "next";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { marketingRw, marketingUrl } from "@/components/marketing/marketing-content";
import { APP_CONFIG } from "@/constant/app.config";

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

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_CONFIG.name,
    url: `${APP_CONFIG.contact.website}/rw`,
    description: marketingRw.meta.description,
    inLanguage: "rw",
    publisher: {
      "@type": "Organization",
      name: APP_CONFIG.company.name,
      areaServed: "RW",
      email: APP_CONFIG.contact.email,
      telephone: APP_CONFIG.contact.phone,
    },
  };
}

export default function MarketingHomeRw() {
  return <MarketingHome dict={marketingRw} jsonLd={jsonLd()} />;
}
