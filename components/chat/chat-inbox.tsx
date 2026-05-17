"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import api from "@/lib/axios";
import type { RootState } from "@/store";
import { useSelector } from "react-redux";
import { CalendarDays, Check, CheckCheck, MessageCircle, ShieldCheck, Clock } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { BOOKING_STATUS } from "@/constant";

import { initializeSocket, getSocket } from "@/lib/socket";

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
}

export default function ChatInbox({ searchQuery }: ChatInboxProps) {
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
      
      // Batch check initial presence
      if (nextBookings.length > 0) {
         const socket = getSocket();
         if (socket && socket.connected) {
           nextBookings.forEach(b => {
             socket.emit("checkPresence", b.partner.id, (res: { isOnline: boolean }) => {
               setPresenceMap(prev => ({ ...prev, [b.partner.id]: res.isOnline }));
             });
           });
         }
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
       
       socket.on("newMessage", (message: Message) => {
         setBookings((prev) => {
           const existingIdx = prev.findIndex(b => b.bookingId === message.bookingId);
           
           if (existingIdx !== -1) {
             const updated = [...prev];
             const booking = { ...updated[existingIdx] };
             booking.latestMessage = message;
             
             if (message.senderId !== user?.id) {
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
       });

       socket.on("messagesDelivered", (data: { bookingId: string }) => {
         setBookings((prev) => 
           prev.map(b => (b.bookingId === data.bookingId && b.latestMessage?.senderId === user?.id) 
             ? { ...b, latestMessage: { ...b.latestMessage!, isDelivered: true } } 
             : b
           )
         );
       });

       socket.on("messagesRead", (data: { bookingId: string, readerId: string }) => {
         if (data.readerId !== user?.id) {
           setBookings((prev) => 
             prev.map(b => b.bookingId === data.bookingId 
               ? { ...b, latestMessage: { ...b.latestMessage!, isRead: true, isDelivered: true } } 
               : b
             )
           );
         }
       });

       socket.on("userOnline", (userId: string) => {
         setPresenceMap(prev => ({ ...prev, [userId]: true }));
       });

       socket.on("userOffline", (userId: string) => {
         setPresenceMap(prev => ({ ...prev, [userId]: false }));
       });

       return () => {
         socket.off("newMessage");
         socket.off("messagesDelivered");
         socket.off("messagesRead");
         socket.off("userOnline");
         socket.off("userOffline");
       };
    }
  }, [token, user?.id]);

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    
    const tabFiltered = bookings.filter((booking) => {
      if (currentTab.toLowerCase() === "read") return booking.latestMessage?.isRead === true;
      if (currentTab.toLowerCase() === "unread") return booking.latestMessage?.isRead === false && booking.latestMessage?.senderId !== user?.id;
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

    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-[#1B2431]">
          {currentTab === "All" ? "Recent conversations" : `${currentTab} conversations`}
        </p>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#616161]">
          {filteredBookings.length} chat{filteredBookings.length === 1 ? "" : "s"}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-[86px] animate-pulse rounded-2xl bg-white" />
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

            return (
              <button
                key={booking.bookingId}
                type="button"
                className="flex w-full gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-colors hover:bg-gray-50"
                onClick={() => router.push(`/conversations/inbox/${booking.bookingId}`)}
              >
                <span 
                  className="relative flex-shrink-0"
                  onClick={(e) => {
                    if (partner.username) {
                      e.stopPropagation();
                      router.push(`/${partner.username.replace(/^@/, "")}`);
                    }
                  }}
                >
                  <Avatar className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarImage src={partner.profilePicture || ""} className="object-cover" />
                    <AvatarFallback className="bg-[#F1FCEF] text-[13px] font-bold text-[#145B10]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {presenceMap[partner.id] && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 min-w-0">
                        <span 
                          onClick={(e) => {
                            if (partner.username) {
                              e.stopPropagation();
                              router.push(`/${partner.username.replace(/^@/, "")}`);
                            }
                          }}
                          className="block truncate text-[14px] font-bold text-[#1B2431] hover:text-[#145B10] cursor-pointer"
                        >
                          {displayName}
                        </span>
                        {partner.isVerified ? <VerifiedBadge size={14} /> : null}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-[#757575]">
                        <CalendarDays className="h-3 w-3" />
                        {booking.service?.title || "Booking"}
                        <span className="mx-1">•</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          booking.status === BOOKING_STATUS.PENDING ? 'bg-orange-50 text-orange-600' :
                          booking.status === BOOKING_STATUS.CONFIRMED ? 'bg-blue-50 text-blue-600' :
                          booking.status === BOOKING_STATUS.IN_PROGRESS ? 'bg-green-50 text-green-600' :
                          booking.status === BOOKING_STATUS.COMPLETED ? 'bg-gray-100 text-gray-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {booking.status}
                        </span>
                      </span>
                    </span>
                    <span className="flex flex-shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[10px] font-semibold text-[#9E9E9E]">{formatTimestamp(msg.createdAt)}</span>
                      {booking.unreadCount && booking.unreadCount > 0 ? (
                        <span className="min-w-5 rounded-full bg-[#145B10] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                          {booking.unreadCount}
                        </span>
                      ) : msg.senderId === user?.id && (
                        msg.isRead ? (
                          <CheckCheck className="h-3.5 w-3.5 text-[#34B7F1]" />
                        ) : msg.isDelivered ? (
                          <CheckCheck className="h-3.5 w-3.5 text-[#9E9E9E]" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-[#9E9E9E]" />
                        )
                      )}
                    </span>
                  </span>

                  <span className={`mt-1 block truncate text-[12px] leading-5 ${isUnreadByMe ? "font-bold text-[#1B2431]" : "text-[#616161]"}`}>
                    {msg.content}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F1FCEF]">
            <MessageCircle className="h-7 w-7 text-[#145B10]" />
          </span>
          <h3 className="mt-4 text-[15px] font-bold text-[#1B2431]">No messages found</h3>
          <p className="mt-1 max-w-[260px] text-[12px] leading-5 text-[#616161]">
            Try a different search term or switch to another message filter.
          </p>
        </div>
      )}
    </div>
  );
}
