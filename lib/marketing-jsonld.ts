import { APP_CONFIG } from "@/constant/app.config";
import { MARKETING_ORIGIN, type MarketingLocale } from "@/components/marketing/marketing-content";

// Shared schema.org graph for the marketing pages (/welcome, /rw). Emitted as a
// single <script type="application/ld+json"> per page (see marketing-home.tsx).
//
// Why a @graph with @ids instead of the old standalone WebSite node: it lets the
// WebSite, the browse ItemList and every future blog Article all point at ONE
// Organization node (`#organization`) by reference. That single, consistent
// entity is what search engines and LLMs use to tell "Huza App" (this domestic
// services marketplace) apart from the unrelated "Huza" brands in Rwanda.

const ORG_ID = `${MARKETING_ORIGIN}/#organization`;

// The provider-facing service categories, in the order they lead the copy.
// Kept here (not in the taxonomy API) because this is a fixed marketing list —
// the crawlable "what Huza does" signal, not the live catalogue.
export const MARKETING_SERVICE_TYPES = [
  "House Cleaning",
  "Nannies & Childcare",
  "Private Chefs & Cooks",
  "Home Tutors",
  "Personal Drivers",
  "Beauty & Makeup Artists",
] as const;

function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: APP_CONFIG.seoName,
    legalName: APP_CONFIG.company.legalName,
    url: MARKETING_ORIGIN,
    logo: `${MARKETING_ORIGIN}/apple-icon.png`,
    foundingDate: APP_CONFIG.company.foundingDate,
    email: APP_CONFIG.contact.email,
    telephone: APP_CONFIG.contact.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kigali",
      addressCountry: "RW",
    },
    areaServed: { "@type": "Country", name: "Rwanda" },
    // taxID (RRA TIN 156660502) intentionally omitted from public structured
    // data — add here if product decides to expose it.
    sameAs: [
      APP_CONFIG.social.facebook,
      APP_CONFIG.social.instagram,
      APP_CONFIG.social.whatsapp,
    ],
  };
}

function websiteNode(locale: MarketingLocale, pageUrl: string, description: string) {
  return {
    "@type": "WebSite",
    "@id": `${pageUrl}#website`,
    url: pageUrl,
    name: APP_CONFIG.seoName,
    description,
    inLanguage: locale === "rw" ? "rw" : ["en", "rw"],
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${APP_CONFIG.appUrl}/service?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

function servicesNode() {
  return {
    "@type": "Service",
    "@id": `${MARKETING_ORIGIN}/#services`,
    name: "On-demand home & domestic services",
    serviceType: [...MARKETING_SERVICE_TYPES],
    provider: { "@id": ORG_ID },
    areaServed: [
      { "@type": "City", name: "Kigali" },
      { "@type": "Country", name: "Rwanda" },
    ],
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: APP_CONFIG.appUrl,
    },
  };
}

/**
 * schema.org graph for a single blog article: BlogPosting + BreadcrumbList,
 * both tied to the shared Organization/#organization entity.
 */
export function blogPostJsonLd(input: {
  slug: string;
  title: string;
  description: string;
  locale: "en" | "rw";
  publishedAt: string;
  updatedAt?: string;
}) {
  const url = `${MARKETING_ORIGIN}/blog/${input.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: input.title,
        description: input.description,
        inLanguage: input.locale,
        datePublished: input.publishedAt,
        dateModified: input.updatedAt ?? input.publishedAt,
        url,
        mainEntityOfPage: url,
        author: { "@id": ORG_ID },
        publisher: { "@id": ORG_ID },
        isPartOf: { "@id": `${MARKETING_ORIGIN}/welcome#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: APP_CONFIG.seoName, item: MARKETING_ORIGIN },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${MARKETING_ORIGIN}/blog` },
          { "@type": "ListItem", position: 3, name: input.title, item: url },
        ],
      },
      organizationNode(),
    ],
  };
}

/**
 * Build the schema.org @graph for a marketing page.
 * @param locale  "en" | "rw"
 * @param pageUrl absolute canonical URL of the page (from marketingUrl())
 * @param description page meta description (localised)
 */
export function marketingJsonLd(
  locale: MarketingLocale,
  pageUrl: string,
  description: string,
) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(),
      websiteNode(locale, pageUrl, description),
      servicesNode(),
    ],
  };
}
