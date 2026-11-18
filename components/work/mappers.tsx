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
  bookingTitle,
  formatDate,
  getBookingId,
  getBudgetText,
  getPersonName,
  getProfileHref,
  getTimeAgo,
} from "./utils";

export type MapperStrings = {
  requested: string;
  updated: string;
  applied: string;
  fromEmployer: string;
  offerSent: string;
  postedBy: (name: string) => string;
  flexible: string;
  offerReceived: string;
  notSelected: string;
  youApplied: string;
  locale: string;
};

const defaultStrings: MapperStrings = {
  requested: "Requested",
  updated: "Updated",
  applied: "Applied",
  fromEmployer: "From Employer",
  offerSent: "Offer Sent",
  postedBy: (name) => `Posted by ${name}`,
  flexible: "Flexible",
  offerReceived: "Offer Received",
  notSelected: "Not Selected",
  youApplied: "You Applied",
  locale: "en",
};

export const toBookingItem = (
  booking: BookingRecord,
  role: WorkRole,
  section: SectionKey,
  accent: WorkItem["accent"],
  strings: MapperStrings = defaultStrings,
): WorkItem => {
  const id = getBookingId(booking);
  const person =
    role === "provider"
      ? booking.employer || booking.partner
      : booking.worker || booking.partner;
  const title = getPersonName(person);
  const workTitle = bookingTitle(booking, strings.locale);
  const price = booking.price ?? booking.agreedPrice;
  const isPending = booking.status === "PENDING";
  const isDone = ["COMPLETED", "CANCELLED"].includes(booking.status);
  const isActive = ["CONFIRMED", "IN_PROGRESS"].includes(booking.status);
  const chatOpened = Boolean(booking.latestMessage);

  // Employers can re-book a completed service straight from the Done list.
  // Routes to the service detail page (which hosts the hire flow); falls back
  // to the worker's profile when the booking originated from a job post.
  const hireHref =
    role === "employer" && booking.status === "COMPLETED"
      ? booking.service?.id
        ? `/service/${booking.service.id}`
        : getProfileHref(person)
      : undefined;

  return {
    id: `booking-${role}-${id}`,
    kind: "booking",
    section,
    role,
    title,
    subtitle: workTitle,
    meta: [formatDate(booking.scheduledFor, "", strings.locale + "-RW"), getBudgetText(price)].filter(Boolean),
    secondaryMeta: booking.createdAt
      ? `${isPending ? strings.requested : strings.updated} ${getTimeAgo(booking.createdAt, strings.locale)}`
      : undefined,
    status: booking.status,
    statusLabel:
      booking.status === "PENDING"
        ? role === "provider"
          ? strings.fromEmployer
          : strings.offerSent
        : booking.status.replace("_", " "),
    accent,
    avatarUrl: person?.profilePicture,
    profileHref: getProfileHref(person),
    bookingId: id,
    hireHref,
    createdAt: booking.createdAt,
    requestNote: booking.notes?.trim() || undefined,
    chatOpened,
    primaryAction:
      isPending && role === "provider"
        ? chatOpened
          ? "acceptBooking"
          : "acceptChat"
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

export const toApplicationItem = (application: JobApplication, strings: MapperStrings = defaultStrings): WorkItem | null => {
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
    subtitle: strings.postedBy(job.employer?.firstName || ""),
    meta: [
      (strings.locale === "rw" && job.category?.nameKn) ? job.category.nameKn : (job.category?.name || ""),
      job.startDate ? formatDate(job.startDate) : strings.flexible,
      formatPrice(job.budgetMin, job.budgetMax),
    ],
    secondaryMeta: `${strings.applied} ${getTimeAgo(application.createdAt, strings.locale)}`,
    status: application.status,
    statusLabel: isAccepted ? strings.offerReceived : isClosed ? strings.notSelected : strings.youApplied,
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
  strings,
}: {
  workerBookings: BookingRecord[];
  employerBookings: BookingRecord[];
  applications: JobApplication[];
  jobPosts: Job[];
  strings?: MapperStrings;
}): WorkItem[] => {
  const s = strings ?? defaultStrings;
  const bookingSeen = new Set<string>();
  const result: WorkItem[] = [];

  workerBookings.forEach((booking) => {
    const id = getBookingId(booking);
    if (!id) return;
    const status = booking.status;
    if (status === "PENDING") {
      result.push(toBookingItem(booking, "provider", "awaitingReview", "orange", s));
    } else if (["CONFIRMED", "IN_PROGRESS"].includes(status)) {
      bookingSeen.add(id);
      result.push(toBookingItem(booking, "provider", "activeDeals", "green", s));
    } else if (["COMPLETED", "CANCELLED"].includes(status)) {
      bookingSeen.add(id);
      result.push(toBookingItem(booking, "provider", "done", "gray", s));
    }
  });

  employerBookings.forEach((booking) => {
    const id = getBookingId(booking);
    if (!id) return;
    const status = booking.status;
    if (status === "PENDING") {
      result.push(toBookingItem(booking, "employer", "awaitingReply", "slate", s));
    } else if (["CONFIRMED", "IN_PROGRESS"].includes(status)) {
      if (bookingSeen.has(id)) return;
      bookingSeen.add(id);
      result.push(toBookingItem(booking, "employer", "activeDeals", "green", s));
    } else if (["COMPLETED", "CANCELLED"].includes(status)) {
      if (bookingSeen.has(id)) return;
      bookingSeen.add(id);
      result.push(toBookingItem(booking, "employer", "done", "gray", s));
    }
  });

  jobPosts.forEach((job) => {
    const item = toJobApplicantsItem(job, s);
    if (item) result.push(item);
  });

  applications.forEach((application) => {
    const item = toApplicationItem(application, s);
    if (item) result.push(item);
  });

  return result.sort((a, b) => {
    const aScore = sectionOrder.indexOf(a.section);
    const bScore = sectionOrder.indexOf(b.section);
    return aScore - bScore;
  });
};

export const toJobApplicantsItem = (job: Job, strings: MapperStrings = defaultStrings): WorkItem | null => {
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
      (strings.locale === "rw" && job.category?.nameKn) ? job.category.nameKn : (job.category?.name || ""),
      job.createdAt ? `${strings.requested} ${getTimeAgo(job.createdAt, strings.locale)}` : "",
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
