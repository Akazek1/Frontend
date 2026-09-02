import { Fragment } from "react";
import { APP_CONFIG } from "@/constant/app.config";
import { MarketingImage } from "@/components/marketing/marketing-image";
import { ARROW_ICON, CHECK_ICON, type MarketingDict } from "@/components/marketing/marketing-content";

const APP_URL = APP_CONFIG.appUrl;

// Renders one or more \n-separated lines as text with <br/> between them.
function multiline(text: string) {
  const parts = text.split("\n");
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {part}
    </Fragment>
  ));
}

// Presentational marketing homepage. All copy comes from `dict` so the same
// markup renders the English page (/welcome) and the Kinyarwanda page (/rw).
// Section ids (how/workers/employers/trust) are locale-independent so the nav
// anchors and hreflang work identically on both.
export function MarketingHome({ dict, jsonLd }: { dict: MarketingDict; jsonLd?: object }) {
  const Arrow = ARROW_ICON;
  const Check = CHECK_ICON;

  return (
    // `lang` on the subtree: the root <html lang> is driven by the locale
    // cookie and can't be set per-route in the App Router, so we scope the
    // language here for crawlers and screen readers. Pairs with the page's
    // hreflang alternates and og:locale.
    <div lang={dict.locale}>
      {jsonLd ? (
        // Rendered as a child of a real element (not a fragment sibling) so
        // Next serializes it into the SSR HTML instead of the RSC payload.
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
      {/* Hero */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-brand ring-1 ring-brand/15">
              {dict.hero.badge}
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-ink sm:text-5xl">
              {dict.hero.titleLead}
              <span className="text-brand">{dict.hero.titleTrusted}</span>
              {multiline(dict.hero.titleMid)}
              <span className="text-brand">{dict.hero.titleJob}</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-muted">{dict.hero.body}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={APP_URL}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                {dict.hero.openApp} <Arrow className="h-4 w-4" />
              </a>
              <a
                href="#how"
                className="inline-flex items-center rounded-full border border-brand/30 px-7 py-3.5 text-base font-semibold text-brand transition-colors hover:bg-white"
              >
                {dict.hero.howItWorks}
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {dict.hero.chips.map(({ Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 text-sm text-ink-muted">
                  <Icon className="h-4 w-4 text-brand" /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Hero visual: the lifestyle photo feathered into the section
              background on its left + bottom edges (mask-image), with the real
              app screenshot floating over the lower-right so it never covers
              the worker's face. On phones the photo crops to a shorter aspect
              ratio; the phone shrinks. Tapping the phone opens the real app. */}
          <div className="relative mx-auto w-full max-w-lg lg:mr-0">
            <MarketingImage
              src="/marketing/hero-cleaner.jpeg"
              alt={dict.hero.imageAlt}
              label="Add hero photo"
              hint="Landscape lifestyle photo — /marketing/hero-cleaner.jpeg (≈1600×1000)"
              className="aspect-[4/3] w-full object-[center_20%] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_22%,#000_100%),linear-gradient(to_bottom,#000_60%,transparent)] [-webkit-mask-composite:source-in] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_22%,#000_100%),linear-gradient(to_bottom,#000_60%,transparent)] sm:aspect-[3/2] lg:aspect-[4/5]"
            />
            <a
              href={APP_URL}
              aria-label={dict.hero.appImageAlt}
              className="absolute -bottom-4 -right-2 w-[32%] max-w-[150px] rounded-[1.4rem] bg-brand-dark p-1.5 shadow-2xl shadow-brand/25 transition-transform hover:-translate-y-1 sm:-right-6 lg:-right-10"
            >
              <MarketingImage
                src="/marketing/app-home.webp"
                alt={dict.hero.appImageAlt}
                label="App screenshot"
                hint="Portrait phone screenshot"
                className="aspect-[9/19] w-full overflow-hidden rounded-[1.25rem]"
              />
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-ink">{dict.how.heading}</h2>
          <p className="mt-3 text-ink-muted">{dict.how.sub}</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {dict.how.steps.map(({ Icon, title, body }, i) => (
            <div key={title} className="rounded-2xl border border-black/5 bg-white p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-brand">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 flex items-center gap-2 text-lg font-semibold text-ink">
                <span className="text-sm font-bold text-brand">{i + 1}</span> {title}
              </h3>
              <p className="mt-2 leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audiences */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-20 sm:px-6 md:grid-cols-2">
          {[dict.workers, dict.employers].map((group) => (
            <div
              key={group.id}
              id={group.id}
              className="scroll-mt-20 rounded-2xl bg-white p-8 ring-1 ring-brand/10"
            >
              <MarketingImage
                src={group.id === "workers" ? "/marketing/for-workers.png" : "/marketing/for-employers.png"}
                alt={group.imageAlt}
                label={group.id === "workers" ? "Add the 'For workers' image" : "Add the 'For employers' image"}
                hint="Landscape card image"
                className="mb-6 w-full overflow-hidden rounded-xl ring-1 ring-black/5"
              />
              <h2 className="text-2xl font-black text-ink">{group.heading}</h2>
              <p className="mt-1 font-medium text-brand">{group.tagline}</p>
              <ul className="mt-6 space-y-3">
                {group.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-ink-muted">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand" /> {p}
                  </li>
                ))}
              </ul>
              <a
                href={APP_URL}
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark"
              >
                {group.cta} <Arrow className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & safety */}
      <section id="trust" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-ink">{dict.trust.heading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">{dict.trust.sub}</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dict.trust.tiles.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-black/5 bg-white p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-ink-subtle">{dict.trust.freeNote}</p>
      </section>

      {/* CTA */}
      <section className="px-5 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 rounded-3xl bg-brand px-8 py-12 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-black text-white">{dict.cta.heading}</h2>
            <p className="mt-2 text-white/85">{dict.cta.body}</p>
          </div>
          <a
            href={APP_URL}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-brand transition-colors hover:bg-white/90"
          >
            {dict.cta.button} <Arrow className="h-4 w-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
