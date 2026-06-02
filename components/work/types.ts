/**
 * Shared types and constants for the Work page feature.
 * Extracted from work-page.tsx per WORK_PAGE_REFACTOR_PROMPT.md (reusability rule).
 */

export type WorkFilter = "all" | "requests" | "active" | "done";
export type SectionKey =
  | "awaitingReview"
  | "awaitingReply"
  | "expressedInterest"
  | "activeDeals"
  | "done";
export type WorkRole = "provider" | "employer";
export type WorkItemKind = "booking" | "application" | "jobApplicants";

export interface Person {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  isVerified?: boolean;
}

export interface BookingRecord {
  id?: string;
  bookingId?: string;
  status: string;
  scheduledFor?: string | null;
  createdAt?: string;
  updatedAt?: string;
  agreedPrice?: number | null;
  price?: number | null;
  service?: {
    id?: string;
    title?: string;
    serviceImage?: string | null;
    category?: { name?: string };
  } | null;
  job?: {
    id?: string;
    title?: string;
    category?: { name?: string };
  } | null;
  employer?: Person | null;
  worker?: Person | null;
  partner?: Person | null;
  address?: { city?: string; street?: string } | null;
  review?: { rating: number; comment?: string } | null;
}

export interface WorkItem {
  id: string;
  kind: WorkItemKind;
  section: SectionKey;
  role: WorkRole;
  title: string;
  subtitle: string;
  meta: string[];
  secondaryMeta?: string;
  status: string;
  statusLabel: string;
  accent: "orange" | "slate" | "purple" | "green" | "gray";
  avatarUrl?: string | null;
  icon?: React.ReactNode;
  profileHref?: string;
  jobHref?: string;
  bookingId?: string;
  applicationId?: string;
  jobId?: string;
  primaryAction?:
    | "acceptBooking"
    | "openChat"
    | "leaveReview"
    | "viewApplicants"
    | "viewDetails";
  secondaryAction?:
    | "rejectBooking"
    | "sendReminder"
    | "viewDetails"
    | "markComplete"
    | "withdrawApplication";
  /** ISO timestamp the underlying record was created — used by the card to decide whether to render a "New" badge. */
  createdAt?: string;
}

export const SECTION_COPY: Record<
  SectionKey,
  { title: string; subtitle: string; empty: string }
> = {
  awaitingReview: {
    title: "AWAITING YOUR REVIEW",
    subtitle: "People asking to work with you",
    empty: "No pending requests need your review.",
  },
  awaitingReply: {
    title: "AWAITING THEIR REPLY",
    subtitle: "Direct requests you sent",
    empty: "No pending requests sent.",
  },
  expressedInterest: {
    title: "YOU EXPRESSED INTEREST",
    subtitle: "Job posts you applied to",
    empty: "No job applications are waiting yet.",
  },
  activeDeals: {
    title: "ACTIVE DEALS",
    subtitle: "",
    empty: "No active deals yet.",
  },
  done: {
    title: "DONE",
    subtitle: "Completed or canceled",
    empty: "No closed work yet.",
  },
};

export const FILTER_LABELS: Record<WorkFilter, string> = {
  all: "All",
  requests: "Requests",
  active: "Active",
  done: "Done",
};

export const SECTION_GROUPS: Record<WorkFilter, SectionKey[]> = {
  all: ["awaitingReview", "awaitingReply", "expressedInterest", "activeDeals", "done"],
  requests: ["awaitingReview", "awaitingReply", "expressedInterest"],
  active: ["activeDeals"],
  done: ["done"],
};

export const sectionOrder: SectionKey[] = [
  "awaitingReview",
  "awaitingReply",
  "expressedInterest",
  "activeDeals",
  "done",
];

export const accentClasses = {
  orange: {
    bar: "border-l-[#FF4D14]",
    title: "text-[#FF3D00]",
    soft: "bg-orange-50 text-[#FF3D00]",
  },
  slate: {
    bar: "border-l-[#2563EB]",
    title: "text-[#1155FF]",
    soft: "bg-blue-50 text-[#1155FF]",
  },
  purple: {
    bar: "border-l-[#6D28D9]",
    title: "text-[#6D28D9]",
    soft: "bg-purple-50 text-[#6D28D9]",
  },
  green: {
    bar: "border-l-[#145B10]",
    title: "text-[#145B10]",
    soft: "bg-green-50 text-[#145B10]",
  },
  gray: {
    bar: "border-l-gray-300",
    title: "text-gray-500",
    soft: "bg-gray-100 text-gray-600",
  },
} as const;

export const statusClasses: Record<string, string> = {
  PENDING: "bg-orange-50 text-orange-600",
  CONFIRMED: "bg-green-50 text-[#145B10]",
  IN_PROGRESS: "bg-green-50 text-[#145B10]",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-50 text-red-600",
  ACCEPTED: "bg-green-50 text-[#145B10]",
  REJECTED: "bg-gray-100 text-gray-500",
  WITHDRAWN: "bg-gray-100 text-gray-500",
  OPEN: "bg-green-50 text-[#145B10]",
  AWARDED: "bg-purple-50 text-purple-600",
  CLOSED: "bg-gray-100 text-gray-600",
};
