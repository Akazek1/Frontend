import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/constant/app.config";
import { PUBLISHED_POSTS, publishedByLocale, blogPath, blogIndexPath } from "@/content/blog";

const site = APP_CONFIG.contact.website;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Only published posts (drafts carry robots:noindex and aren't linked).
  // EN articles live under /blog, RW articles under /rw/blog — each language's
  // index is included only when it has at least one live article.
  const blogIndexes: MetadataRoute.Sitemap = (["en", "rw"] as const)
    .filter((l) => publishedByLocale(l).length > 0)
    .map((l) => ({
      url: `${site}${blogIndexPath(l)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  const blog: MetadataRoute.Sitemap = [
    ...blogIndexes,
    ...PUBLISHED_POSTS.map((p) => ({
      url: `${site}${blogPath(p.meta)}`,
      lastModified: new Date(p.meta.updatedAt ?? p.meta.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

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
