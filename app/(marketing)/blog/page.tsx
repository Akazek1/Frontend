import type { Metadata } from "next";
import { marketingUrl } from "@/components/marketing/marketing-content";
import { APP_CONFIG } from "@/constant/app.config";
import { BlogIndexView } from "@/components/blog/blog-index-view";
import { publishedByLocale } from "@/content/blog";

// English blog index. Kinyarwanda articles have their own index at /rw/blog so
// the nav/footer stay in the reader's language (mirrors /welcome ↔ /rw).
export const metadata: Metadata = {
  title: `Blog | ${APP_CONFIG.seoName}`,
  description:
    "Guides to hiring trusted home and domestic help in Kigali and across Rwanda — nannies, cleaners, cooks, drivers and more.",
  alternates: { canonical: marketingUrl("/blog") },
  robots: publishedByLocale("en").length === 0 ? { index: false, follow: true } : undefined,
};

export default function BlogIndexEn() {
  return <BlogIndexView locale="en" />;
}
