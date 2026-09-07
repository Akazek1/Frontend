import type { BlogPost } from "./types";
import * as hireNannyKigali from "./hire-nanny-kigali";
import * as expatGuide from "./expat-guide-home-services-rwanda";
import * as akaziRwanda from "./akazi-mu-rwanda-huza";

// Static registry — one entry per article module. No filesystem / MDX pipeline
// (keeps next.config.ts untouched); articles are plain .tsx exporting `meta` +
// `Body`.
const MODULES = [hireNannyKigali, expatGuide, akaziRwanda];

export const ALL_POSTS: BlogPost[] = MODULES.map((m) => ({
  meta: m.meta,
  Body: m.Body,
})).sort((a, b) => b.meta.publishedAt.localeCompare(a.meta.publishedAt));

/** Posts that are live — indexable, listed, in the sitemap. */
export const PUBLISHED_POSTS: BlogPost[] = ALL_POSTS.filter(
  (p) => p.meta.status === "published",
);

export function getPost(slug: string): BlogPost | undefined {
  return ALL_POSTS.find((p) => p.meta.slug === slug);
}
