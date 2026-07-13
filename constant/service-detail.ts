/**
 * Constants for the new (preview) service detail design.
 * Centralizes all UI labels, fallback values, and stat/chip configs so the
 * page never hardcodes strings.
 */

export function serviceDetailLabels(t: (key: string) => string) {
  return {
    availableToday: t("availableToday"),
    verified: t("verified"),
    priceLabel: t("priceLabel"),
    priceCaption: t("priceCaption"),
    availabilityLabel: t("availabilityLabel"),
    availabilityValue: t("availabilityValue"),
    availabilityCaption: t("availabilityCaption"),
    speaks: t("speaks"),
    aboutPrefix: t("aboutPrefix"),
    readMore: t("readMore"),
    readLess: t("readLess"),
    servicesOffered: t("servicesOffered"),
    workPhotos: t("workPhotos"),
    viewAll: t("viewAll"),
    reviews: t("reviews"),
    seeAll: t("seeAll"),
    message: t("message"),
    requestToHire: t("requestToHire"),
    requestSent: t("requestSent"),
    noReviewsYet: t("noReviewsYet"),
    serviceNotFound: t("serviceNotFound"),
  } as const;
}

export type StatKey = "years" | "jobs" | "rehire";

export interface ProviderStat {
  key: StatKey;
  icon: "Briefcase" | "ClipboardCheck" | "Smile";
  label: string;
}

// Only metrics backed by real data. Values are computed on the detail page
// from the provider's yearsOfExperience and the service's review/job stats.
export function providerStats(t: (key: string) => string): ProviderStat[] {
  return [
    { key: "years", icon: "Briefcase", label: t("yearsExp") },
    { key: "jobs", icon: "ClipboardCheck", label: t("jobsDone") },
    { key: "rehire", icon: "Smile", label: t("wouldRehire") },
  ];
}

// Map service-category names → lucide icon names for the pills
export const SERVICE_CATEGORY_ICONS: Record<string, string> = {
  "House Cleaning": "Home",
  "Deep Cleaning": "Sparkles",
  "Kitchen Cleaning": "UtensilsCrossed",
  "Laundry & Ironing": "Shirt",
  "Window Cleaning": "PanelTop",
};

export const DEFAULT_CATEGORY_ICON = "Sparkles";

// How many work-photo thumbnails to show in the row before the "+N" overlay
export const WORK_PHOTOS_VISIBLE = 5;
