"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import api from "@/lib/axios";
import type { RootState } from "@/store";
import { useSelector } from "react-redux";
import { Check, CheckCheck, ChevronRight, MessageCircle } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
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

const INQUIRY_PILL: Record<string, { label: string; pill: string; bar: string }> = {
  PENDING: { label: "Inquiry sent", pill: "bg-orange-50 text-orange-600", bar: "bg-orange-400" },
  TALKING: { label: "In conversation", pill: "bg-blue-50 text-blue-600", bar: "bg-blue-500" },
  HANDED_OVER: { label: "Awaiting worker", pill: "bg-amber-50 text-amber-600", bar: "bg-amber-400" },
};

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

      socket.on("connect", checkAllPresence);
      if (socket.connected) checkAllPresence();

      socket.on("newMessage", handleNewMessage);
      socket.on("messagesDelivered", handleMessagesDelivered);
      socket.on("messagesRead", handleMessagesRead);
      socket.on("userOnline", handleUserOnline);
      socket.on("userOffline", handleUserOffline);
      socket.on("presenceReady", handlePresenceReady);

      return () => {
        socket.off("connect", checkAllPresence);
        socket.off("newMessage", handleNewMessage);
        socket.off("messagesDelivered", handleMessagesDelivered);
        socket.off("messagesRead", handleMessagesRead);
        socket.off("userOnline", handleUserOnline);
        socket.off("userOffline", handleUserOffline);
        socket.off("presenceReady", handlePresenceReady);
      };
    }
  }, [token, user?.id]);

  // Report global counts (independent of the active tab) to the parent so the
  // tab badges stay accurate.
  useEffect(() => {
    if (!onCounts) return;
    const active = bookings.filter((b) => !isArchived(b.status));
    onCounts({
      all: active.length,
      read: active.filter(
        (b) => b.latestMessage && !isUnreadByMe(b.latestMessage, user?.id),
      ).length,
      unread: active.filter((b) => isUnreadByMe(b.latestMessage, user?.id)).length,
      archive: bookings.filter((b) => isArchived(b.status)).length,
      archiveReviewPending: bookings.filter(
        (b) => isArchived(b.status) && b.reviewPending,
      ).length,
    });
  }, [bookings, user?.id, onCounts]);

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    const tab = currentTab.toLowerCase();
    const tabFiltered = bookings.filter((booking) => {
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
  }, [bookings, currentTab, searchQuery, user?.id]);

  const formatTimestamp = (isoDate: string): string => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "";

    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return t("justNow");
    if (minutes < 60) return t("minutesAgo", { minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("hoursAgo", { hours });
    const days = Math.floor(hours / 24);
    if (days === 1) return t("yesterday");
    if (days < 7) return t("daysAgo", { days });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="w-full">
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-[96px] animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const msg = booking.latestMessage;
            const partner = booking.partner;
            if (!partner) return null;

            const displayName = `${partner.firstName || t("unknownFallback")} ${partner.lastName || ""}`.trim();
            const initials = `${partner.firstName?.[0] || ""}${partner.lastName?.[0] || ""}` || "AK";
            const isUnreadByMe = Boolean(msg && msg.senderId !== user?.id && !msg.isRead);
            const status = getStatusConfig(booking.status, t);
            const fallbackTime = booking.updatedAt || booking.createdAt || new Date().toISOString();
            const previewText =
              msg?.content ||
              (booking.status === BOOKING_STATUS.COMPLETED
                ? t("jobCompletedReadOnly")
                : t("bookingClosedReadOnly"));
            return (
              <button
                key={booking.bookingId}
                type="button"
                className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white py-3 pl-4 pr-2 text-left shadow-sm transition-colors hover:bg-gray-50"
                onClick={() => router.push(`/conversations/inbox/${booking.bookingId}`)}
              >
                {/* Status accent bar */}
                <span className={`absolute left-0 top-0 h-full w-1.5 ${status.bar}`} />

                <span className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={partner.profilePicture || ""} className="object-cover" />
                    <AvatarFallback className="bg-surface text-[13px] font-bold text-brand">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white shadow-sm ${presenceMap[partner.id] ? "bg-green-500" : "bg-gray-300"}`} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1">
                      <span className="block truncate text-[15px] font-bold text-ink">
                        {displayName}
                      </span>
                      {partner.isVerified ? <VerifiedBadge size={14} /> : null}
                    </span>
                    <span className="text-[11px] font-medium text-[#9E9E9E]">{formatTimestamp(msg?.createdAt || fallbackTime)}</span>
                  </span>

                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="block truncate text-[12.5px] font-semibold text-brand">
                      {booking.service?.category?.name || t("bookingFallback")}
                    </span>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${status.pill}`}>
                      {status.label}
                    </span>
                  </span>

                  <span className="mt-1 flex items-end justify-between gap-2">
                    <span className={`block truncate text-[12px] leading-5 ${isUnreadByMe ? "font-bold text-ink" : "text-ink-muted"}`}>
                      {previewText}
                    </span>
                    <span className="flex flex-shrink-0 items-center gap-1.5">
                      {msg && msg.senderId === user?.id &&
                        (msg.isRead ? (
                          <CheckCheck className="h-3.5 w-3.5 text-[#34B7F1]" />
                        ) : msg.isDelivered ? (
                          <CheckCheck className="h-3.5 w-3.5 text-[#9E9E9E]" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-[#9E9E9E]" />
                        ))}
                      {booking.unreadCount && booking.unreadCount > 0 ? (
                        <span className="min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                          {booking.unreadCount}
                        </span>
                      ) : booking.reviewPending ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          {t("review")}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </span>

                <ChevronRight className="h-5 w-5 flex-shrink-0 self-center text-gray-300" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
            <MessageCircle className="h-7 w-7 text-brand" />
          </span>
          <h3 className="mt-4 text-[15px] font-bold text-ink">
            {currentTab === "Archive" ? t("nothingArchivedYet") : t("noMessagesFound")}
          </h3>
          <p className="mt-1 max-w-[260px] text-[12px] leading-5 text-ink-muted">
            {currentTab === "Archive"
              ? t("archiveEmptyDesc")
              : t("searchEmptyDesc")}
          </p>
        </div>
      )}
    </div>
  );
}
