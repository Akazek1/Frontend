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
  addresses?: { city: string | null; district: string | null; sector: string | null; isDefault?: boolean }[];
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
  /** Unified conversation backing this inquiry's chat. */
  conversation?: { id: string } | null;
}

export interface InquiryMessage {
  id: string;
  // A message is sent by EITHER a User (senderId) OR the agency org (senderOrgId).
  senderId: string | null;
  senderOrgId?: string | null;
  content: string;
  createdAt: string;
  isRead?: boolean;
  sender?: InquiryPerson;
  senderOrg?: { id: string; name: string; logoUrl: string | null } | null;
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
