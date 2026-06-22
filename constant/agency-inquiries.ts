export type InquiryStatus = "PENDING" | "TALKING" | "HANDED_OVER" | "CONVERTED" | "DECLINED" | "CLOSED";

export interface InquiryPerson {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  isVerified?: boolean;
  phoneNumber?: string | null;
  email?: string | null;
  createdAt?: string | null;
}

export interface AgencyInquiry {
  id: string;
  status: InquiryStatus;
  note: string;
  bookingId: string | null;
  createdAt: string;
  updatedAt: string;
  agency?: { id: string; name: string; logoUrl: string | null; verified: boolean; ownerId?: string };
  employer: InquiryPerson;
  workerOfInterest: InquiryPerson | null;
  handoverWorker: InquiryPerson | null;
  messages?: InquiryMessage[];
}

export interface InquiryMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: InquiryPerson;
}

export const INQUIRY_STATUS: Record<InquiryStatus, { label: string; tone: "amber" | "blue" | "green" | "gray" }> = {
  PENDING: { label: "New", tone: "amber" },
  TALKING: { label: "In conversation", tone: "blue" },
  HANDED_OVER: { label: "Awaiting worker", tone: "amber" },
  CONVERTED: { label: "Placed", tone: "green" },
  DECLINED: { label: "Declined", tone: "gray" },
  CLOSED: { label: "Closed", tone: "gray" },
};

export function inquiryPersonName(p: { firstName: string | null; lastName: string | null } | null | undefined) {
  if (!p) return "Unknown";
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unknown";
}
