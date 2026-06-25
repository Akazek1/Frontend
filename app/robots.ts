import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/constant/app.config";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    "/agency/",
    "/book/",
    "/bookings/",
    "/business/",
    "/checkout/",
    "/conversations/",
    "/inquiries/",
    "/logout",
    "/more/",
    "/offline",
    "/onboarding/",
    "/organization/",
    "/placements/",
    "/post-job",
    "/profile",
    "/received-bookings/",
    "/work/",
  ];

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms", "/service"],
      disallow: privatePaths,
    },
    sitemap: `${APP_CONFIG.contact.website}/sitemap.xml`,
    host: APP_CONFIG.contact.website,
  };
}
