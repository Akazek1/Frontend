import APP_CONFIG from "@/constant/app.config";
import { Service } from "@/types";
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
  return isEmployer(provider?.roles) ? "AGENCY" : "INDIVIDUAL";
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
