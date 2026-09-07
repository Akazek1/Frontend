import type { ComponentType } from "react";

export type BlogStatus = "draft" | "published";

export interface BlogPostMeta {
  /** URL slug — the article lives at huza.app/blog/<slug>. */
  slug: string;
  /** <html lang> + hreflang for this post. */
  locale: "en" | "rw";
  title: string;
  /** Meta description + OG description. ~150–160 chars. */
  description: string;
  /** Target search terms — informational, not rendered. */
  keywords: string[];
  /** ISO date. */
  publishedAt: string;
  /** ISO date; defaults to publishedAt. */
  updatedAt?: string;
  /**
   * "draft" posts are viewable by direct URL (for review) but are excluded
   * from the blog index + sitemap and carry robots:noindex. Flip to
   * "published" once the copy is signed off (EN: human edit; RW: native
   * Kinyarwanda review — see the i18n translation policy).
   */
  status: BlogStatus;
  /** One-line note for whoever reviews this draft. */
  reviewNote?: string;
}

export interface BlogPost {
  meta: BlogPostMeta;
  /** The article body. */
  Body: ComponentType;
}
