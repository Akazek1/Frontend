/**
 * Redact off-platform contact info from user-authored free text (job/service
 * descriptions, bios) shown to logged-out guests.
 *
 * Masks emails, URLs (incl. WhatsApp/Telegram/social links), and phone-like
 * digit runs. This is anti-disintermediation: guests shouldn't be able to lift
 * a phone number or social handle out of a description and take the deal
 * off-platform.
 *
 * NOTE: this is the client-side pass for guest rendering. For full enforcement
 * the same masking should also run server-side on the public list/detail
 * endpoints (so the raw values never reach an unauthenticated client). Tracked
 * as a follow-up.
 */

const PLACEHOLDER = "[hidden — sign in]";

// Order matters: emails before URLs before phone runs.
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const URL_RE =
  /\b(?:https?:\/\/|www\.)[^\s]+|\b[a-z0-9.-]+\.(?:com|rw|org|net|io|me|app|co|biz|info)\b[^\s]*/gi;
// 7+ digit-like run separated only by spaces/dashes/parens/dots/+ (catches
// +250 7xx xxx xxx, 07xxxxxxxx, etc.) without matching comma-grouped prices.
const PHONE_RE = /(?:\+?\d[\s\-().]?){7,}\d/g;

export function redactContactInfo(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(EMAIL_RE, PLACEHOLDER)
    .replace(URL_RE, PLACEHOLDER)
    .replace(PHONE_RE, PLACEHOLDER);
}

/** Redact only when the viewer is not authenticated. */
export function redactForGuest(text: string | null | undefined, isAuthenticated: boolean): string {
  if (!text) return "";
  return isAuthenticated ? text : redactContactInfo(text);
}
