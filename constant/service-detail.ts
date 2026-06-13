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

export type StatKey = "years" | "jobs" | "onTime" | "clients";

export interface ProviderStat {
  key: StatKey;
  icon: "Briefcase" | "ClipboardCheck" | "Clock" | "Users";
  label: string;
  suffix?: string;
  plusOnGte?: number; // append "+" when value >= this threshold
}

export const PROVIDER_STATS: ProviderStat[] = [
  { key: "years", icon: "Briefcase", label: "Years Experience", plusOnGte: 1 },
  { key: "jobs", icon: "ClipboardCheck", label: "Jobs Completed" },
  { key: "onTime", icon: "Clock", label: "On-time Rate", suffix: "%" },
  { key: "clients", icon: "Users", label: "Happy Clients", plusOnGte: 10 },
];

/**
 * Mock-fill defaults — used ONLY when the API doesn't yet return the field.
 * Remove a fallback once the corresponding backend field is wired up.
 */
export const SERVICE_DETAIL_FALLBACKS = {
  distanceText: "2.5 km away",
  city: "Kicukiro, Kigali",
  languages: ["Kinyarwanda", "English"],
  yearsExperience: 2,
  jobsCompleted: 48,
  onTimeRate: 95,
  happyClients: 12,
  availableToday: true,
  bio: "I am a dedicated and trustworthy cleaner with over 2 years of experience helping families keep their homes clean, fresh, and organized.\nI pay attention to detail and always respect your space and time.",
  servicesOffered: [
    "House Cleaning",
    "Deep Cleaning",
    "Kitchen Cleaning",
    "Laundry & Ironing",
    "Window Cleaning",
  ],
  // total photos used to compute the "+N" overlay on the last visible tile
  workPhotosTotal: 13,
  priceRangeText: "5,000 – 15,000 RWF/day",
};

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
