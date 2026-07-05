import type { Metadata } from "next";
import { ServiceDetailClient } from "./service-detail-client";
import { getServiceDisplayName, getProviderName, getServiceCardImage } from "@/lib/service-display";
import type { Service } from "@/types";
import APP_CONFIG from "@/constant/app.config";

async function fetchServiceForMetadata(id: string): Promise<Service | null> {
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
    const res = await fetch(`${baseURL}/services/${id}`, {
      // Listing details change often (price, availability) — avoid serving a
      // stale share preview, but don't block the page render on a slow origin.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const service = await fetchServiceForMetadata(id);

  if (!service) {
    return { title: `Service - ${APP_CONFIG.name}` };
  }

  const serviceName = getServiceDisplayName(service);
  const providerName = getProviderName(service.provider);
  const title = `${serviceName} by ${providerName} - ${APP_CONFIG.name}`;
  const description =
    service.description?.trim() ||
    `${providerName} offers ${serviceName} on ${APP_CONFIG.name}. Find trusted help for your home and daily needs.`;
  const image = getServiceCardImage(service);

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function ServiceDetailPage() {
  return <ServiceDetailClient />;
}
