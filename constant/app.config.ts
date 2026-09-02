/**
 * Application Configuration
 * Centralized configuration for app-wide constants
 */

export const APP_CONFIG = {
  name: "Huza",
  tagline: "Connect with Trusted Service Professionals",
  description: "Rwanda's domestic work marketplace connecting households with verified service workers",

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
    website: "https://www.huza.app",
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

  // Company Info
  company: {
    name: "Huza.app LTD",
    registrationNumber: "RC/HQU/2024/XXXXX", // Update with actual registration
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
