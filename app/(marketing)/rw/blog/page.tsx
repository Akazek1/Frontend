import type { Metadata } from "next";
import { marketingUrl } from "@/components/marketing/marketing-content";
import { BlogIndexView } from "@/components/blog/blog-index-view";
import { publishedByLocale } from "@/content/blog";

// Kinyarwanda blog index — a real crawlable URL (like /rw), so the marketing
// nav/footer render in Kinyarwanda and a Kinyarwanda query can rank here.
export const metadata: Metadata = {
  title: "Blog ya Huza App",
  description:
    "Inama zifatika ku bijyanye no gushaka akazi ko mu rugo no kubona umukozi wizewe mu Rwanda.",
  alternates: { canonical: marketingUrl("/rw/blog") },
  openGraph: { locale: "rw_RW", alternateLocale: ["en_RW"] },
  robots: publishedByLocale("rw").length === 0 ? { index: false, follow: true } : undefined,
};

export default function BlogIndexRw() {
  return <BlogIndexView locale="rw" />;
}
