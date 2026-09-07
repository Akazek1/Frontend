import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { publishedByLocale, blogPath } from "@/content/blog";
import { BLOG_STRINGS, blogDateFormatter } from "@/components/blog/blog-strings";

// Shared blog index body. `locale` picks the language of both the chrome and
// which articles are listed: /blog shows EN posts, /rw/blog shows RW posts.
export function BlogIndexView({ locale }: { locale: "en" | "rw" }) {
  const posts = publishedByLocale(locale);
  const s = BLOG_STRINGS[locale];
  const dateFmt = blogDateFormatter(locale);

  return (
    <div lang={locale} className="mx-auto max-w-5xl px-5 py-14 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
          {s.indexHeading}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{s.indexIntro}</p>
      </header>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-black/15 bg-surface/50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink-muted">{s.empty}</p>
        </div>
      ) : (
        <>
          <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            {s.count(posts.length)}
          </p>
          <ul className="mt-4 grid gap-6 sm:grid-cols-2">
            {posts.map(({ meta }) => {
              const href = blogPath(meta);
              return (
                <li key={meta.slug}>
                  <Link
                    href={href}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition-colors hover:border-brand/40"
                  >
                    {meta.heroImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={meta.heroImage}
                        alt={meta.heroImageAlt ?? ""}
                        width={1600}
                        height={840}
                        className="aspect-[16/9] w-full object-cover"
                      />
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="text-lg font-bold leading-snug text-ink group-hover:text-brand">
                        {meta.title}
                      </h2>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-muted">
                        {meta.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-ink-subtle">
                          {dateFmt.format(new Date(meta.publishedAt))}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                          {s.readMore} <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
