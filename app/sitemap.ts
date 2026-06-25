import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/constant/app.config";

const publicRoutes = ["", "/service", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${APP_CONFIG.contact.website}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
