import { describe, expect, it } from "vitest";
import { buildNotificationTargetUrl } from "@/lib/notification-routing";

describe("buildNotificationTargetUrl", () => {
  it("routes booking notifications to the conversation thread", () => {
    expect(
      buildNotificationTargetUrl({
        bookingId: "booking 1",
        notificationId: "notification 1",
      }),
    ).toBe("/conversations/inbox/booking%201?notificationId=notification%201");
  });

  it("routes job notifications to the job detail page", () => {
    expect(
      buildNotificationTargetUrl({
        jobId: "job/1",
      }),
    ).toBe("/jobs/job%2F1");
  });

  it("falls back to home while preserving notification id", () => {
    expect(buildNotificationTargetUrl({ notificationId: "abc" })).toBe(
      "/?notificationId=abc",
    );
  });
});
