import { Suspense } from "react";
import type { Service } from "@/types";
import { APP_CONFIG } from "@/constant/app.config";
import {
  getServiceDisplayName,
  getProviderName,
  getServiceDetailPath,
  getServiceCardImage,
} from "@/lib/service-display";
import { MARKETING_SERVICE_TYPES } from "@/lib/marketing-jsonld";
import { ServiceBrowseClient } from "./service-browse-client";

// The browse page is a client component (filters, infinite scroll, guest wall).
// This server wrapper adds what a crawler needs and the client can't emit:
// a server-rendered first page of listings as schema.org data, so "home
// services app Rwanda" / "hire a cleaner Kigali" have real structured content
// to rank. The visible card list is still owned by the client body (page 1 is
// public — same data, just hydrated there). SSR-ing the visible cards too is a
// later step; it has to be done without regressing the guest wall.

async function fetchFirstPage(): Promise<Service[]> {
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
    const res = await fetch(`${baseURL}/services?page=1&limit=12`, {
      // Marketplace ranking shifts through the day; a short cache keeps the
      // structured data fresh without hammering the API on every crawl.
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const payload = json?.data ?? json;
    const items = Array.isArray(payload) ? payload : payload?.items;
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function collectionJsonLd(services: Service[]) {
  const appUrl = APP_CONFIG.appUrl;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Browse verified home & domestic service providers in Rwanda",
    description:
      "Vetted house cleaners, nannies, cooks, tutors, drivers and makeup artists available to book across Kigali and Rwanda on Huza App.",
    isPartOf: { "@id": `${APP_CONFIG.contact.website}/#website` },
    about: {
      "@type": "Service",
      serviceType: [...MARKETING_SERVICE_TYPES],
      provider: { "@id": `${APP_CONFIG.contact.website}/#organization` },
      areaServed: [
        { "@type": "City", name: "Kigali" },
        { "@type": "Country", name: "Rwanda" },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: services.slice(0, 12).map((service, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${appUrl}${getServiceDetailPath(service)}`,
        name: `${getServiceDisplayName(service, "en")} by ${getProviderName(service.provider)}`,
        ...(getServiceCardImage(service) ? { image: getServiceCardImage(service) } : {}),
      })),
    },
  };
}

export default async function ServiceBrowsePage() {
  const services = await fetchFirstPage();
  return (
    <>
      {services.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(collectionJsonLd(services)).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <Suspense fallback={null}>
        <ServiceBrowseClient />
      </Suspense>
    </>
  );
}
