/**
 * Application Configuration
 * Centralized configuration for app-wide constants
 */

export const APP_CONFIG = {
  // Short form — used in-app (phone frame, nav) and as the iOS
  // Add-to-Home-Screen / share-sheet title, where a longer string reads badly.
  name: "Huza",
  // Long form for SEO / structured data / OG site name. Search engines and LLMs
  // confuse bare "Huza" with unrelated Rwandan entities (Huza HR, Huza Finance,
  // Ehuza), so every crawler-facing surface says "Huza App".
  seoName: "Huza App",
  tagline: "Connect with Trusted Service Professionals",
  description:
    "Huza App is Rwanda's on-demand marketplace for vetted home and domestic services — book house cleaners, nannies, cooks, tutors, drivers and makeup artists across Kigali and Rwanda.",

  // Where the actual app lives. The marketing site runs on the apex domain
  // (huza.app) and the app on app.huza.app, so marketing CTAs ("Open the app")
  // must point at an absolute URL, not "/" (which just re-serves the marketing
  // homepage on the apex host). Override per-env with NEXT_PUBLIC_APP_URL.
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://app.huza.app",

  // Branding
  brand: {
    primaryColor: "#145B10",
    logo: "/brand/akazek-logo-dark.png",
  },

  media: {
    defaultServiceImage: "/default-service.svg",
    defaultProfileImage: "/default-profile.svg",
  },

  profile: {
    countries: ["Rwanda"],
    languages: ["Kinyarwanda", "English", "French", "Swahili"],
    genders: [
      { value: "MALE", label: "Male" },
      { value: "FEMALE", label: "Female" },
      { value: "OTHER", label: "Other" },
    ],
  },

  serviceDetail: {
    fallbackDistance: "2.5 km away",
    fallbackAvailabilityText: "Availability is confirmed during booking",
  },

  // Contact & Support
  contact: {
    email: "support@huza.app",
    phone: "+250785567821",
    website: "https://huza.app", // canonical marketing host (www.huza.app 301s here)
  },

  // Social Media
  social: {
    facebook: "https://www.facebook.com/profile.php?id=61592881903543",
    instagram: "https://www.instagram.com/huza.app/",
    whatsapp: "https://whatsapp.com/channel/0029Vb8h47bE50UkwovmcY0C",
  },

  // SMS Configuration
  sms: {
    sender: "AKAZEK",
    supportText: "Reply STOP to opt-out",
  },

  // Company Info — Huza.app LTD, registered with RDB (Domestic Business
  // Registration), issued 2026-07-15. In Rwanda the 9-digit TIN is also the
  // company's registration/identification number.
  company: {
    name: "Huza.app LTD",
    legalName: "Huza.app LTD",
    registrationNumber: "156660502", // = TIN; RDB ref REG-2026-707620
    tin: "156660502",
    foundingDate: "2026-07-15",
    address: "Kigali, Rwanda",
  },

  // Feature flags
  features: {
    darkMode: false,
    notifications: true,
    realTimeChat: true,
  },
};

export default APP_CONFIG;
