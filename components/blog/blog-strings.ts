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
  readMore: string;
  /** e.g. "1 article" / "Inyandiko 1". */
  count: (n: number) => string;
}

export const BLOG_STRINGS: Record<"en" | "rw", BlogStrings> = {
  en: {
    indexHeading: "Huza App Blog",
    indexIntro:
      "Practical guides to hiring trusted home and domestic help in Kigali and across Rwanda.",
    empty: "New articles are on the way.",
    breadcrumb: "Blog",
    readMore: "Read",
    count: (n) => `${n} ${n === 1 ? "article" : "articles"}`,
  },
  rw: {
    indexHeading: "Blog ya Huza App",
    indexIntro:
      "Inama zifatika ku bijyanye no gushaka akazi ko mu rugo no kubona umukozi wizewe mu Rwanda.",
    empty: "Inyandiko nshya ziraza vuba.",
    breadcrumb: "Blog",
    readMore: "Soma",
    count: (n) => `Inyandiko ${n}`,
  },
};

// Node's ICU has Kinyarwanda month data but formats "yyyy MMM d", and most
// browsers have no `rw` data at all and fall back to English — so a shared
// component would hydrate mismatched. Format dates deterministically instead.
const RW_MONTHS = [
  "Mutarama", "Gashyantare", "Werurwe", "Mata", "Gicurasi", "Kamena",
  "Nyakanga", "Kanama", "Nzeri", "Ukwakira", "Ugushyingo", "Ukuboza",
];

const EN_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function blogDateFormatter(locale: "en" | "rw") {
  return {
    format(date: Date): string {
      if (locale === "rw") {
        return `${date.getUTCDate()} ${RW_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
      }
      return EN_FMT.format(date);
    },
  };
}
