/**
 * Rwandan phone numbers, matching the backend's `src/common/phone.ts`.
 *
 * Stored form is bare `250XXXXXXXXX`; anything a person might type —
 * `0788…`, `+250 788…`, `250-788…` — normalises to it.
 */

/** Digits only, in the stored `250XXXXXXXXX` form. Does NOT assert validity. */
export function normalizeRwandaPhone(input: string): string {
  const digits = (input ?? "").replace(/\D/g, "");
  if (digits.startsWith("250")) return digits;
  if (digits.startsWith("0")) return `250${digits.substring(1)}`;
  return `250${digits}`;
}

/** True when the input normalises to a well-formed Rwandan number. */
export function isValidRwandaPhone(input: string): boolean {
  return /^250\d{9}$/.test(normalizeRwandaPhone(input));
}
