// Localised chrome for the blog (headings, breadcrumb, empty state, date
// formatting). Article *bodies* live in content/blog/*; this is only the
// furniture around them.
//
// ⚠️  The `rw` strings are an AI first draft and must be checked by a native
// Kinyarwanda speaker (see the i18n translation policy). Fix in place.

export interface BlogStrings {
  indexHeading: string;
  indexIntro: string;
  empty: string;
  breadcrumb: string;
  /** BCP-47 tag for Intl date formatting. */
  dateLocale: string;
}

export const BLOG_STRINGS: Record<"en" | "rw", BlogStrings> = {
  en: {
    indexHeading: "Huza App Blog",
    indexIntro:
      "Practical guides to hiring trusted home and domestic help in Kigali and across Rwanda.",
    empty: "New articles are on the way.",
    breadcrumb: "Blog",
    dateLocale: "en-RW",
  },
  rw: {
    indexHeading: "Blog ya Huza App",
    indexIntro:
      "Inama zifatika ku bijyanye no gushaka akazi ko mu rugo no kubona umukozi wizewe mu Rwanda.",
    empty: "Inyandiko nshya ziraza vuba.",
    breadcrumb: "Blog",
    dateLocale: "rw-RW",
  },
};

export function blogDateFormatter(locale: "en" | "rw") {
  return new Intl.DateTimeFormat(BLOG_STRINGS[locale].dateLocale, {
    dateStyle: "long",
    timeZone: "UTC",
  });
}
