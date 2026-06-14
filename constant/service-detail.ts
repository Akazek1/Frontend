/**
 * Constants for the new (preview) service detail design.
 * Centralizes all UI labels, fallback values, and stat/chip configs so the
 * page never hardcodes strings.
 */

export const SERVICE_DETAIL_LABELS = {
  availableToday: "Available Today",
  verified: "Verified",
  priceLabel: "Price",
  priceCaption: "Price varies based on task and size",
  availabilityLabel: "Availability",
  availabilityValue: "Flexible Hours",
  availabilityCaption: "Morning / Afternoon",
  speaks: "Speaks:",
  aboutPrefix: "About",
  readMore: "Read more",
  readLess: "Read less",
  servicesOffered: "Services Offered",
  workPhotos: "Work Photos",
  viewAll: "View all",
  reviews: "Reviews",
  seeAll: "See all",
  message: "Message",
  requestToHire: "Request to Hire",
  requestSent: "Request Sent",
  noReviewsYet: "No reviews yet.",
  serviceNotFound: "Service not found",
} as const;

export type StatKey = "years" | "jobs" | "rating" | "rehire";

export interface ProviderStat {
  key: StatKey;
  icon: "Briefcase" | "ClipboardCheck" | "Star" | "Smile";
  label: string;
}

// Only metrics backed by real data. Values are computed on the detail page
// from the provider's yearsOfExperience and the service's review/job stats.
export const PROVIDER_STATS: ProviderStat[] = [
  { key: "years", icon: "Briefcase", label: "Years Exp" },
  { key: "jobs", icon: "ClipboardCheck", label: "Jobs Done" },
  { key: "rating", icon: "Star", label: "Rating" },
  { key: "rehire", icon: "Smile", label: "Would Rehire" },
];

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
