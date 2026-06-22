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
    bar: "border-l-[#E8927A]",
    border: "border-[#F4D4C5]",
    title: "text-[#C17A5D]",
    soft: "bg-[#F9ECE6] text-[#C17A5D]",
    card: "bg-[#FEF6F1]",
  },
  slate: {
    bar: "border-l-[#8FA5D9]",
    border: "border-[#D5DFF0]",
    title: "text-[#6B82C0]",
    soft: "bg-[#EEF2F9] text-[#6B82C0]",
    card: "bg-[#F5F8FD]",
  },
  purple: {
    bar: "border-l-[#B8A5D9]",
    border: "border-[#DFD6F0]",
    title: "text-[#9B88C4]",
    soft: "bg-[#F3F0F9] text-[#9B88C4]",
    card: "bg-[#FAF8FD]",
  },
  green: {
    bar: "border-l-[#9EC697]",
    border: "border-[#D8E8D3]",
    title: "text-[#7AAF75]",
    soft: "bg-[#EEF6E9] text-[#7AAF75]",
    card: "bg-[#F6FAF3]",
  },
  gray: {
    bar: "border-l-[#D1CCC8]",
    border: "border-[#E9E6E2]",
    title: "text-[#8B8784]",
    soft: "bg-[#F5F3F1] text-[#8B8784]",
    card: "bg-[#F9F7F5]",
  },
} as const;

export const statusClasses: Record<string, string> = {
  PENDING: "bg-[#F9ECE6] text-[#C17A5D]",
  CONFIRMED: "bg-[#EEF6E9] text-[#7AAF75]",
  IN_PROGRESS: "bg-[#EEF6E9] text-[#7AAF75]",
  COMPLETED: "bg-[#F5F3F1] text-[#8B8784]",
  CANCELLED: "bg-[#FAE8E8] text-[#C77A7A]",
  ACCEPTED: "bg-[#EEF6E9] text-[#7AAF75]",
  REJECTED: "bg-[#F5F3F1] text-[#8B8784]",
  WITHDRAWN: "bg-[#F5F3F1] text-[#8B8784]",
  OPEN: "bg-[#EEF6E9] text-[#7AAF75]",
  AWARDED: "bg-[#F3F0F9] text-[#9B88C4]",
  CLOSED: "bg-[#F5F3F1] text-[#8B8784]",
};
