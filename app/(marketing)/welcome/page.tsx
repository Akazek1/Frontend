import type { Metadata } from "next";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { marketingEn } from "@/components/marketing/marketing-content";
import { APP_CONFIG } from "@/constant/app.config";

// English marketing homepage. Served at huza.app/ (middleware rewrites "/" here)
// and directly at /welcome. The Kinyarwanda twin lives at /rw; the two are
// linked with hreflang so Google can surface whichever matches the searcher's
// language — a Kinyarwanda query can land on /rw even though the app's own i18n
// is cookie-based and invisible to crawlers.
export const metadata: Metadata = {
  title: marketingEn.meta.title,
  description: marketingEn.meta.description,
  alternates: {
    canonical: "/welcome",
    languages: {
      en: "/welcome",
      rw: "/rw",
      "x-default": "/welcome",
    },
  },
  openGraph: {
    title: marketingEn.meta.title,
    description: marketingEn.meta.description,
    url: "/welcome",
    locale: "en_RW",
    alternateLocale: ["rw_RW"],
  },
};

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_CONFIG.name,
    url: APP_CONFIG.contact.website,
    description: marketingEn.meta.description,
    inLanguage: ["en", "rw"],
    publisher: {
      "@type": "Organization",
      name: APP_CONFIG.company.name,
      areaServed: "RW",
      email: APP_CONFIG.contact.email,
      telephone: APP_CONFIG.contact.phone,
    },
  };
}

export default function MarketingHomeEn() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
      <MarketingHome dict={marketingEn} />
    </>
  );
}
