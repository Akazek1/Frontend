import { describe, it, expect } from "vitest";
import {
  composeWorkItems,
  toApplicationItem,
  toBookingItem,
  toJobApplicantsItem,
} from "@/components/work/mappers";
import type { BookingRecord } from "@/components/work/types";
import type { Job, JobApplication } from "@/services/jobs-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseBooking: BookingRecord = {
  id: "b1",
  status: "PENDING",
  scheduledFor: "2026-06-05T08:00:00Z",
  createdAt: "2026-06-01T05:00:00Z",
  agreedPrice: 30000,
  service: { id: "s1", title: "House Cleaning", category: { name: "House Cleaning" } },
  employer: { id: "e1", firstName: "Alice", lastName: "Uwimana", username: "alice_u" },
  worker:   { id: "w1", firstName: "Diane", lastName: "Mukeshimana", username: "diane_m" },
};

const makeBooking = (overrides: Partial<BookingRecord>): BookingRecord => ({
  ...baseBooking,
  ...overrides,
});

const baseApplication: JobApplication = {
  id: "a1",
  status: "PENDING",
  createdAt: "2026-06-01T05:00:00Z",
  jobId: "j1",
  workerId: "w1",
  job: {
    id: "j1",
    title: "Garden Maintenance",
    employer: { firstName: "Jean Claude" } as NonNullable<JobApplication["job"]>["employer"],
    category: { name: "Gardening" },
    budgetMin: 15000,
    budgetMax: 25000,
    startDate: "2026-06-10T08:00:00Z",
  } as unknown as JobApplication["job"],
} as unknown as JobApplication;

const baseJob: Job = {
  id: "j1",
  title: "House Cleaning – Saturday",
  status: "OPEN",
  createdAt: "2026-06-01T05:00:00Z",
  category: { name: "House Cleaning" },
  budgetMin: 25000,
  budgetMax: 35000,
  _count: { applications: 3 },
} as unknown as Job;

// ---------------------------------------------------------------------------
// toBookingItem
// ---------------------------------------------------------------------------

describe("toBookingItem", () => {
  it("pending booking received by provider → awaitingReview with From Employer label and acceptBooking action", () => {
    const item = toBookingItem(baseBooking, "provider", "awaitingReview", "orange");

    expect(item.section).toBe("awaitingReview");
    expect(item.role).toBe("provider");
    expect(item.statusLabel).toBe("From Employer");
    expect(item.primaryAction).toBe("acceptBooking");
    expect(item.secondaryAction).toBe("rejectBooking");
    expect(item.accent).toBe("orange");
    expect(item.title).toContain("Alice"); // shows the employer (other party)
  });

  it("pending booking sent by employer → awaitingReply with Offer Sent label and sendReminder action", () => {
    const item = toBookingItem(baseBooking, "employer", "awaitingReply", "slate");

    expect(item.section).toBe("awaitingReply");
    expect(item.role).toBe("employer");
    expect(item.statusLabel).toBe("Offer Sent");
    expect(item.secondaryAction).toBe("sendReminder");
    expect(item.accent).toBe("slate");
    expect(item.title).toContain("Diane"); // shows the worker (other party)
  });

  it("in-progress booking → activeDeals with openChat primary action", () => {
    const item = toBookingItem(
      makeBooking({ status: "IN_PROGRESS" }),
      "employer",
      "activeDeals",
      "green",
    );

    expect(item.primaryAction).toBe("openChat");
    expect(item.secondaryAction).toBe("markComplete");
    expect(item.accent).toBe("green");
  });

  it("completed booking → leaveReview primary action", () => {
    const item = toBookingItem(
      makeBooking({ status: "COMPLETED" }),
      "employer",
      "done",
      "gray",
    );

    expect(item.primaryAction).toBe("leaveReview");
    expect(item.accent).toBe("gray");
  });

  it("cancelled booking → viewDetails primary action", () => {
    const item = toBookingItem(
      makeBooking({ status: "CANCELLED" }),
      "employer",
      "done",
      "gray",
    );

    expect(item.primaryAction).toBe("viewDetails");
  });

  it("falls back to a default name when the other party is missing", () => {
    const noEmployer = makeBooking({ employer: null });
    const item = toBookingItem(noEmployer, "provider", "awaitingReview", "orange");
    expect(item.title).toBe("Akazek user");
  });
});

// ---------------------------------------------------------------------------
// toApplicationItem
// ---------------------------------------------------------------------------

describe("toApplicationItem", () => {
  it("pending application → expressedInterest section with purple accent", () => {
    const item = toApplicationItem(baseApplication);

    expect(item).not.toBeNull();
    expect(item!.section).toBe("expressedInterest");
    expect(item!.role).toBe("provider");
    expect(item!.accent).toBe("purple");
    expect(item!.statusLabel).toBe("You Applied");
  });

  it("rejected application → done section with gray accent", () => {
    const item = toApplicationItem({ ...baseApplication, status: "REJECTED" } as JobApplication);

    expect(item!.section).toBe("done");
    expect(item!.accent).toBe("gray");
    expect(item!.statusLabel).toBe("Not Selected");
  });

  it("accepted application without booking → expressedInterest with viewDetails action", () => {
    const item = toApplicationItem({ ...baseApplication, status: "ACCEPTED" } as JobApplication);

    expect(item!.section).toBe("expressedInterest");
    expect(item!.primaryAction).toBe("viewDetails");
  });

  it("accepted application linked to a booking → openChat primary action", () => {
    const item = toApplicationItem({
      ...baseApplication,
      status: "ACCEPTED",
      bookingId: "b9",
    } as JobApplication);

    expect(item!.primaryAction).toBe("openChat");
    expect(item!.bookingId).toBe("b9");
  });

  it("returns null when the application has no job attached", () => {
    const orphan = { ...baseApplication, job: undefined } as unknown as JobApplication;
    expect(toApplicationItem(orphan)).toBeNull();
  });

  it("secondary meta says 'Applied' without trailing 'ago ago'", () => {
    const item = toApplicationItem(baseApplication);
    expect(item!.secondaryMeta).toMatch(/^Applied /);
    expect(item!.secondaryMeta!.endsWith(" ago ago")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toJobApplicantsItem
// ---------------------------------------------------------------------------

describe("toJobApplicantsItem", () => {
  it("job with applicants → grouped awaitingReview card", () => {
    const item = toJobApplicantsItem(baseJob);

    expect(item).not.toBeNull();
    expect(item!.section).toBe("awaitingReview");
    expect(item!.role).toBe("employer");
    expect(item!.accent).toBe("orange");
    expect(item!.subtitle).toContain("3 applicants");
    expect(item!.primaryAction).toBe("viewApplicants");
  });

  it("job with zero applicants is skipped", () => {
    const empty = { ...baseJob, _count: { applications: 0 } } as Job;
    expect(toJobApplicantsItem(empty)).toBeNull();
  });

  it("singular 'applicant' for count = 1", () => {
    const one = { ...baseJob, _count: { applications: 1 } } as Job;
    expect(toJobApplicantsItem(one)!.subtitle).toContain("1 applicant interested");
  });

  it("posted-meta does not have trailing 'ago ago'", () => {
    const item = toJobApplicantsItem(baseJob);
    expect(item!.meta.some((m) => m.endsWith(" ago ago"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// composeWorkItems (integration)
// ---------------------------------------------------------------------------

describe("composeWorkItems", () => {
  it("dedupes a booking that appears on both worker and employer feeds for active section", () => {
    const sharedBooking = makeBooking({ id: "shared", status: "CONFIRMED" });
    const items = composeWorkItems({
      workerBookings: [sharedBooking],
      employerBookings: [sharedBooking],
      applications: [],
      jobPosts: [],
    });

    // Provider side wins; only one active-deal card produced
    expect(items.filter((i) => i.section === "activeDeals").length).toBe(1);
    expect(items.find((i) => i.section === "activeDeals")!.role).toBe("provider");
  });

  it("pending bookings are NOT deduped (distinct intents)", () => {
    const sharedBooking = makeBooking({ id: "shared", status: "PENDING" });
    const items = composeWorkItems({
      workerBookings: [sharedBooking],
      employerBookings: [sharedBooking],
      applications: [],
      jobPosts: [],
    });

    // Should produce both an incoming review card AND an outgoing reply card
    expect(items.filter((i) => i.section === "awaitingReview").length).toBe(1);
    expect(items.filter((i) => i.section === "awaitingReply").length).toBe(1);
  });

  it("sorts items by section order: review → reply → interest → active → done", () => {
    const items = composeWorkItems({
      workerBookings: [
        makeBooking({ id: "d1", status: "COMPLETED" }),       // done
        makeBooking({ id: "p1", status: "PENDING" }),         // awaitingReview
      ],
      employerBookings: [
        makeBooking({ id: "a1", status: "IN_PROGRESS" }),      // activeDeals
        makeBooking({ id: "r1", status: "PENDING" }),          // awaitingReply
      ],
      applications: [baseApplication],                          // expressedInterest
      jobPosts: [],
    });

    const sections = items.map((i) => i.section);
    const order = ["awaitingReview", "awaitingReply", "expressedInterest", "activeDeals", "done"];
    for (let i = 1; i < sections.length; i++) {
      expect(order.indexOf(sections[i])).toBeGreaterThanOrEqual(order.indexOf(sections[i - 1]));
    }
  });

  it("skips bookings with no id (defensive)", () => {
    const items = composeWorkItems({
      workerBookings: [makeBooking({ id: undefined, bookingId: undefined })],
      employerBookings: [],
      applications: [],
      jobPosts: [],
    });
    expect(items).toHaveLength(0);
  });
});
