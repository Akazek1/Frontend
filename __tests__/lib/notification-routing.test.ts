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

  it("routes hire requests to the Work requests tab, not the empty chat", () => {
    expect(
      buildNotificationTargetUrl({
        type: "HIRE_REQUEST",
        bookingId: "booking-1",
        notificationId: "n1",
      }),
    ).toBe("/work?tab=requests&notificationId=n1");
  });

  it("honors a backend-provided href deep link over id-based fallbacks", () => {
    expect(
      buildNotificationTargetUrl({
        type: "INQUIRY_ACCEPTED",
        inquiryId: "inq-1",
        href: "/inquiries/inq-1",
      }),
    ).toBe("/inquiries/inq-1");
  });

  it("ignores non-relative hrefs (no external redirects from push data)", () => {
    expect(
      buildNotificationTargetUrl({
        href: "https://evil.example.com/",
        bookingId: "b1",
      }),
    ).toBe("/conversations/inbox/b1");
  });

  it("routes reviews to the service page's reviews section", () => {
    expect(
      buildNotificationTargetUrl({
        type: "NEW_REVIEW",
        serviceId: "s1",
        providerUsername: "@diane",
        reviewId: "r1",
      }),
    ).toBe("/diane/services/s1?reviewId=r1#reviews");
  });

  it("routes verification revocation to the profile", () => {
    expect(buildNotificationTargetUrl({ type: "VERIFICATION_REVOKED" })).toBe(
      "/profile",
    );
  });
});
