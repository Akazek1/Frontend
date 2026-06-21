import APP_CONFIG from "@/constant/app.config";
import { Provider, Service } from "@/types";
import { formatPrice } from "@/lib/utils";
import { isEmployer } from "./roles";

type ServiceProvider = Service["provider"] | undefined;

export function getProviderName(provider: ServiceProvider) {
  return `${provider?.firstName || "Unknown"} ${provider?.lastName || "Provider"}`.trim();
}

export function getServiceImages(service?: Partial<Service> | null) {
  const images = [
    ...(Array.isArray(service?.serviceImages) ? service?.serviceImages || [] : []),
    service?.serviceImage,
  ].filter(Boolean) as string[];

  return Array.from(new Set(images));
}

export function getServiceCardImage(service?: Partial<Service> | null) {
  const serviceImages = getServiceImages(service);
  const ownerPicture =
    service?.provider?.profilePicture ||
    service?.provider?.profileImg ||
    service?.company?.logoUrl ||
    "";

  return serviceImages[0] || ownerPicture || "";
}

export function getProviderHandle(provider?: Service["provider"] | null) {
  if (provider?.username) return `@${provider.username}`;

  const firstName = provider?.firstName?.toLowerCase().replace(/\s+/g, "") || "provider";
  const lastName = provider?.lastName?.toLowerCase().replace(/\s+/g, "") || "";
  return `@${firstName}${lastName ? "_" + lastName : ""}`;
}

/** A URL-safe slug for a Service Company (used in detail-page paths). */
function getCompanySlug(company?: Service["company"] | null) {
  const base = company?.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return base || "company";
}

export function getBookingType(service?: Partial<Service> | null) {
  // Project 2 Phase E — a company-owned card (no provider) is a COMPANY listing.
  if (!service?.provider && service?.company) return "COMPANY";
  const provider = service?.provider;
  return isEmployer(provider?.roles) ? "STAFFING_AGENCY" : "INDIVIDUAL";
}

export function mapServiceToProviderCard(service: Service): Provider {
  const areas = Array.isArray(service.serviceAreas)
    ? service.serviceAreas
    : service.serviceAreas
    ? [service.serviceAreas as string]
    : [];

  // Project 2 Phase E — company cards have no individual provider; render the
  // owning company as the "provider" (name, logo, verification). A verified
  // company is always treated as available.
  const isCompanyCard = !service.provider && !!service.company;
  const company = service.company;
  const provider = service.provider;

  return {
    id: service.id,
    image: getServiceCardImage(service),
    name: isCompanyCard
      ? company?.name || "Company"
      : `${provider?.firstName ?? "Unknown"} ${provider?.lastName ?? "Provider"}`.trim(),
    // Company cards don't link to an individual profile.
    handle: isCompanyCard ? undefined : getProviderHandle(provider),
    title: service.title,
    experience: service.description || "",
    languages:
      !isCompanyCard && Array.isArray(provider?.languages)
        ? provider!.languages!.join(", ")
        : "",
    location: areas[0] || "",
    price: formatPrice(service.priceMin, service.priceMax, service.priceType),
    rating: service.reviews?.averageRating || 0,
    reviews: service.reviews?.totalReviews || 0,
    jobsCompleted: service.reviews?.jobsCompleted || 0,
    wouldHireAgain: service.reviews?.wouldHireAgain || 0,
    distance: APP_CONFIG.serviceDetail.fallbackDistance,
    // Card shows "Available Today" only when the service is active AND (for
    // individuals) the worker hasn't turned off availability. Company cards are
    // available whenever active.
    available: isCompanyCard
      ? service.isActive
      : service.isActive && (provider?.availableForWork ?? true),
    verified: isCompanyCard
      ? company?.verified ?? false
      : provider?.isVerified ?? false,
    type: getBookingType(service),
    providerId: service.providerId ?? undefined,
    username: isCompanyCard ? undefined : provider?.username,
    profileImage: isCompanyCard
      ? company?.logoUrl || undefined
      : provider?.profilePicture || provider?.profileImg,
    agency: !isCompanyCard ? provider?.agency ?? null : null,
  };
}

/**
 * Build the canonical /{handle}/services/{id} path for a service detail page.
 * The handle segment is derived from the provider's username/name, or — for a
 * company-owned card — a slug of the company name.
 */
export function getServiceDetailPath(service?: Partial<Service> | null) {
  const handle =
    !service?.provider && service?.company
      ? getCompanySlug(service.company)
      : getProviderHandle(service?.provider).replace(/^@/, "");
  return `/${handle}/services/${service?.id || ""}`;
}

export function shouldUnoptimizeImage(src?: string) {
  return Boolean(src && (src.endsWith(".svg") || src.startsWith("/")));
}

export const serviceImageFallback = APP_CONFIG.media.defaultServiceImage;
export const profileImageFallback = APP_CONFIG.media.defaultProfileImage;
