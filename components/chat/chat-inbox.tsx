"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import api from "@/lib/axios";
import type { RootState } from "@/store";
import { useSelector } from "react-redux";
import { CalendarDays, CheckCheck, MessageCircle, ShieldCheck } from "lucide-react";

interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Booking {
  userId?: string;
  bookingId: string;
  service: {
    id: string;
    title: string;
    providerId?: string;
    provider: {
      id?: string;
      firstName: string;
      lastName: string;
      profilePicture?: string;
    };
  };
  latestMessage?: Message;
  unreadCount?: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface ChatInboxProps {
  searchQuery: string;
}

const now = new Date();
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

const demoBookings: Booking[] = [
  {
    userId: "demo-user",
    bookingId: "demo-cleaning",
    service: {
      id: "service-cleaning",
      title: "Home cleaning",
      provider: {
        firstName: "Aline",
        lastName: "Uwase",
        profilePicture: "",
      },
    },
    user: { id: "demo-employer", firstName: "Grace", lastName: "Mutesi" },
    unreadCount: 2,
    latestMessage: {
      id: "msg-1",
      bookingId: "demo-cleaning",
      senderId: "demo-provider",
      content: "I can come tomorrow morning at 9:00. Please confirm the address.",
      createdAt: minutesAgo(8),
      isRead: false,
      sender: { id: "demo-provider", firstName: "Aline", lastName: "Uwase" },
    },
  },
  {
    userId: "demo-user",
    bookingId: "demo-nanny",
    service: {
      id: "service-nanny",
      title: "Child care",
      provider: {
        firstName: "Vestine",
        lastName: "Mukamana",
        profilePicture: "",
      },
    },
    user: { id: "demo-employer", firstName: "Eric", lastName: "Ndayisaba" },
    unreadCount: 0,
    latestMessage: {
      id: "msg-2",
      bookingId: "demo-nanny",
      senderId: "demo-user",
      content: "Thank you. I will prepare the task list before you arrive.",
      createdAt: minutesAgo(95),
      isRead: true,
      sender: { id: "demo-user", firstName: "You", lastName: "" },
    },
  },
  {
    userId: "demo-user",
    bookingId: "demo-electrician",
    service: {
      id: "service-electrician",
      title: "Electrical repair",
      provider: {
        firstName: "Jean",
        lastName: "Hirwa",
        profilePicture: "",
      },
    },
    user: { id: "demo-employer", firstName: "Patrick", lastName: "Karekezi" },
    unreadCount: 1,
    latestMessage: {
      id: "msg-3",
      bookingId: "demo-electrician",
      senderId: "demo-provider",
      content: "Please send a photo of the switch before I come.",
      createdAt: minutesAgo(1440),
      isRead: false,
      sender: { id: "demo-provider", firstName: "Jean", lastName: "Hirwa" },
    },
  },
];

export default function ChatInbox({ searchQuery }: ChatInboxProps) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "All";
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(demoBookings);
  const [loading, setLoading] = useState(false);
  const [usingDemoContent, setUsingDemoContent] = useState(true);
  const { token } = useSelector((state: RootState) => state.auth);
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? "demo-user");

  useEffect(() => {
    if (!token) {
      setBookings(demoBookings);
      setUsingDemoContent(true);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get<{ data: Booking[] }>("/bookings/chats", {
          withCredentials: true,
        });

        const nextBookings = Array.isArray(response.data.data)
          ? response.data.data.filter((booking) => booking.latestMessage)
          : [];

        if (nextBookings.length > 0) {
          setBookings(nextBookings);
          setUsingDemoContent(false);
        } else {
          setBookings(demoBookings);
          setUsingDemoContent(true);
        }
      } catch {
        setBookings(demoBookings);
        setUsingDemoContent(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const filteredBookings = useMemo(() => {
    const tabFiltered = bookings.filter((booking) => {
      if (currentTab.toLowerCase() === "read") return booking.latestMessage?.isRead === true;
      if (currentTab.toLowerCase() === "unread") return booking.latestMessage?.isRead === false;
      return true;
    });

    const query = searchQuery.trim().toLowerCase();
    const searchFiltered = query
      ? tabFiltered.filter((booking) => {
          const provider = booking.service.provider;
          const name = `${provider.firstName} ${provider.lastName}`.toLowerCase();
          return (
            name.includes(query) ||
            booking.service.title.toLowerCase().includes(query) ||
            booking.latestMessage?.content.toLowerCase().includes(query)
          );
        })
      : tabFiltered;

    return [...searchFiltered].sort((a, b) => {
      const aTime = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : 0;
      const bTime = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [bookings, currentTab, searchQuery]);

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
      {usingDemoContent && (
        <div className="rounded-2xl border border-[#145B10]/10 bg-white p-3 shadow-sm">
          <div className="flex gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F1FCEF]">
              <ShieldCheck className="h-4 w-4 text-[#145B10]" />
            </span>
            <div>
              <p className="text-[13px] font-bold text-[#1B2431]">Message preview</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#616161]">
                These sample conversations show how booking chat will feel before the backend chat list is connected.
              </p>
            </div>
          </div>
        </div>
      )}

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

            const provider = booking.service.provider;
            const displayName = `${provider.firstName} ${provider.lastName}`.trim();
            const initials = `${provider.firstName?.[0] || ""}${provider.lastName?.[0] || ""}` || "AK";
            const unread = (booking.unreadCount || 0) > 0 || !msg.isRead;

            return (
              <button
                key={booking.bookingId}
                type="button"
                className="flex w-full gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-colors hover:bg-gray-50"
                onClick={() => router.push(`/conversations/inbox/${booking.bookingId}`)}
              >
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={provider.profilePicture || ""} className="object-cover" />
                  <AvatarFallback className="bg-[#F1FCEF] text-[13px] font-bold text-[#145B10]">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-bold text-[#1B2431]">{displayName}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-[#757575]">
                        <CalendarDays className="h-3 w-3" />
                        {booking.service.title}
                      </span>
                    </span>
                    <span className="flex flex-shrink-0 flex-col items-end gap-1">
                      <span className="text-[10px] font-semibold text-[#9E9E9E]">{formatTimestamp(msg.createdAt)}</span>
                      {booking.unreadCount && booking.unreadCount > 0 ? (
                        <span className="min-w-5 rounded-full bg-[#145B10] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                          {booking.unreadCount}
                        </span>
                      ) : (
                        <CheckCheck className="h-3.5 w-3.5 text-[#9E9E9E]" />
                      )}
                    </span>
                  </span>

                  <span className={`mt-1 block truncate text-[12px] leading-5 ${unread ? "font-semibold text-[#1B2431]" : "text-[#616161]"}`}>
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
