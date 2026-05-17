"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2, Check, CheckCheck, Archive, AlertCircle, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import api from "@/lib/axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { initializeSocket, getSocket } from "@/lib/socket";
import toast from "react-hot-toast";
import { BOOKING_STATUS, CHAT_WINDOW_HOURS } from "@/constant";

interface Message {
  id: string;
  content: string;
  senderId: string;
  bookingId: string;
  createdAt: string;
  isDelivered: boolean;
  isRead: boolean;
  status?: 'sending' | 'sent' | 'error';
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface BookingDetails {
  id: string;
  status: string;
  updatedAt: string;
  workerId: string;
  employerId: string;
  service: {
    title: string;
  };
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
    username: string;
  };
  employer: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
    username: string;
  };
  messages: Message[];
}

const ChatRoom = ({ bookingId }: { bookingId: string }) => {
  const router = useRouter();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isArchived = booking?.status === BOOKING_STATUS.COMPLETED && (() => {
    const now = new Date();
    const updatedAt = new Date(booking.updatedAt);
    const diffInHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
    return diffInHours > CHAT_WINDOW_HOURS;
  })();

  const isCancelled = booking?.status === BOOKING_STATUS.CANCELLED;
  const isReadOnly = isArchived || isCancelled;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchBookingDetails();
    if (token && user?.id) {
      const socket = initializeSocket(token, user.id);
      
      const partnerId = user?.id === booking?.workerId ? booking?.employerId : booking?.workerId;

      const onConnect = () => {
        socket.emit("joinBooking", bookingId);
        socket.emit("readMessages", bookingId);
        
        if (partnerId) {
          socket.emit("checkPresence", partnerId, (res: { isOnline: boolean }) => {
             setPartnerOnline(res.isOnline);
          });
        }
      };
      
      socket.on("connect", onConnect);
      if (socket.connected) onConnect();

      const handleUserOnline = (userId: string) => {
        if (userId === partnerId) setPartnerOnline(true);
      };

      const handleUserOffline = (userId: string) => {
        if (userId === partnerId) setPartnerOnline(false);
      };

      const handleNewMessage = (message: Message) => {
        if (message.bookingId !== bookingId) return;

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) return prev;

          // If this is my own message coming back from the broadcast,
          // it might have already been handled by the acknowledgement logic.
          if (message.senderId === user?.id) {
             const tempMatchIdx = prev.findIndex(m => 
               m.status === 'sending' && 
               m.content === message.content
             );
             if (tempMatchIdx !== -1) {
               const updated = [...prev];
               updated[tempMatchIdx] = { ...message, status: 'sent' };
               return updated;
             }
          }
          
          // Partner messages
          const finalMsg = message.senderId !== user?.id ? { ...message, isDelivered: true, status: 'sent' as const } : { ...message, status: 'sent' as const };
          return [...prev, finalMsg];
        });
        
        if (message.senderId !== user?.id) {
          socket.emit("readMessages", bookingId);
        }
      };

      const handleMessagesRead = (data: { bookingId: string; readerId: string }) => {
        if (data.bookingId === bookingId && data.readerId !== user.id) {
          setMessages((prev) => prev.map(m => ({ ...m, isRead: true, isDelivered: true })));
        }
      };

      const handleMessagesDelivered = (data: { bookingId: string; recipientId: string }) => {
        if (data.bookingId === bookingId && data.recipientId !== user?.id) {
           setMessages((prev) => prev.map(m => 
             (m.senderId === user?.id && !m.isDelivered) ? { ...m, isDelivered: true } : m
           ));
        }
      };

      socket.on("newMessage", handleNewMessage);
      socket.on("messagesRead", handleMessagesRead);
      socket.on("messagesDelivered", handleMessagesDelivered);
      socket.on("userOnline", handleUserOnline);
      socket.on("userOffline", handleUserOffline);

      return () => {
        socket.emit("leaveBooking", bookingId);
        socket.off("newMessage", handleNewMessage);
        socket.off("messagesRead", handleMessagesRead);
        socket.off("messagesDelivered", handleMessagesDelivered);
        socket.off("userOnline", handleUserOnline);
        socket.off("userOffline", handleUserOffline);
        socket.off("connect", onConnect);
      };
    }
  }, [bookingId, token, user?.id, booking?.workerId, booking?.employerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchBookingDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/bookings/${bookingId}`);
      const data = response.data.data;
      setBooking(data);
      setMessages((data.messages || []).map((m: any) => ({ ...m, status: 'sent' })));
    } catch (error) {
      toast.error("Failed to load conversation");
      router.push("/conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || !user || isReadOnly) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      senderId: user.id,
      bookingId,
      createdAt: new Date().toISOString(),
      isDelivered: partnerOnline,
      isRead: false,
      status: 'sending',
      sender: {
        id: user.id,
        firstName: user.firstName || "You",
        lastName: user.lastName || "",
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setIsSubmitting(true);
    
    try {
      const socket = getSocket();
      let serverMessage: Message | null = null;

      if (socket && socket.connected) {
        try {
          const response: any = await new Promise((resolve, reject) => {
             const timeout = setTimeout(() => reject(new Error("Timeout")), 10000);
             socket.emit("sendMessage", { bookingId, message: { content: messageContent } }, (ack: any) => {
               clearTimeout(timeout);
               resolve(ack);
             });
          });

          if (response?.success && response.message) {
            serverMessage = response.message;
          }
        } catch (err) {
          console.warn("Socket send failed, falling back to REST");
        }
      }

      if (!serverMessage) {
        const response = await api.post(`/bookings/${bookingId}/messages`, {
          content: messageContent,
        });
        if (response.data?.data) {
          serverMessage = response.data.data;
        }
      }

      if (serverMessage) {
        const confirmedMsg = { ...serverMessage, status: 'sent' as const };
        setMessages((prev) => {
           return prev.map(m => (m.id === tempId) ? confirmedMsg : m);
        });
      }
    } catch (error) {
      console.error("Message send error:", error);
      toast.error("Message failed to send");
      setMessages((prev) => prev.map(m => (m.id === tempId) ? { ...m, status: 'error' } : m));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!booking || isUpdatingStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: BOOKING_STATUS.CONFIRMED });
      toast.success("Booking request approved!");
      fetchBookingDetails();
    } catch (error) {
      toast.error("Failed to approve request");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#145B10]" />
      </div>
    );
  }

  if (!booking || !user) return null;

  const partner = user.id === booking.workerId ? booking.employer : booking.worker;
  const partnerName = partner ? `${partner.firstName || "Unknown"} ${partner.lastName || ""}`.trim() : "Unknown Partner";
  const isWorker = user.id === booking.workerId;

  return (
    <div className="flex h-screen flex-col bg-[#F8F9FA]">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
        
        <div className="relative">
          <Avatar className="h-10 w-10 border border-gray-100">
            <AvatarImage src={partner?.profilePicture} className="object-cover" />
            <AvatarFallback className="bg-[#F1FCEF] text-[13px] font-bold text-[#145B10]">
              {partner?.firstName?.[0] || "U"}{partner?.lastName?.[0] || "P"}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${partnerOnline ? "bg-green-500" : "bg-gray-300"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-bold text-[#1B2431]">{partnerName}</h1>
            {partnerOnline && <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Online</span>}
          </div>
          <p className="truncate text-[11px] text-[#757575] font-medium">{booking.service?.title || "Booking Detail"}</p>
        </div>

        <div className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          booking.status === BOOKING_STATUS.PENDING ? 'bg-orange-50 text-orange-600' :
          booking.status === BOOKING_STATUS.CONFIRMED ? 'bg-blue-50 text-blue-600' :
          booking.status === BOOKING_STATUS.IN_PROGRESS ? 'bg-green-50 text-green-600' :
          booking.status === BOOKING_STATUS.COMPLETED ? 'bg-gray-100 text-gray-600' :
          'bg-red-50 text-red-600'
        }`}>
          {booking.status}
        </div>
      </header>

      {/* Banner for Status */}
      {isArchived && (
        <div className="flex items-center justify-center gap-2 bg-gray-100 py-2 text-[11px] font-medium text-gray-600 shadow-inner">
          <Archive className="h-3.5 w-3.5" />
          This conversation is archived.
        </div>
      )}
      {isCancelled && (
        <div className="flex items-center justify-center gap-2 bg-red-50 py-2 text-[11px] font-medium text-red-600 shadow-inner">
          <AlertCircle className="h-3.5 w-3.5" />
          This booking was cancelled. Chat is closed.
        </div>
      )}
      {booking.status === BOOKING_STATUS.PENDING && isWorker && (
        <div className="flex flex-col items-center gap-2 bg-orange-50 p-3 shadow-inner">
          <p className="text-center text-[11px] font-medium text-orange-700">
            You have a new hire request! Approve it to start the job.
          </p>
          <Button 
            onClick={handleApproveRequest}
            disabled={isUpdatingStatus}
            size="sm"
            className="h-8 rounded-full bg-[#145B10] px-4 text-[11px] font-bold text-white hover:bg-[#0F4D0C]"
          >
            {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
            Approve Request
          </Button>
        </div>
      )}

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="mx-auto max-w-[280px] rounded-xl bg-white p-3 text-center shadow-sm border border-gray-100">
          <p className="text-[11px] font-semibold text-[#1B2431]">Booking Details</p>
          <p className="mt-1 text-[10px] text-[#757575]">
            Keep all communications within Akazek to ensure your safety and protection.
          </p>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderId === user.id;
          const status = msg.status;

          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%] space-y-1">
                <div className={`rounded-2xl px-4 py-2 text-[13px] leading-relaxed shadow-sm ${
                  isMe 
                    ? "bg-[#145B10] text-white rounded-br-none" 
                    : "bg-white text-[#1B2431] border border-gray-100 rounded-bl-none"
                }`}>
                  <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                </div>
                <div className={`flex items-center gap-1 text-[9px] font-medium text-gray-400 ${isMe ? "justify-end" : "justify-start"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  
                  {isMe && (
                    status === 'sending' ? (
                      <div className="h-2.5 w-2.5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin ml-1" />
                    ) : status === 'error' ? (
                      <div className="text-red-500 font-bold ml-1 text-[11px]">!</div>
                    ) : (
                      msg.isRead ? (
                         <CheckCheck className="h-3.5 w-3.5 text-[#34B7F1] ml-1" /> 
                      ) : msg.isDelivered ? (
                         <CheckCheck className="h-3.5 w-3.5 text-gray-400 ml-1" />
                      ) : (
                         <Check className="h-3.5 w-3.5 text-gray-400 ml-1" />
                      )
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white p-4 pb-8 shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder={isReadOnly ? "This conversation is archived" : "Type a message..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending || isReadOnly}
            rows={1}
            className="min-h-[44px] max-h-[120px] flex-1 resize-none rounded-2xl border-gray-200 bg-gray-50 px-5 py-3 focus:ring-1 focus:ring-[#145B10]/20 scrollbar-hide"
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            disabled={!newMessage.trim() || isSending || isReadOnly}
            className="h-11 w-11 flex-shrink-0 rounded-full bg-[#145B10] text-white hover:bg-[#0F4D0C]"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ChatRoom;
