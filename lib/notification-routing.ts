// Single source of truth for "where does tapping this notification go?".
// Used by the service worker's notificationclick handler (app/sw.ts), the
// in-app bell dropdowns, and the foreground push toast — so a pushed
// notification and its in-app twin always land on the same page.
//
// IMPORTANT: this module runs inside the service worker. Keep it free of
// React, axios, and any browser-only imports.

export type NotificationRouteData = Record<string, unknown> | null | undefined;

const getString = (data: NotificationRouteData, key: string) => {
  const value = data?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

/**
 * Resolves the in-app destination for a notification's metadata, or null when
 * there is nothing meaningful to open (callers decide their own fallback).
 */
export function resolveNotificationHref(data: NotificationRouteData): string | null {
  // Backend-provided deep link wins (inquiry flows send exact hrefs, e.g.
  // /inquiries/<id> for clients vs /agency/requests/<id> for the agency).
  const href = getString(data, "href");
  if (href?.startsWith("/")) return href;

  const type = getString(data, "type") ?? "";
  const bookingId = getString(data, "bookingId");
  const jobId = getString(data, "jobId");
  const serviceId = getString(data, "serviceId");
  const reviewId = getString(data, "reviewId");
  const providerUsername = getString(data, "providerUsername")?.replace(/^@/, "");

  if ((type === "NEW_REVIEW" || type === "REVIEW_REPLY") && serviceId && providerUsername) {
    const params = reviewId ? `?reviewId=${encodeURIComponent(reviewId)}` : "";
    return `/${encodeURIComponent(providerUsername)}/services/${encodeURIComponent(serviceId)}${params}#reviews`;
  }

  // A hire request has no chat room yet — the provider reviews it (employer +
  // note) and accepts to chat from the Work "requests" view. Routing to the
  // booking's inbox here would drop them into an empty, locked room.
  if (type === "HIRE_REQUEST") return "/work?tab=requests";

  // Cancelled bookings land in the Work "Done" list (mappers.tsx buckets
  // COMPLETED/CANCELLED there), which shows the booking with its Cancelled
  // badge in context — calmer than dropping the user into the dead chat.
  if (type === "BOOKING_CANCELLED") return "/work?tab=done";

  if (type === "VERIFICATION_REVOKED") return "/profile";

  if (bookingId) return `/conversations/inbox/${encodeURIComponent(bookingId)}`;
  if (jobId) return `/jobs/${encodeURIComponent(jobId)}`;
  return null;
}

/**
 * Full target URL for the service worker's notificationclick: falls back to
 * home and carries the notificationId along so the app can mark it read.
 */
export function buildNotificationTargetUrl(data: NotificationRouteData) {
  let targetUrl = resolveNotificationHref(data) ?? "/";

  const notificationId = getString(data, "notificationId");
  if (notificationId) {
    const separator = targetUrl.includes("?") ? "&" : "?";
    targetUrl += `${separator}notificationId=${encodeURIComponent(notificationId)}`;
  }

  return targetUrl;
}
