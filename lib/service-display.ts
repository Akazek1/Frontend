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
  const providerPicture = service?.provider?.profilePicture || service?.provider?.profileImg;

  return serviceImages[0] || providerPicture || "";
}

export function getProviderHandle(provider?: Service["provider"] | null) {
  if (provider?.username) return `@${provider.username}`;

  const firstName = provider?.firstName?.toLowerCase().replace(/\s+/g, "") || "provider";
  const lastName = provider?.lastName?.toLowerCase().replace(/\s+/g, "") || "";
  return `@${firstName}${lastName ? "_" + lastName : ""}`;
}

export function getBookingType(service?: Partial<Service> | null) {
  const provider = service?.provider;
  return isEmployer(provider?.roles) ? "STAFFING_AGENCY" : "INDIVIDUAL";
}

export function mapServiceToProviderCard(service: Service): Provider {
  const areas = Array.isArray(service.serviceAreas)
    ? service.serviceAreas
    : service.serviceAreas
    ? [service.serviceAreas as string]
    : [];

  return {
    id: service.id,
    image: getServiceCardImage(service),
    name: `${service.provider.firstName} ${service.provider.lastName}`,
    handle: getProviderHandle(service.provider),
    title: service.title,
    experience: service.description || "",
    languages: Array.isArray(service.provider.languages)
      ? service.provider.languages.join(", ")
      : "",
    location: areas[0] || "",
    price: formatPrice(service.priceMin, service.priceMax, service.priceType),
    rating: service.reviews?.averageRating || 0,
    reviews: service.reviews?.totalReviews || 0,
    jobsCompleted: service.reviews?.jobsCompleted || 0,
    wouldHireAgain: service.reviews?.wouldHireAgain || 0,
    distance: APP_CONFIG.serviceDetail.fallbackDistance,
    // Card shows "Available Today" only when the service is active AND the
    // worker hasn't turned off their global availability toggle.
    available: service.isActive && (service.provider?.availableForWork ?? true),
    verified: service.provider?.isVerified ?? false,
    type: getBookingType(service),
    providerId: service.providerId,
    username: service.provider.username,
    profileImage: service.provider.profilePicture || service.provider.profileImg,
  };
}

/**
 * Build the canonical /{handle}/services/{id} path for a service detail page.
 * The handle segment is derived from the provider's username or name.
 */
export function getServiceDetailPath(service?: Partial<Service> | null) {
  const handle = getProviderHandle(service?.provider).replace(/^@/, "");
  return `/${handle}/services/${service?.id || ""}`;
}

export function shouldUnoptimizeImage(src?: string) {
  return Boolean(src && (src.endsWith(".svg") || src.startsWith("/")));
}

export const serviceImageFallback = APP_CONFIG.media.defaultServiceImage;
export const profileImageFallback = APP_CONFIG.media.defaultProfileImage;
