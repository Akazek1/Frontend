/**
 * Application Configuration
 * Centralized configuration for app-wide constants
 */

export const APP_CONFIG = {
  name: "Akazek",
  tagline: "Connect with Trusted Service Professionals",
  description: "Rwanda's domestic work marketplace connecting households with verified service workers",

  // Branding
  brand: {
    primaryColor: "#145B10",
    logo: "/logo.png",
  },

  // Contact & Support
  contact: {
    email: "support@akazek.rw",
    phone: "+250788335947", // Update with actual support number
    website: "https://akazek.rw",
  },

  // Social Media
  social: {
    facebook: "https://facebook.com/akazek",
    instagram: "https://instagram.com/akazek",
    twitter: "https://twitter.com/akazek",
  },

  // SMS Configuration
  sms: {
    sender: "AKAZEK",
    supportText: "Reply STOP to opt-out",
  },

  // Company Info
  company: {
    name: "Akazek Rwanda Ltd",
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
