// Central i18n settings shared by the request config, layout and switcher.
// We use next-intl WITHOUT URL routing: the active locale is a user preference
// stored in the `LOCALE_COOKIE` cookie (set by the language switcher), so the
// same page URL renders in whichever language the user picked.

export const locales = ["en", "rw"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Cookie that holds the user's chosen locale (lowercase, e.g. "rw"). */
export const LOCALE_COOKIE = "locale";

/** Narrow an arbitrary string (e.g. an admin code like "RW") to a Locale. */
export function toLocale(value: string | undefined | null): Locale {
  const lower = (value ?? "").toLowerCase();
  return (locales as readonly string[]).includes(lower)
    ? (lower as Locale)
    : defaultLocale;
}
