/**
 * Pure functions that map backend records (Booking, JobApplication, Job)
 * to the WorkItem shape used by the UI.
 *
 * Extracted from work-page.tsx for testability per WORK_PAGE_REFACTOR_PROMPT.md.
 */

import React from "react";
import { ClipboardList } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Job, JobApplication } from "@/services/jobs-service";
import { sectionOrder } from "./types";
import type { BookingRecord, SectionKey, WorkItem, WorkRole } from "./types";
import {
  bookingCategory,
  bookingTitle,
  formatDate,
  getBookingId,
  getBudgetText,
  getPersonName,
  getProfileHref,
  getTimeAgo,
} from "./utils";

export const toBookingItem = (
  booking: BookingRecord,
  role: WorkRole,
  section: SectionKey,
  accent: WorkItem["accent"],
): WorkItem => {
  const id = getBookingId(booking);
  const person =
    role === "provider"
      ? booking.employer || booking.partner
      : booking.worker || booking.partner;
  const title = getPersonName(person);
  const workTitle = bookingTitle(booking);
  const price = booking.price ?? booking.agreedPrice;
  const isPending = booking.status === "PENDING";
  const isDone = ["COMPLETED", "CANCELLED"].includes(booking.status);
  const isActive = ["CONFIRMED", "IN_PROGRESS"].includes(booking.status);

  return {
    id: `booking-${role}-${id}`,
    kind: "booking",
    section,
    role,
    title,
    subtitle: workTitle,
    meta: [bookingCategory(booking), formatDate(booking.scheduledFor), getBudgetText(price)],
    secondaryMeta: booking.createdAt
      ? `${isPending ? "Requested" : "Updated"} ${getTimeAgo(booking.createdAt)}`
      : undefined,
    status: booking.status,
    statusLabel:
      booking.status === "PENDING"
        ? role === "provider"
          ? "From Employer"
          : "Offer Sent"
        : booking.status.replace("_", " "),
    accent,
    avatarUrl: person?.profilePicture,
    profileHref: getProfileHref(person),
    bookingId: id,
    createdAt: booking.createdAt,
    primaryAction:
      isPending && role === "provider"
        ? "acceptBooking"
        : booking.status === "COMPLETED"
          ? "leaveReview"
          : isDone
            ? "viewDetails"
            : "openChat",
    secondaryAction: isPending
      ? role === "provider"
        ? "rejectBooking"
        : "sendReminder"
      : isActive
        ? "markComplete"
        : booking.status === "COMPLETED"
          ? "viewDetails"
          : undefined,
  };
};

export const toApplicationItem = (application: JobApplication): WorkItem | null => {
  const job = application.job;
  if (!job) return null;
  const isPending = application.status === "PENDING";
  const isAccepted = application.status === "ACCEPTED";
  const isClosed = ["REJECTED", "WITHDRAWN"].includes(application.status);

  return {
    id: `application-${application.id}`,
    kind: "application",
    section: isPending || isAccepted ? "expressedInterest" : "done",
    role: "provider",
    title: job.title,
    subtitle: `Posted by ${job.employer?.firstName || "Employer"}`,
    meta: [
      job.category?.name || "Work",
      job.startDate ? formatDate(job.startDate) : "Flexible",
      formatPrice(job.budgetMin, job.budgetMax),
    ],
    secondaryMeta: `Applied ${getTimeAgo(application.createdAt)}`,
    status: application.status,
    statusLabel: isAccepted ? "Offer Received" : isClosed ? "Not Selected" : "You Applied",
    accent: isClosed ? "gray" : "purple",
    icon: <ClipboardList className="h-6 w-6 text-[#6D28D9]" />,
    jobHref: `/jobs/${application.jobId}`,
    bookingId: application.bookingId || undefined,
    applicationId: application.id,
    jobId: application.jobId,
    createdAt: application.createdAt,
    primaryAction: isAccepted && application.bookingId ? "openChat" : "viewDetails",
    secondaryAction: isPending ? "withdrawApplication" : undefined,
  };
};

/**
 * Combines bookings, applications and job posts into a single, deduplicated
 * list of WorkItems, sorted by section.
 *
 * Dedup rule: when a booking exists on both worker- and employer-sides
 * (because the user is dual-role and the booking is between them), the
 * worker-side card wins for active and done sections. Pending bookings are
 * never deduped — they represent distinct intents (incoming vs outgoing).
 */
export const composeWorkItems = ({
  workerBookings,
  employerBookings,
  applications,
  jobPosts,
}: {
  workerBookings: BookingRecord[];
  employerBookings: BookingRecord[];
  applications: JobApplication[];
  jobPosts: Job[];
}): WorkItem[] => {
  const bookingSeen = new Set<string>();
  const result: WorkItem[] = [];

  workerBookings.forEach((booking) => {
    const id = getBookingId(booking);
    if (!id) return;
    const status = booking.status;
    if (status === "PENDING") {
      result.push(toBookingItem(booking, "provider", "awaitingReview", "orange"));
    } else if (["CONFIRMED", "IN_PROGRESS"].includes(status)) {
      bookingSeen.add(id);
      result.push(toBookingItem(booking, "provider", "activeDeals", "green"));
    } else if (["COMPLETED", "CANCELLED"].includes(status)) {
      bookingSeen.add(id);
      result.push(toBookingItem(booking, "provider", "done", "gray"));
    }
  });

  employerBookings.forEach((booking) => {
    const id = getBookingId(booking);
    if (!id) return;
    const status = booking.status;
    if (status === "PENDING") {
      result.push(toBookingItem(booking, "employer", "awaitingReply", "slate"));
    } else if (["CONFIRMED", "IN_PROGRESS"].includes(status)) {
      if (bookingSeen.has(id)) return;
      bookingSeen.add(id);
      result.push(toBookingItem(booking, "employer", "activeDeals", "green"));
    } else if (["COMPLETED", "CANCELLED"].includes(status)) {
      if (bookingSeen.has(id)) return;
      bookingSeen.add(id);
      result.push(toBookingItem(booking, "employer", "done", "gray"));
    }
  });

  jobPosts.forEach((job) => {
    const item = toJobApplicantsItem(job);
    if (item) result.push(item);
  });

  applications.forEach((application) => {
    const item = toApplicationItem(application);
    if (item) result.push(item);
  });

  return result.sort((a, b) => {
    const aScore = sectionOrder.indexOf(a.section);
    const bScore = sectionOrder.indexOf(b.section);
    return aScore - bScore;
  });
};

export const toJobApplicantsItem = (job: Job): WorkItem | null => {
  const count = job._count?.applications || 0;
  if (count < 1) return null;

  return {
    id: `job-applicants-${job.id}`,
    kind: "jobApplicants",
    section: "awaitingReview",
    role: "employer",
    title: job.title,
    subtitle: `${count} applicant${count === 1 ? "" : "s"} interested`,
    meta: [
      job.category?.name || "Work",
      job.createdAt ? `Posted ${getTimeAgo(job.createdAt)}` : "Posted recently",
      formatPrice(job.budgetMin, job.budgetMax),
    ],
    status: job.status,
    statusLabel: job.status === "OPEN" ? "Open" : job.status,
    accent: "orange",
    icon: <ClipboardList className="h-6 w-6 text-[#FF3D00]" />,
    jobHref: `/jobs/${job.id}`,
    jobId: job.id,
    primaryAction: "viewApplicants",
  };
};
