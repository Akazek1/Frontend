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

export function inquiryStatusMap(
  t: (key: string) => string,
): Record<InquiryStatus, { label: string; tone: "amber" | "blue" | "green" | "gray" }> {
  return {
    PENDING: { label: t("statusNew"), tone: "amber" },
    TALKING: { label: t("statusInConversation"), tone: "blue" },
    HANDED_OVER: { label: t("statusAwaitingWorker"), tone: "amber" },
    CONVERTED: { label: t("statusPlaced"), tone: "green" },
    DECLINED: { label: t("statusDeclined"), tone: "gray" },
    CLOSED: { label: t("statusClosed"), tone: "gray" },
  };
}

export function inquiryPersonName(
  p: { firstName: string | null; lastName: string | null } | null | undefined,
  t: (key: string) => string,
) {
  if (!p) return t("unknownName");
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || t("unknownName");
}
