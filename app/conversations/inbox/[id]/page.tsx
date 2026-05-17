"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackButtonHeader from "@/components/header/back-button-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/lib/axios";
import { Check, CheckCheck, Info, Loader2, Phone, Send } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { VerifiedBadge } from "@/components/ui/verified-badge";

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
  user?: {
    id?: string;
    firstName: string;
    lastName: string;
  };
  messages: Message[];
  id: string;
  service: {
    id: string;
    title: string;
    providerId?: string;
    provider: {
      username?: string;
      firstName: string;
      lastName: string;
      profilePicture?: string;
      isVerified?: boolean;
    };
  };
}

const now = new Date();
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

const demoConversations: Record<string, Booking> = {
  "demo-cleaning": {
    id: "demo-cleaning",
    userId: "demo-user",
    user: { id: "demo-user", firstName: "You", lastName: "" },
    service: {
      id: "service-cleaning",
      title: "Professional House Cleaning",
      provider: {
        username: "janviere",
        firstName: "Janviere",
        lastName: "Uwase",
        profilePicture: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400",
        isVerified: true,
      },
    },
    messages: [
      {
        id: "demo-cleaning-1",
        bookingId: "demo-cleaning",
        senderId: "demo-provider",
        content: "Hello, I received your cleaning request.",
        createdAt: minutesAgo(32),
        isRead: true,
        sender: { id: "demo-provider", firstName: "Janviere", lastName: "Uwase" },
      },
      {
        id: "demo-cleaning-2",
        bookingId: "demo-cleaning",
        senderId: "demo-user",
        content: "Thank you. The house is in Kacyiru. Morning works best.",
        createdAt: minutesAgo(18),
        isRead: true,
        sender: { id: "demo-user", firstName: "You", lastName: "" },
      },
      {
        id: "demo-cleaning-3",
        bookingId: "demo-cleaning",
        senderId: "demo-provider",
        content: "I can come tomorrow morning at 9:00. Please confirm the address.",
        createdAt: minutesAgo(8),
        isRead: false,
        sender: { id: "demo-provider", firstName: "Janviere", lastName: "Uwase" },
      },
    ],
  },
  "demo-fulltime": {
    id: "demo-fulltime",
    userId: "demo-user",
    user: { id: "demo-user", firstName: "You", lastName: "" },
    service: {
      id: "service-fulltime",
      title: "Full-Time House Helper",
      provider: {
        username: "claudine_h",
        firstName: "Claudine",
        lastName: "Iradukunda",
        profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
        isVerified: true,
      },
    },
    messages: [
      {
        id: "demo-fulltime-1",
        bookingId: "demo-fulltime",
        senderId: "demo-provider",
        content: "I have 4 years of experience with families. Happy to start next week.",
        createdAt: minutesAgo(130),
        isRead: true,
        sender: { id: "demo-provider", firstName: "Claudine", lastName: "Iradukunda" },
      },
      {
        id: "demo-fulltime-2",
        bookingId: "demo-fulltime",
        senderId: "demo-user",
        content: "Thank you. I will prepare the task list before you arrive.",
        createdAt: minutesAgo(95),
        isRead: true,
        sender: { id: "demo-user", firstName: "You", lastName: "" },
      },
    ],
  },
  "demo-plumbing": {
    id: "demo-plumbing",
    userId: "demo-user",
    user: { id: "demo-user", firstName: "You", lastName: "" },
    service: {
      id: "service-plumbing",
      title: "Plumbing Repairs & Installation",
      provider: {
        username: "yvette_p",
        firstName: "Yvette",
        lastName: "Uwamahoro",
        profilePicture: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400",
        isVerified: true,
      },
    },
    messages: [
      {
        id: "demo-plumbing-1",
        bookingId: "demo-plumbing",
        senderId: "demo-provider",
        content: "Please send a photo of the leak before I come over.",
        createdAt: minutesAgo(1440),
        isRead: false,
        sender: { id: "demo-provider", firstName: "Yvette", lastName: "Uwamahoro" },
      },
    ],
  },
};

const Conversation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [usingDemoContent, setUsingDemoContent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token, user } = useSelector((state: RootState) => state.auth);
  const currentUserId = user?.id || "demo-user";

  const router = useRouter();
  const participant = useMemo(() => {
    if (!booking) return { name: "Conversation", initials: "AK", service: "", username: undefined, isVerified: false, image: "" };
    const provider = booking.service.provider;
    const name = `${provider.firstName} ${provider.lastName}`.trim();
    return {
      name,
      initials: `${provider.firstName?.[0] || ""}${provider.lastName?.[0] || ""}` || "AK",
      service: booking.service.title,
      image: provider.profilePicture || "",
      username: provider.username,
      isVerified: !!provider.isVerified,
    };
  }, [booking]);

  const goToProfile = () => {
    if (participant.username) {
      router.push(`/${participant.username}`);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const demo = demoConversations[id];
    if (!token || demo) {
      const fallback = demo || demoConversations["demo-cleaning"];
      setBooking(fallback);
      setMessages(fallback.messages);
      setUsingDemoContent(true);
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      setLoading(true);
      try {
        const { data } = await api.get<{ data: Booking }>(`/bookings/${id}`);
        const nextBooking = data.data;
        setBooking(nextBooking);
        setMessages(
          [...(nextBooking.messages || [])].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          ),
        );
        setUsingDemoContent(false);
      } catch {
        const fallback = demoConversations["demo-cleaning"];
        setBooking(fallback);
        setMessages(fallback.messages);
        setUsingDemoContent(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, token]);

  const handleSendMessage = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;

    setNewMessage("");
    setSending(true);

    if (usingDemoContent || !token) {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          bookingId: id,
          senderId: currentUserId,
          content,
          createdAt: new Date().toISOString(),
          isRead: false,
          sender: { id: currentUserId, firstName: "You", lastName: "" },
        },
      ]);
      setSending(false);
      return;
    }

    try {
      const res = await api.post(`/bookings/${id}/messages`, { content }, { withCredentials: true });
      if (res.data?.data) {
        setMessages((prev) => [...prev, res.data.data]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          bookingId: id,
          senderId: currentUserId,
          content,
          createdAt: new Date().toISOString(),
          isRead: false,
          sender: { id: currentUserId, firstName: "You", lastName: "" },
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1FCEF]">
        <Loader2 className="h-6 w-6 animate-spin text-[#145B10]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#F1FCEF]">
      <div className="sticky top-0 z-10 bg-[#F1FCEF] px-4 pb-3 pt-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <BackButtonHeader text="" backHref="/conversations" />
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={goToProfile}
              disabled={!participant.username}
              aria-label={participant.username ? `View ${participant.name}'s profile` : undefined}
              className="flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[#145B10] disabled:cursor-default"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={participant.image} className="object-cover" />
                <AvatarFallback className="bg-[#145B10] text-[12px] font-bold text-white">
                  {participant.initials}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                {participant.username ? (
                  <button
                    type="button"
                    onClick={goToProfile}
                    className="truncate text-[15px] font-bold text-[#1B2431] hover:text-[#145B10] hover:underline"
                  >
                    {participant.name}
                  </button>
                ) : (
                  <p className="truncate text-[15px] font-bold text-[#1B2431]">{participant.name}</p>
                )}
                {participant.isVerified ? <VerifiedBadge size={16} /> : null}
              </div>
              <p className="truncate text-[11px] text-[#757575]">{participant.service}</p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#145B10] shadow-sm"
            aria-label="Call contact"
          >
            <Phone className="h-4 w-4" />
          </button>
        </div>
        {usingDemoContent && (
          <div className="mt-3 flex gap-2 rounded-2xl bg-white px-3 py-2 text-[11px] leading-4 text-[#616161]">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#145B10]" />
            This is a local preview conversation. Messages you send here are only shown on this screen.
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-24">
        {messages.map((msg) => {
          const mine = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
                  mine
                    ? "rounded-br-md bg-[#145B10] text-white"
                    : "rounded-bl-md bg-white text-[#1B2431]"
                }`}
              >
                <p className="text-[13px] leading-5">{msg.content}</p>
                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-white/75" : "text-[#9E9E9E]"}`}>
                  <span>{formatTimestamp(msg.createdAt)}</span>
                  {mine ? msg.isRead ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" /> : null}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[428px] -translate-x-1/2 border-t border-gray-100 bg-white p-3">
        <div className="flex items-center gap-2 rounded-full bg-[#F7F7F7] p-1">
          <input
            type="text"
            placeholder="Write a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-[#9E9E9E]"
            disabled={sending}
          />
          <button
            type="button"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#145B10] text-white disabled:opacity-50"
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            aria-label="Send message"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Conversation;
