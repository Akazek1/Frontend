import Link from "next/link";
import { publishedByLocale, blogPath } from "@/content/blog";
import { BLOG_STRINGS, blogDateFormatter } from "@/components/blog/blog-strings";

// Shared blog index body. `locale` picks the language of both the chrome and
// which articles are listed: /blog shows EN posts, /rw/blog shows RW posts.
export function BlogIndexView({ locale }: { locale: "en" | "rw" }) {
  const posts = publishedByLocale(locale);
  const s = BLOG_STRINGS[locale];
  const dateFmt = blogDateFormatter(locale);

  return (
    <div lang={locale} className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
      <h1 className="text-3xl font-black tracking-tight text-ink">{s.indexHeading}</h1>
      <p className="mt-3 text-ink-muted">{s.indexIntro}</p>

      {posts.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-black/5 bg-white p-6 text-sm text-ink-muted">
          {s.empty}
        </p>
      ) : (
        <ul className="mt-12 space-y-8">
          {posts.map(({ meta }) => {
            const href = blogPath(meta);
            return (
              <li key={meta.slug} className="border-b border-black/5 pb-8 last:border-0">
                {meta.heroImage && (
                  <Link href={href}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={meta.heroImage}
                      alt={meta.heroImageAlt ?? ""}
                      width={1600}
                      height={840}
                      className="mb-4 aspect-[40/21] w-full rounded-xl object-cover ring-1 ring-black/5"
                    />
                  </Link>
                )}
                <h2 className="text-xl font-bold text-ink">
                  <Link href={href} className="hover:text-brand">
                    {meta.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{meta.description}</p>
                <p className="mt-2 text-xs text-ink-subtle">
                  {dateFmt.format(new Date(meta.publishedAt))}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
