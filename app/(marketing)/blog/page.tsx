import type { Metadata } from "next";
import Link from "next/link";
import { marketingUrl } from "@/components/marketing/marketing-content";
import { APP_CONFIG } from "@/constant/app.config";
import { PUBLISHED_POSTS } from "@/content/blog";

export const metadata: Metadata = {
  title: `Blog | ${APP_CONFIG.seoName}`,
  description:
    "Guides to hiring trusted home and domestic help in Kigali and across Rwanda — nannies, cleaners, cooks, drivers and more.",
  alternates: { canonical: marketingUrl("/blog") },
  // Nothing published yet keeps this page thin; let it be indexed only once it
  // has real content.
  robots: PUBLISHED_POSTS.length === 0 ? { index: false, follow: true } : undefined,
};

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "long" });

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
      <h1 className="text-3xl font-black tracking-tight text-ink">Huza App Blog</h1>
      <p className="mt-3 text-ink-muted">
        Practical guides to hiring trusted home and domestic help in Kigali and
        across Rwanda.
      </p>

      {PUBLISHED_POSTS.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-black/5 bg-white p-6 text-sm text-ink-muted">
          New articles are on the way.
        </p>
      ) : (
        <ul className="mt-12 space-y-8">
          {PUBLISHED_POSTS.map(({ meta }) => (
            <li key={meta.slug} className="border-b border-black/5 pb-8 last:border-0">
              <h2 className="text-xl font-bold text-ink">
                <Link href={`/blog/${meta.slug}`} className="hover:text-brand">
                  {meta.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{meta.description}</p>
              <p className="mt-2 text-xs text-ink-subtle">
                {dateFmt.format(new Date(meta.publishedAt))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
