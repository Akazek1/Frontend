"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const getStatusConfig = (status: string): { label: string; pill: string; bar: string } => {
  switch (status) {
    case BOOKING_STATUS.PENDING:
      return { label: "Awaiting response", pill: "bg-[#E6F4EA] text-[#1E7E34]", bar: "bg-[#34A853]" };
    case BOOKING_STATUS.CONFIRMED:
      return { label: "Confirmed", pill: "bg-blue-50 text-blue-600", bar: "bg-blue-500" };
    case BOOKING_STATUS.IN_PROGRESS:
      return { label: "Active", pill: "bg-amber-50 text-amber-600", bar: "bg-amber-400" };
    case BOOKING_STATUS.COMPLETED:
      return { label: "Completed", pill: "bg-gray-100 text-gray-600", bar: "bg-[#9C8BD6]" };
    case BOOKING_STATUS.CANCELLED:
      return { label: "Cancelled", pill: "bg-red-50 text-red-600", bar: "bg-red-400" };
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
  service: {
    id: string;
    title: string;
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
}

interface ChatInboxProps {
  searchQuery: string;
  onCounts?: (counts: InboxCounts) => void;
}

export default function ChatInbox({ searchQuery, onCounts }: ChatInboxProps) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "All";
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
  const { user, token } = useSelector((state: RootState) => state.auth);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ data: Booking[] }>("/bookings");

      const nextBookings = Array.isArray(response.data.data)
        ? response.data.data
            .filter((booking) => booking.latestMessage)
            .sort((a, b) => {
              const aTime = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : 0;
              const bTime = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : 0;
              return bTime - aTime;
            })
        : [];

      setBookings(nextBookings);

      // Check presence for all loaded partners now that we have the list.
      // The socket connect handler also does this, but only if bookings are
      // already loaded when the socket connects. This handles the opposite
      // case: socket was already connected before fetchData finished.
      const sock = getSocket();
      if (sock?.connected && nextBookings.length > 0) {
        nextBookings.forEach((b) => {
          sock.emit("checkPresence", b.partner.id, (res: { isOnline: boolean }) => {
            setPresenceMap((prev) => ({ ...prev, [b.partner.id]: res.isOnline }));
          });
        });
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setBookings([]);
      return;
    }

    fetchData();

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
            fetchData();
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
        if (data.readerId !== user?.id) {
          setBookings((prev) =>
            prev.map((b) =>
              b.bookingId === data.bookingId
                ? { ...b, latestMessage: { ...b.latestMessage!, isRead: true, isDelivered: true } }
                : b,
            ),
          );
        }
      };

      const handleUserOnline = (userId: string) => {
        setPresenceMap((prev) => ({ ...prev, [userId]: true }));
      };

      const handleUserOffline = (userId: string) => {
        setPresenceMap((prev) => ({ ...prev, [userId]: false }));
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

      return () => {
        socket.off("connect", checkAllPresence);
        socket.off("newMessage", handleNewMessage);
        socket.off("messagesDelivered", handleMessagesDelivered);
        socket.off("messagesRead", handleMessagesRead);
        socket.off("userOnline", handleUserOnline);
        socket.off("userOffline", handleUserOffline);
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
      read: active.filter((b) => b.latestMessage?.isRead === true).length,
      unread: active.filter(
        (b) => b.latestMessage?.isRead === false && b.latestMessage?.senderId !== user?.id,
      ).length,
      archive: bookings.filter((b) => isArchived(b.status)).length,
    });
  }, [bookings, user?.id, onCounts]);

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    const tab = currentTab.toLowerCase();
    const tabFiltered = bookings.filter((booking) => {
      const archived = isArchived(booking.status);
      if (tab === "archive") return archived;
      if (archived) return false;
      if (tab === "read") return booking.latestMessage?.isRead === true;
      if (tab === "unread") return booking.latestMessage?.isRead === false && booking.latestMessage?.senderId !== user?.id;
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
            booking.service?.title?.toLowerCase().includes(query) ||
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
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
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
            if (!msg) return null;

            const partner = booking.partner;
            if (!partner) return null;

            const displayName = `${partner.firstName || "Unknown"} ${partner.lastName || ""}`.trim();
            const initials = `${partner.firstName?.[0] || ""}${partner.lastName?.[0] || ""}` || "AK";
            const isUnreadByMe = msg.senderId !== user?.id && !msg.isRead;
            const status = getStatusConfig(booking.status);
            const goToProfile = (e: React.MouseEvent) => {
              if (partner.username) {
                e.stopPropagation();
                router.push(`/${partner.username.replace(/^@/, "")}`);
              }
            };

            return (
              <button
                key={booking.bookingId}
                type="button"
                className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white py-3 pl-4 pr-2 text-left shadow-sm transition-colors hover:bg-gray-50"
                onClick={() => router.push(`/conversations/inbox/${booking.bookingId}`)}
              >
                {/* Status accent bar */}
                <span className={`absolute left-0 top-0 h-full w-1.5 ${status.bar}`} />

                <span className="relative flex-shrink-0" onClick={goToProfile}>
                  <Avatar className="h-12 w-12 cursor-pointer transition-opacity hover:opacity-80">
                    <AvatarImage src={partner.profilePicture || ""} className="object-cover" />
                    <AvatarFallback className="bg-[#F1FCEF] text-[13px] font-bold text-[#145B10]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white shadow-sm ${presenceMap[partner.id] ? "bg-green-500" : "bg-gray-300"}`} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1">
                      <span
                        onClick={goToProfile}
                        className="block truncate text-[15px] font-bold text-[#1B2431] hover:text-[#145B10]"
                      >
                        {displayName}
                      </span>
                      {partner.isVerified ? <VerifiedBadge size={14} /> : null}
                    </span>
                    <span className="text-[11px] font-medium text-[#9E9E9E]">{formatTimestamp(msg.createdAt)}</span>
                  </span>

                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="block truncate text-[12.5px] font-semibold text-[#145B10]">
                      {booking.service?.title || "Booking"}
                    </span>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${status.pill}`}>
                      {status.label}
                    </span>
                  </span>

                  <span className="mt-1 flex items-end justify-between gap-2">
                    <span className={`block truncate text-[12px] leading-5 ${isUnreadByMe ? "font-bold text-[#1B2431]" : "text-[#616161]"}`}>
                      {msg.content}
                    </span>
                    <span className="flex flex-shrink-0 items-center gap-1.5">
                      {msg.senderId === user?.id &&
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
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F1FCEF]">
            <MessageCircle className="h-7 w-7 text-[#145B10]" />
          </span>
          <h3 className="mt-4 text-[15px] font-bold text-[#1B2431]">
            {currentTab === "Archive" ? "Nothing archived yet" : "No messages found"}
          </h3>
          <p className="mt-1 max-w-[260px] text-[12px] leading-5 text-[#616161]">
            {currentTab === "Archive"
              ? "Completed and cancelled conversations will appear here."
              : "Try a different search term or switch to another message filter."}
          </p>
        </div>
      )}
    </div>
  );
}
