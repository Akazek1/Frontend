import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { marketingUrl } from "@/components/marketing/marketing-content";
import { blogPostJsonLd } from "@/lib/marketing-jsonld";
import { Prose } from "@/components/blog/prose";
import { ALL_POSTS, getPost } from "@/content/blog";

// Every known article (drafts included) is prerendered. Drafts just carry
// robots:noindex and are kept out of the index/sitemap/nav — see
// generateMetadata + content/blog. Unknown slugs 404.
export function generateStaticParams() {
  return ALL_POSTS.map((p) => ({ slug: p.meta.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const { meta } = post;
  const url = marketingUrl(`/blog/${meta.slug}`);
  const isDraft = meta.status !== "published";

  return {
    title: `${meta.title} | Huza App`,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: url },
    robots: isDraft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: meta.title,
      description: meta.description,
      url,
      locale: meta.locale === "rw" ? "rw_RW" : "en_RW",
      publishedTime: meta.publishedAt,
      modifiedTime: meta.updatedAt ?? meta.publishedAt,
      ...(meta.heroImage
        ? {
            images: [
              {
                url: marketingUrl(meta.heroImage),
                width: 1600,
                height: 840,
                alt: meta.heroImageAlt ?? meta.title,
              },
            ],
          }
        : {}),
    },
    ...(meta.heroImage
      ? {
          twitter: {
            card: "summary_large_image" as const,
            title: meta.title,
            description: meta.description,
            images: [marketingUrl(meta.heroImage)],
          },
        }
      : {}),
  };
}

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "long" });

export default async function BlogArticle({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { meta, Body } = post;
  const isDraft = meta.status !== "published";

  return (
    <article lang={meta.locale} className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
      {!isDraft && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              blogPostJsonLd({
                slug: meta.slug,
                title: meta.title,
                description: meta.description,
                locale: meta.locale,
                publishedAt: meta.publishedAt,
                updatedAt: meta.updatedAt,
                image: meta.heroImage ? marketingUrl(meta.heroImage) : undefined,
              }),
            ).replace(/</g, "\\u003c"),
          }}
        />
      )}

      {isDraft && (
        <p className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-900">
          Draft — not indexed or linked publicly.
          {meta.reviewNote ? ` ${meta.reviewNote}` : ""}
        </p>
      )}

      <nav className="text-xs text-ink-subtle">
        <Link href="/blog" className="hover:text-brand">
          Blog
        </Link>
        <span className="mx-1.5">/</span>
        <span>{meta.title}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-ink sm:text-4xl">
        {meta.title}
      </h1>
      <p className="mt-3 text-sm text-ink-subtle">
        {dateFmt.format(new Date(meta.publishedAt))}
      </p>

      {meta.heroImage && (
        // eslint-disable-next-line @next/next/no-img-element -- static asset,
        // images.unoptimized is on; plain <img> avoids the next/image runtime.
        <img
          src={meta.heroImage}
          alt={meta.heroImageAlt ?? ""}
          width={1600}
          height={840}
          className="mt-8 aspect-[40/21] w-full rounded-2xl object-cover ring-1 ring-black/5"
        />
      )}

      <div className="mt-10">
        <Prose>
          <Body />
        </Prose>
      </div>
    </article>
  );
}
