"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listConversations, type ConversationSummary } from "@/lib/conversations";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import api from "@/lib/axios";
import type { RootState } from "@/store";
import { useSelector } from "react-redux";
import {
  ConversationEmpty,
  ConversationRow,
  ConversationRowSkeleton,
  type ConversationRowData,
} from "./conversation-row";
import { BOOKING_STATUS } from "@/constant";
import type { InboxCounts } from "./index";

import { initializeSocket, getSocket } from "@/lib/socket";

const ARCHIVED_STATUSES: string[] = [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED];

const isArchived = (status: string) => ARCHIVED_STATUSES.includes(status);

// A conversation is "unread" only when the latest message is FROM the partner
// and I haven't read it. Anything else I've sent or already read counts as
// "read" — independent of whether the partner has read my last message.
const isUnreadByMe = (latest: Message | undefined, myId?: string) =>
  Boolean(latest && latest.senderId !== myId && !latest.isRead);

const getStatusConfig = (status: string, t: (key: string) => string): { label: string; pill: string; bar: string } => {
  switch (status) {
    case BOOKING_STATUS.PENDING:
      return { label: t("statusPending"), pill: "bg-orange-50 text-orange-600", bar: "bg-orange-400" };
    case BOOKING_STATUS.CONFIRMED:
      return { label: t("statusConfirmed"), pill: "bg-blue-50 text-blue-600", bar: "bg-blue-500" };
    case BOOKING_STATUS.IN_PROGRESS:
      return { label: t("statusActive"), pill: "bg-amber-50 text-amber-600", bar: "bg-amber-400" };
    case BOOKING_STATUS.COMPLETED:
      return { label: t("statusCompleted"), pill: "bg-gray-100 text-gray-600", bar: "bg-[#9C8BD6]" };
    case BOOKING_STATUS.CANCELLED:
      return { label: t("statusCancelled"), pill: "bg-red-50 text-red-600", bar: "bg-red-400" };
    default:
      return { label: status, pill: "bg-gray-100 text-gray-600", bar: "bg-gray-300" };
  }
};

interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  isDelivered: boolean;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Booking {
  bookingId: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  service: {
    id: string;
    category?: { name?: string };
  };
  partner: {
    id: string;
    username?: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isVerified?: boolean;
  };
  latestMessage?: Message;
  unreadCount?: number;
  reviewPending?: boolean;
  // Agency inquiry conversations (employer ↔ agency) are surfaced here too.
  isInquiry?: boolean;
  inquiryId?: string;
  preview?: string;
}

interface ChatInboxProps {
  searchQuery: string;
  onCounts?: (counts: InboxCounts) => void;
}

// Fetch + sort the conversation list. Kept pure (no presence side effects) so it
// can back a cached React Query; presence checks run in the seed effect below.
async function fetchConversations(): Promise<Booking[]> {
  const response = await api.get<{ data: Booking[] }>("/bookings");
  return Array.isArray(response.data.data)
    ? response.data.data
        .filter((booking) => booking.latestMessage || isArchived(booking.status))
        .sort((a, b) => {
          const aTime = new Date(a.latestMessage?.createdAt || a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.latestMessage?.createdAt || b.updatedAt || b.createdAt || 0).getTime();
          return bTime - aTime;
        })
    : [];
}

/**
 * Unified conversations (agency / company / …) mapped into the row shape this
 * inbox already renders, so every chat lives on one page. Booking rows are
 * untouched — they still come from `fetchConversations()` above.
 */
async function fetchUnifiedConversations(currentUserId?: string): Promise<Booking[]> {
  const rows = await listConversations().catch(() => [] as ConversationSummary[]);
  return rows
    .filter((c) => c.kind === "CONVERSATION")
    .map((c) => ({
      bookingId: c.id,
      status: "CONFIRMED",
      createdAt: c.updatedAt,
      updatedAt: c.updatedAt,
      service: { id: c.id, category: { name: undefined } },
      partner: {
        id: c.id,
        firstName: c.title,
        lastName: "",
        profilePicture: c.avatarUrl ?? undefined,
      },
      latestMessage: c.lastMessage
        ? ({
            id: `${c.id}-last`,
            content: c.lastMessage.content,
            createdAt: c.lastMessage.createdAt,
            senderId: c.lastMessage.mine ? currentUserId ?? "" : c.id,
            // The message's OWN state — `unreadCount` is the viewer's unread
            // tally, so using it here showed blue ticks in the inbox while the
            // room (reading the real value) showed a single tick.
            isRead: c.lastMessage.isRead,
            isDelivered: c.lastMessage.isDelivered,
          } as Message)
        : undefined,
      unreadCount: c.unreadCount,
      isInquiry: true,
      inquiryId: c.inquiryId ?? undefined,
    }));
}

export default function ChatInbox({ searchQuery, onCounts }: ChatInboxProps) {
  const t = useTranslations("chatInbox");
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "All";
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
  const { user, token } = useSelector((state: RootState) => state.auth);

  // Cached conversation list — returning to Messages renders instantly, no
  // spinner. Socket events below keep `bookings` live after the seed.
  // Agency / company threads, fetched separately so the booking query above is
  // untouched. Merged into one list for rendering.
  const { data: unifiedData, refetch: refetchUnified } = useQuery({
    queryKey: ["unified-conversations", user?.id],
    queryFn: () => fetchUnifiedConversations(user?.id),
    enabled: Boolean(token),
    staleTime: 15_000,
  });

  const { data: conversationsData, isLoading: loading, refetch } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: fetchConversations,
    enabled: Boolean(token),
    // Conversations change constantly via sockets; keep the cache short so a
    // background revisit still refreshes, but the cached list shows first.
    staleTime: 15_000,
  });
  // Stable handle so socket callbacks can trigger a refetch without
  // re-subscribing the listeners on every render.
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const refetchUnifiedRef = useRef(refetchUnified);
  refetchUnifiedRef.current = refetchUnified;

  // Seed local state from the cached/fetched list, then check presence for all
  // partners (handles the case where the socket connected before data arrived).
  useEffect(() => {
    if (!conversationsData) return;
    setBookings(conversationsData);
    const sock = getSocket();
    if (sock?.connected && conversationsData.length > 0) {
      conversationsData.forEach((b) => {
        sock.emit("checkPresence", b.partner.id, (res: { isOnline: boolean }) => {
          setPresenceMap((prev) => ({ ...prev, [b.partner.id]: res.isOnline }));
        });
      });
    }
  }, [conversationsData]);

  useEffect(() => {
    if (!token) {
      setBookings([]);
      return;
    }

    // Setup real-time listeners for the inbox
    if (user?.id) {
      const socket = initializeSocket(token, user.id);

      const handleNewMessage = (message: Message) => {
        setBookings((prev) => {
          const existingIdx = prev.findIndex((b) => b.bookingId === message.bookingId);
          if (existingIdx !== -1) {
            const updated = [...prev];
            const booking = { ...updated[existingIdx] };
            const isSameLatestMessage = booking.latestMessage?.id === message.id;
            booking.latestMessage = message;
            if (message.senderId !== user?.id && !isSameLatestMessage) {
              booking.unreadCount = (booking.unreadCount || 0) + 1;
            }
            updated[existingIdx] = booking;
            return updated.sort((a, b) => {
              const aTime = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : 0;
              const bTime = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : 0;
              return bTime - aTime;
            });
          } else {
            // Brand-new conversation we don't have yet — pull the fresh list.
            void refetchRef.current();
            return prev;
          }
        });
      };

      const handleMessagesDelivered = (data: { bookingId: string }) => {
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingId === data.bookingId && b.latestMessage?.senderId === user?.id
              ? { ...b, latestMessage: { ...b.latestMessage!, isDelivered: true } }
              : b,
          ),
        );
      };

      const handleMessagesRead = (data: { bookingId: string; readerId: string }) => {
        setBookings((prev) =>
          prev.map((b) => {
            if (b.bookingId !== data.bookingId) return b;

            if (data.readerId === user?.id) {
              return { ...b, unreadCount: 0 };
            }

            if (b.latestMessage?.senderId === user?.id) {
              return {
                ...b,
                latestMessage: { ...b.latestMessage, isRead: true, isDelivered: true },
              };
            }

            return b;
          }),
        );
      };

      const handleUserOnline = (userId: string) => {
        setPresenceMap((prev) => ({ ...prev, [userId]: true }));
      };

      const handleUserOffline = (userId: string) => {
        setPresenceMap((prev) => ({ ...prev, [userId]: false }));
      };

      const handlePresenceReady = (data: { onlineUserIds?: string[] }) => {
        if (!Array.isArray(data.onlineUserIds)) {
          checkAllPresence();
          return;
        }

        setBookings((current) => {
          setPresenceMap((prev) => {
            const next = { ...prev };
            current.forEach((b) => {
              next[b.partner.id] = data.onlineUserIds!.includes(b.partner.id);
            });
            return next;
          });
          return current;
        });
      };

      // Check presence for all current bookings — works whether socket is
      // already connected or just about to connect.
      const checkAllPresence = () => {
        setBookings((current) => {
          current.forEach((b) => {
            socket.emit("checkPresence", b.partner.id, (res: { isOnline: boolean }) => {
              setPresenceMap((prev) => ({ ...prev, [b.partner.id]: res.isOnline }));
            });
          });
          return current;
        });
      };

      // Unified (agency / company) rows come from their own query, so the
      // booking events above never touch them: without these their preview,
      // unread badge and read ticks only moved on a full page reload.
      const refreshUnified = () => { void refetchUnifiedRef.current(); };

      socket.on("connect", checkAllPresence);
      if (socket.connected) checkAllPresence();

      socket.on("newMessage", handleNewMessage);
      socket.on("conversationMessage", refreshUnified);
      socket.on("conversationRead", refreshUnified);
      socket.on("messagesDelivered", handleMessagesDelivered);
      socket.on("messagesRead", handleMessagesRead);
      socket.on("userOnline", handleUserOnline);
      socket.on("userOffline", handleUserOffline);
      socket.on("presenceReady", handlePresenceReady);

      return () => {
        socket.off("connect", checkAllPresence);
        socket.off("newMessage", handleNewMessage);
        socket.off("conversationMessage", refreshUnified);
        socket.off("conversationRead", refreshUnified);
        socket.off("messagesDelivered", handleMessagesDelivered);
        socket.off("messagesRead", handleMessagesRead);
        socket.off("userOnline", handleUserOnline);
        socket.off("userOffline", handleUserOffline);
        socket.off("presenceReady", handlePresenceReady);
      };
    }
  }, [token, user?.id]);

  // One list: booking threads + unified conversations, newest first.
  const allThreads = useMemo(() => {
    const merged = [...bookings, ...(unifiedData ?? [])];
    return merged.sort((a, b) => {
      const at = new Date(a.latestMessage?.createdAt || a.updatedAt || a.createdAt || 0).getTime();
      const bt = new Date(b.latestMessage?.createdAt || b.updatedAt || b.createdAt || 0).getTime();
      return bt - at;
    });
  }, [bookings, unifiedData]);

  // Report global counts (independent of the active tab) to the parent so the
  // tab badges stay accurate.
  useEffect(() => {
    if (!onCounts) return;
    const active = allThreads.filter((b) => !isArchived(b.status));
    onCounts({
      all: active.length,
      read: active.filter(
        (b) => b.latestMessage && !isUnreadByMe(b.latestMessage, user?.id),
      ).length,
      unread: active.filter((b) => isUnreadByMe(b.latestMessage, user?.id)).length,
      archive: allThreads.filter((b) => isArchived(b.status)).length,
      archiveReviewPending: allThreads.filter(
        (b) => isArchived(b.status) && b.reviewPending,
      ).length,
    });
  }, [allThreads, user?.id, onCounts]);

  const filteredBookings = useMemo(() => {
    if (!allThreads) return [];

    const tab = currentTab.toLowerCase();
    const tabFiltered = allThreads.filter((booking) => {
      const archived = isArchived(booking.status);
      if (tab === "archive") return archived;
      if (archived) return false;
      if (tab === "read") return Boolean(booking.latestMessage) && !isUnreadByMe(booking.latestMessage, user?.id);
      if (tab === "unread") return isUnreadByMe(booking.latestMessage, user?.id);
      return true;
    });

    const query = searchQuery.trim().toLowerCase();
    const searchFiltered = query
      ? tabFiltered.filter((booking) => {
          const partner = booking.partner;
          if (!partner) return false;
          const name = `${partner.firstName} ${partner.lastName}`.toLowerCase();
          return (
            name.includes(query) ||
            booking.service?.category?.name?.toLowerCase().includes(query) ||
            booking.latestMessage?.content.toLowerCase().includes(query)
          );
        })
      : tabFiltered;

    return searchFiltered;
  }, [allThreads, currentTab, searchQuery, user?.id]);

  return (
    <div className="w-full">
      {loading ? (
        <ConversationRowSkeleton />
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const msg = booking.latestMessage;
            const partner = booking.partner;
            if (!partner) return null;

            const status = getStatusConfig(booking.status, t);
            const mine = Boolean(msg && msg.senderId === user?.id);
            const row: ConversationRowData = {
              id: booking.bookingId,
              name: `${partner.firstName || t("unknownFallback")} ${partner.lastName || ""}`.trim(),
              avatarUrl: partner.profilePicture,
              isVerified: partner.isVerified,
              isOnline: Boolean(presenceMap[partner.id]),
              label: booking.isInquiry
                ? t("agencyConversation")
                : booking.service?.category?.name || t("bookingFallback"),
              // Agency threads have no booking lifecycle, so no status pill.
              pill: booking.isInquiry ? null : { label: status.label, className: status.pill },
              accentClassName: status.bar,
              timestamp: msg?.createdAt || booking.updatedAt || booking.createdAt || new Date().toISOString(),
              preview:
                msg?.content ||
                (booking.isInquiry
                  ? t("noMessagesYet")
                  : booking.status === BOOKING_STATUS.COMPLETED
                    ? t("jobCompletedReadOnly")
                    : t("bookingClosedReadOnly")),
              isUnread: Boolean(msg && msg.senderId !== user?.id && !msg.isRead),
              ownReceipt: mine ? (msg!.isRead ? "read" : msg!.isDelivered ? "delivered" : "sent") : null,
              unreadCount: booking.unreadCount,
              reviewPending: booking.reviewPending,
            };

            return (
              <ConversationRow
                key={booking.bookingId}
                data={row}
                onClick={() =>
                  router.push(
                    booking.isInquiry
                      ? `/conversations/thread/${booking.bookingId}`
                      : `/conversations/inbox/${booking.bookingId}`,
                  )
                }
              />
            );
          })}
        </div>
      ) : (
        <ConversationEmpty
          title={currentTab === "Archive" ? t("nothingArchivedYet") : t("noMessagesFound")}
          hint={currentTab === "Archive" ? t("archiveEmptyDesc") : t("searchEmptyDesc")}
        />
      )}
    </div>
  );
}
