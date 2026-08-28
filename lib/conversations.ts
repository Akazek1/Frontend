import api from "@/lib/axios";

export type ConversationType = "BOOKING" | "AGENCY_INQUIRY" | "COMPANY_INQUIRY" | "DIRECT";

/** One row in the unified inbox — any persona pairing, any context. */
export interface ConversationSummary {
  id: string;
  /** Where the messages live: unified store, or a legacy booking thread. */
  kind: "CONVERSATION" | "BOOKING";
  type: ConversationType;
  title: string;
  avatarUrl: string | null;
  lastMessage: { content: string; createdAt: string; mine: boolean; isRead: boolean; isDelivered: boolean } | null;
  unreadCount: number;
  updatedAt: string;
  bookingId?: string | null;
  inquiryId?: string | null;
  /** The other party — lets any inbox render presence + a verified badge. */
  otherUserId?: string | null;
  otherOrgId?: string | null;
  otherIsVerified?: boolean;
}

export interface ConversationMessage {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  senderUserId: string | null;
  senderOrgId: string | null;
  senderUser?: { id: string; firstName: string | null; lastName: string | null; profilePicture: string | null } | null;
  senderOrg?: { id: string; name: string; logoUrl: string | null } | null;
}

export interface ConversationCapabilities {
  canSend: boolean;
  closedReason: string;
  canReact: boolean;
  canReply: boolean;
  canEdit: boolean;
  review: { target: string; targetId: string | null } | null;
  contextAction: { kind: "BOOKING" | "INQUIRY"; id: string } | null;
  viewerRole: "EMPLOYER" | "PROVIDER" | "AGENCY" | "COMPANY";
  /** The worker an agency/company thread is about, when there is one. */
  subjectName: string | null;
}

export interface ConversationThread {
  id: string;
  type: ConversationType;
  bookingId: string | null;
  inquiryId: string | null;
  messages: ConversationMessage[];
  /** Stable key for the viewer, e.g. "user:<id>" or "org:<id>". */
  me: string;
  other: { title: string; avatarUrl: string | null; userId: string | null; orgId: string | null } | null;
  /** Per-type rules resolved server-side (closing, review, viewer role). */
  capabilities?: ConversationCapabilities;
}

function unwrap<T>(res: { data: any }): T {
  return (res.data?.data ?? res.data) as T;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const res = await api.get("/conversations");
  const data = unwrap<ConversationSummary[]>(res);
  return Array.isArray(data) ? data : [];
}

export async function getConversation(id: string): Promise<ConversationThread> {
  return unwrap<ConversationThread>(await api.get(`/conversations/${id}`));
}

export async function sendConversationMessage(id: string, content: string, replyToId?: string) {
  return unwrap<ConversationMessage>(await api.post(`/conversations/${id}/messages`, { content, replyToId }));
}

export async function markConversationRead(id: string) {
  return api.post(`/conversations/${id}/read`).catch(() => undefined);
}

/** Is this message mine? Works for both user and org viewers. */
export function isMine(msg: ConversationMessage, me: string): boolean {
  return me.startsWith("org:") ? `org:${msg.senderOrgId}` === me : `user:${msg.senderUserId}` === me;
}

/**
 * Adapt a ConversationMessage into the shape the chat UI renders (which was
 * modelled on the booking `Message`). Without this, `replyTo.sender.firstName`
 * and `reaction.user` are undefined and the room crashes on render.
 */
export function toChatMessage(m: any): any {
  if (!m) return m;
  const personFrom = (user: any, org: any) =>
    org
      ? { id: org.id, firstName: org.name, lastName: "", profilePicture: org.logoUrl ?? null }
      : user ?? { id: "", firstName: "", lastName: "", profilePicture: null };

  return {
    ...m,
    senderId: m.senderOrgId ?? m.senderUserId ?? m.senderOrg?.id ?? m.senderUser?.id ?? "",
    sender: personFrom(m.senderUser, m.senderOrg),
    replyTo: m.replyTo
      ? {
          ...m.replyTo,
          senderId: m.replyTo.senderOrg?.id ?? m.replyTo.senderUser?.id ?? "",
          sender: personFrom(m.replyTo.senderUser, m.replyTo.senderOrg),
        }
      : undefined,
    reactions: (m.reactions ?? []).map((r: any) => ({
      id: r.id,
      emoji: r.emoji,
      userId: r.orgId ?? r.userId ?? "",
      user: { id: r.orgId ?? r.userId ?? "", firstName: "", lastName: "", profilePicture: null },
    })),
  };
}
