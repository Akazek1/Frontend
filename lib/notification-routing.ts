export type NotificationRouteData = Record<string, unknown> | null | undefined;

const getString = (data: NotificationRouteData, key: string) => {
  const value = data?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

export function buildNotificationTargetUrl(data: NotificationRouteData) {
  const bookingId = getString(data, "bookingId");
  const jobId = getString(data, "jobId");
  const notificationId = getString(data, "notificationId");

  let targetUrl = "/";

  if (bookingId) {
    targetUrl = `/conversations/inbox/${encodeURIComponent(bookingId)}`;
  } else if (jobId) {
    targetUrl = `/jobs/${encodeURIComponent(jobId)}`;
  }

  if (notificationId) {
    const separator = targetUrl.includes("?") ? "&" : "?";
    targetUrl += `${separator}notificationId=${encodeURIComponent(notificationId)}`;
  }

  return targetUrl;
}
