import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, LOCALE_COOKIE, toLocale } from "./config";
import en from "../messages/en.json";

type Messages = Record<string, unknown>;

// Deep-merge so any key not yet translated in the active locale falls back to
// the English source instead of rendering a raw key path. Lets us ship the app
// while translation is still in progress, one namespace at a time.
function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = out[key];
    out[key] =
      value && typeof value === "object" && !Array.isArray(value) &&
      existing && typeof existing === "object" && !Array.isArray(existing)
        ? deepMerge(existing as Messages, value as Messages)
        : value;
  }
  return out;
}

// Resolves the active locale + messages for every request. Because we don't use
// i18n routing, the locale comes from the `LOCALE_COOKIE` cookie rather than the
// URL. next-intl caches this per request, so server components and the client
// provider in the root layout stay in sync.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = toLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  const messages =
    locale === defaultLocale
      ? en
      : deepMerge(en, (await import(`../messages/${locale}.json`)).default);

  return { locale, messages };
});
