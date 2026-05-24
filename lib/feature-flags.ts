/**
 * Feature flags
 * -------------
 * Runtime toggles for in-progress work. Flags default to OFF so the app
 * behaves exactly as before unless explicitly enabled.
 *
 * GUEST_BROWSING gates Phase 1 of the guest-onboarding redesign:
 *   - public browsing of the home + detail pages (see middleware.ts)
 *   - the guest header + segmented home
 *   - the auth gate on commitment actions
 * When OFF, none of the new behavior is reachable and the existing
 * auth-gated flow is preserved untouched.
 *
 * Toggle via env (build/deploy): NEXT_PUBLIC_GUEST_BROWSING=true
 */
export const FEATURE_FLAGS = {
  guestBrowsing: process.env.NEXT_PUBLIC_GUEST_BROWSING === "true",
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/** Whether public guest browsing (Phase 1 redesign) is enabled. */
export const isGuestBrowsingEnabled = (): boolean => FEATURE_FLAGS.guestBrowsing;
