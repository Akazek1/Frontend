import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticleView, blogArticleMetadata } from "@/components/blog/blog-article-view";
import { ALL_POSTS, getPost } from "@/content/blog";

// Kinyarwanda article route. Only RW slugs exist here (drafts included);
// English articles live under /blog. Any other slug 404s.
export function generateStaticParams() {
  return ALL_POSTS.filter((p) => p.meta.locale === "rw").map((p) => ({ slug: p.meta.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post || post.meta.locale !== "rw") return {};
  return blogArticleMetadata(post);
}

export default async function BlogArticleRw({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post || post.meta.locale !== "rw") notFound();
  return <BlogArticleView post={post} />;
}
