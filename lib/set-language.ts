import { LOCALE_COOKIE } from "@/i18n/config";
import api from "@/lib/axios";
import { getAuthToken } from "@/lib/auth-utils";

/**
 * Persist a language choice.
 *
 * - Always sets the device `locale` cookie — the source of truth next-intl reads
 *   on the server to pick the message catalog. This is why a returning device
 *   silently defaults to the previous choice.
 * - If the user is signed in, also syncs the choice to their account in the
 *   background (`POST /auth/language`), so it follows them across devices and
 *   localizes server-sent content (OTP SMS, push notifications).
 *
 * Fire-and-forget: the account sync never blocks the UI or surfaces an error —
 * the cookie alone is enough for the current device.
 */
export function persistLanguage(code: string): void {
  const next = code.toLowerCase();
  // 1-year cookie; mirrors LanguageSwitcher so both entry points behave the same.
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  if (getAuthToken()) {
    api
      .post("/auth/language", { language: next }, { skipAuthRedirect: true })
      .catch(() => {
        /* silent — device cookie already applied; will re-sync on next switch */
      });
  }
}
