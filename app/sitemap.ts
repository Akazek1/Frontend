import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/constant/app.config";
import { PUBLISHED_POSTS } from "@/content/blog";

const site = APP_CONFIG.contact.website;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Only published blog posts (drafts carry robots:noindex and aren't linked).
  const blog: MetadataRoute.Sitemap =
    PUBLISHED_POSTS.length > 0
      ? [
          {
            url: `${site}/blog`,
            lastModified: now,
            changeFrequency: "weekly" as const,
            priority: 0.6,
          },
          ...PUBLISHED_POSTS.map((p) => ({
            url: `${site}/blog/${p.meta.slug}`,
            lastModified: new Date(p.meta.updatedAt ?? p.meta.publishedAt),
            changeFrequency: "monthly" as const,
            priority: 0.6,
          })),
        ]
      : [];

  return [
    // Marketing homepage — English and its crawlable Kinyarwanda twin, each
    // declaring the other via hreflang alternates so Google serves the right
    // language for the query.
    {
      url: `${site}/welcome`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
      alternates: {
        languages: {
          en: `${site}/welcome`,
          rw: `${site}/rw`,
        },
      },
    },
    {
      url: `${site}/rw`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
      alternates: {
        languages: {
          en: `${site}/welcome`,
          rw: `${site}/rw`,
        },
      },
    },
    ...["/service", "/privacy", "/terms"].map((route) => ({
      url: `${site}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...blog,
  ];
}
