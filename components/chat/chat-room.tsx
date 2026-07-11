"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2, Check, CheckCheck, Archive, AlertCircle, CheckCircle2, Clock, ClipboardList, ShieldCheck, X, Pencil, Reply, SmilePlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import api from "@/lib/axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { initializeSocket, getSocket } from "@/lib/socket";
import toast from "react-hot-toast";
import { BOOKING_STATUS, PENDING_NUDGE_MESSAGE_THRESHOLD, PENDING_REMINDER_MESSAGE, QUICK_TAP_EMOJI, SKIN_TONE_STORAGE_KEY, applySkinTone } from "@/constant";
import { haptic } from "@/lib/haptics";
import { TaskDrawer, Task } from "./task-drawer";
import { MessageActionsPopover } from "./message-actions-popover";
import { LinkifiedText } from "./linkified-text";
import { useMessageGestures } from "@/hooks/useMessageGestures";
import {
  ReviewPromptDialog,
  type ReviewPromptPayload,
} from "@/components/reviews/review-prompt-dialog";
import { BookingReviewsDialog } from "@/components/reviews/booking-reviews-dialog";
import type { Review } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/error-handler";

// Status announcements (accept / cancel / complete) are persisted as regular
// messages with a real senderId but a distinctive leading emoji marker. We use
// the marker to render them as centred system notices instead of chat bubbles.
const SYSTEM_MESSAGE_MARKERS = ["✅", "❌", "🏁"];
// Guards against a non-string content (a malformed/legacy row, or a socket
// payload that skipped validation) crashing the whole message list render.
const isSystemMessage = (content: unknown) =>
  typeof content === "string" &&
  SYSTEM_MESSAGE_MARKERS.some((marker) => content.startsWith(marker));

interface MessageSenderSummary {
  id: string;
  firstName: string;
  lastName: string;
}

interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: MessageSenderSummary;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  bookingId: string;
  createdAt: string;
  isDelivered: boolean;
  isRead: boolean;
  status?: 'sending' | 'sent' | 'error';
  editedAt?: string | null;
  deletedAt?: string | null;
  sender: MessageSenderSummary;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
    sender: MessageSenderSummary;
  } | null;
  reactions?: MessageReaction[];
}

interface SendMessageAck {
  success?: boolean;
  message?: Message;
  error?: string;
}

interface ReactionAck {
  success?: boolean;
  messageId?: string;
  reactions?: MessageReaction[];
  error?: string;
}

interface MessageMutationAck {
  success?: boolean;
  message?: Message;
  error?: string;
}

// Must match the backend's MESSAGE_EDIT_WINDOW_MS (bookings.service.ts): a
// message can be edited/unsent only within this window and only until the
// other person replies.
const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;

// Drag distance (px) at which the slide-to-reply hint reaches full opacity;
// matches the hook's swipe-to-reply trigger distance.
const SWIPE_TRIGGER_HINT = 56;

interface BookingDetails {
  id: string;
  status: string;
  updatedAt: string;
  workerId: string;
  employerId: string;
  service: {
    category?: { name?: string };
  } | null;
  job?: {
    title: string;
  } | null;
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
  reviews?: Review[];
}

// A standalone component (not inlined in messages.map) because it calls
// useMessageGestures — hooks can't be called from inside a loop callback.
function MessageBubble({
  msg,
  isMe,
  currentUserId,
  isReadOnly,
  isHighlighted,
  isActionsOpen,
  showActionsFull,
  canModify,
  skinTone,
  onChangeSkinTone,
  onOpenReact,
  onOpenFull,
  onCloseActions,
  onReply,
  onReact,
  onQuickReact,
  onCopy,
  onEdit,
  onDelete,
  onQuoteClick,
}: {
  msg: Message;
  isMe: boolean;
  currentUserId: string;
  isReadOnly: boolean;
  isHighlighted: boolean;
  isActionsOpen: boolean;
  showActionsFull: boolean;
  canModify: boolean;
  skinTone: string;
  onChangeSkinTone: (tone: string) => void;
  onOpenReact: () => void;
  onOpenFull: () => void;
  onCloseActions: () => void;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onQuickReact: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onQuoteClick: (id: string) => void;
}) {
  const status = msg.status;
  const isDeleted = Boolean(msg.deletedAt);
  const reactions = msg.reactions ?? [];
  const myReaction = reactions.find((r) => r.userId === currentUserId)?.emoji ?? null;
  const reactionGroups = reactions.reduce<Record<string, MessageReaction[]>>((acc, r) => {
    (acc[r.emoji] ??= []).push(r);
    return acc;
  }, {});

  const gestureEnabled = !isReadOnly && !isDeleted;
  const { dragX, isDragging, handlers } = useMessageGestures({
    enabled: gestureEnabled,
    onLongPress: onOpenFull,
    onDoubleTap: onQuickReact,
    onSwipeReply: onReply,
  });

  // A tombstone: no menu, no reactions, no reply affordance.
  if (isDeleted) {
    return (
      <div id={`msg-${msg.id}`} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
        <div className="max-w-[85%]">
          <div className={cn(
            "rounded-2xl px-4 py-2 text-[13px] italic shadow-sm",
            isMe ? "bg-brand/40 text-white rounded-br-none" : "bg-gray-50 text-gray-400 border border-gray-100 rounded-bl-none",
          )}>
            This message was deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`msg-${msg.id}`}
      className={cn(
        "group relative flex items-center gap-1 rounded-2xl transition-colors duration-500",
        isMe ? "justify-end" : "justify-start",
        isHighlighted && "bg-brand/10",
      )}
    >
      {/* Desktop hover actions (hover-capable pointers only): react + reply. */}
      {isMe && gestureEnabled && (
        <HoverActions onReact={onOpenReact} onReply={onReply} />
      )}

      {/* Slide-to-reply hint, revealed as the bubble is dragged right. */}
      <Reply
        className="pointer-events-none absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 text-brand"
        style={{ opacity: Math.min(dragX / SWIPE_TRIGGER_HINT, 1) }}
      />

      <div
        className="max-w-[85%] space-y-1"
        style={{
          transform: dragX ? `translateX(${dragX}px)` : undefined,
          transition: isDragging ? "none" : "transform 150ms ease-out",
        }}
      >
        {msg.replyTo && (
          <button
            type="button"
            onClick={() => onQuoteClick(msg.replyTo!.id)}
            className={cn(
              "flex w-full flex-col items-start rounded-lg border-l-2 border-brand/40 bg-black/[0.03] px-2 py-1 text-left text-[11px]",
              isMe && "ml-auto",
            )}
          >
            <span className="font-semibold text-brand">
              {msg.replyTo.senderId === currentUserId ? "You" : msg.replyTo.sender.firstName}
            </span>
            <span className="line-clamp-1 text-ink-subtle">
              {msg.replyTo.content || "Deleted message"}
            </span>
          </button>
        )}

        <MessageActionsPopover
          open={isActionsOpen}
          onOpenChange={(open) => { if (!open) onCloseActions(); }}
          align={isMe ? "end" : "start"}
          showActions={showActionsFull}
          canModify={canModify}
          myReaction={myReaction}
          skinTone={skinTone}
          onChangeSkinTone={onChangeSkinTone}
          onReact={onReact}
          onReply={onReply}
          onCopy={onCopy}
          onEdit={onEdit}
          onDelete={onDelete}
        >
          <div
            {...handlers}
            // Right-click / two-finger trackpad opens the full menu on desktop.
            onContextMenu={(e) => { e.preventDefault(); if (gestureEnabled) onOpenFull(); }}
            className={cn(
              "rounded-2xl px-4 py-2 text-[13px] leading-relaxed shadow-sm",
              isMe
                ? "bg-brand text-white rounded-br-none"
                : "bg-white text-ink border border-gray-100 rounded-bl-none",
            )}
          >
            <LinkifiedText text={msg.content} isMe={isMe} />
          </div>
        </MessageActionsPopover>

        {Object.keys(reactionGroups).length > 0 && (
          <div className={`flex flex-wrap gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactionGroups).map(([emoji, group]) => {
              const mine = group.some((r) => r.userId === currentUserId);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(emoji)}
                  className={cn(
                    "flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px]",
                    mine ? "border-brand/40 bg-brand/10" : "border-gray-100 bg-white",
                  )}
                >
                  <span>{emoji}</span>
                  {group.length > 1 && <span className="text-gray-500">{group.length}</span>}
                </button>
              );
            })}
          </div>
        )}

        <div className={`flex items-center gap-1 text-[9px] font-medium text-gray-400 ${isMe ? "justify-end" : "justify-start"}`}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {msg.editedAt && <span className="italic">edited</span>}

          {isMe && (
            status === 'sending' ? (
              <Clock className="h-3 w-3 text-gray-400 ml-1" />
            ) : status === 'error' ? (
              <AlertCircle className="h-3.5 w-3.5 text-red-500 ml-1" />
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

      {!isMe && gestureEnabled && (
        <HoverActions onReact={onOpenReact} onReply={onReply} />
      )}
    </div>
  );
}

// Desktop-only quick actions revealed on hover: react (opens the emoji row)
// and reply. Hidden on touch devices, which use double-tap / long-press /
// swipe instead.
function HoverActions({ onReact, onReply }: { onReact: () => void; onReply: () => void }) {
  return (
    <div className="hidden shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 [@media(hover:hover)]:flex">
      <button
        type="button"
        onClick={onReact}
        aria-label="React"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
      >
        <SmilePlus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onReply}
        aria-label="Reply"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
      >
        <Reply className="h-4 w-4" />
      </button>
    </div>
  );
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Message count at which the pending nudge was last dismissed. The nudge
  // re-surfaces once PENDING_NUDGE_MESSAGE_THRESHOLD more messages arrive, or
  // immediately when a reminder lands (baseline reset to 0).
  const [nudgeDismissBaseline, setNudgeDismissBaseline] = useState(0);
  const [isReviewPromptOpen, setIsReviewPromptOpen] = useState(false);
  const [isBookingReviewsOpen, setIsBookingReviewsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isConfirmingRevoke, setIsConfirmingRevoke] = useState(false);
  const readReceiptSentForRef = useRef<Set<string>>(new Set());
  const reviewAutoPromptedRef = useRef(false);
  // Message being quoted in the composer, if any.
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  // Message being edited in the composer, if any.
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  // Which bubble's popover is open, and whether it shows the full action row
  // (long-press) or just the reaction emojis (double-tap).
  const [activeMessageActionsId, setActiveMessageActionsId] = useState<string | null>(null);
  const [actionsShowFull, setActionsShowFull] = useState(true);
  // Briefly highlighted after scrolling to a quoted message.
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  // Chosen emoji skin tone ("" = default). Loaded from localStorage after mount
  // to avoid an SSR/hydration mismatch.
  const [skinTone, setSkinTone] = useState("");
  useEffect(() => {
    const saved = localStorage.getItem(SKIN_TONE_STORAGE_KEY);
    if (saved) setSkinTone(saved);
  }, []);
  const handleChangeSkinTone = (tone: string) => {
    setSkinTone(tone);
    localStorage.setItem(SKIN_TONE_STORAGE_KEY, tone);
  };

  const isCompleted = booking?.status === BOOKING_STATUS.COMPLETED;
  const isCancelled = booking?.status === BOOKING_STATUS.CANCELLED;
  const isReadOnly = isCompleted || isCancelled;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToMessage = (messageId: string) => {
    document.getElementById(`msg-${messageId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(messageId);
    setTimeout(() => setHighlightedMessageId((current) => (current === messageId ? null : current)), 1200);
  };

  // Fetch booking data independently — only re-runs if bookingId changes
  useEffect(() => {
    readReceiptSentForRef.current.clear();
    reviewAutoPromptedRef.current = false;
    setNudgeDismissBaseline(0);
    fetchBookingDetails();
  }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!token || !user?.id) return;
    const socket = initializeSocket(token, user.id);

    const partnerId = user?.id === booking?.workerId ? booking?.employerId : booking?.workerId;

    // A reconnect (network blip, app resume) shouldn't mark messages read on
    // its own — only do it while this chat screen is actually the thing the
    // user is looking at. Otherwise a background/backgrounded reconnect flips
    // the sender's ticks to "read" before the recipient ever saw the message.
    const markReadIfVisible = () => {
      if (document.visibilityState === "visible") {
        socket.emit("readMessages", bookingId);
      }
    };

    const onConnect = () => {
      socket.emit("joinBooking", bookingId);
      markReadIfVisible();

      if (partnerId) {
        socket.emit("checkPresence", partnerId, (res: { isOnline: boolean }) => {
          setPartnerOnline(res.isOnline);
        });
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && socket.connected) {
        socket.emit("readMessages", bookingId);
      }
    };

    socket.on("connect", onConnect);
    if (socket.connected) onConnect();
    document.addEventListener("visibilitychange", onVisibilityChange);

    const handleUserOnline = (userId: string) => {
      if (userId === partnerId) setPartnerOnline(true);
    };

    const handleUserOffline = (userId: string) => {
      if (userId === partnerId) setPartnerOnline(false);
    };

    const handlePresenceReady = (data: { onlineUserIds?: string[] }) => {
      if (!partnerId) return;

      if (Array.isArray(data.onlineUserIds)) {
        setPartnerOnline(data.onlineUserIds.includes(partnerId));
        return;
      }

      socket.emit("checkPresence", partnerId, (res: { isOnline: boolean }) => {
        setPartnerOnline(res.isOnline);
      });
    };

    const handleNewMessage = (message: Message) => {
      if (message.bookingId !== bookingId) return;

      // A reminder from the partner re-surfaces the nudge even if it was
      // dismissed, so the recipient sees the Accept button again.
      if (message.senderId !== user?.id && message.content === PENDING_REMINDER_MESSAGE) {
        setNudgeDismissBaseline(0);
      }

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;

        if (message.senderId === user?.id) {
          const tempMatchIdx = prev.findIndex(
            (m) => m.status === "sending" && m.content === message.content,
          );
          if (tempMatchIdx !== -1) {
            const existing = prev[tempMatchIdx];
            const updated = [...prev];
            // Merge flags forward: a delivered/read event may have already
            // arrived for this message — never regress those ticks.
            updated[tempMatchIdx] = {
              ...message,
              isDelivered: message.isDelivered || existing.isDelivered,
              isRead: message.isRead || existing.isRead,
              status: "sent",
            };
            return updated;
          }
        }

        const finalMsg =
          message.senderId !== user?.id
            ? { ...message, isDelivered: true, status: "sent" as const }
            : { ...message, status: "sent" as const };
        return [...prev, finalMsg];
      });

      if (
        message.senderId !== user?.id &&
        !readReceiptSentForRef.current.has(message.id) &&
        document.visibilityState === "visible"
      ) {
        readReceiptSentForRef.current.add(message.id);
        socket.emit("readMessages", bookingId);
      }
    };

    const handleMessagesRead = (data: { bookingId: string; readerId: string }) => {
      if (data.bookingId === bookingId && data.readerId !== user.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === user.id ? { ...m, isRead: true, isDelivered: true } : m,
          ),
        );
      }
    };

    const handleMessagesDelivered = (data: { bookingId: string; recipientId: string }) => {
      if (data.bookingId === bookingId && data.recipientId !== user?.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === user?.id && !m.isDelivered ? { ...m, isDelivered: true } : m,
          ),
        );
      }
    };

    const handleMessageReactionUpdated = (data: { bookingId: string; messageId: string; reactions: MessageReaction[] }) => {
      if (data.bookingId !== bookingId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m)),
      );
    };

    const handleMessageUpdated = (updated: Message) => {
      if (updated.bookingId !== bookingId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...updated, status: "sent" } : m)),
      );
    };

    const handleBookingStatusUpdated = (data: { bookingId: string; status: string }) => {
      if (data.bookingId !== bookingId) return;
      setBooking((prev) => prev ? { ...prev, status: data.status, updatedAt: new Date().toISOString() } : prev);
    };

    const handleTaskCreated = (task: Task) => {
      if (task.bookingId !== bookingId) return;
      setTasks((prev) => prev.some((t) => t.id === task.id) ? prev : [...prev, task]);
    };

    const handleTaskUpdated = (task: Task) => {
      if (task.bookingId !== bookingId) return;
      setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
    };

    const handleTaskDeleted = (data: { id: string; bookingId: string }) => {
      if (data.bookingId !== bookingId) return;
      setTasks((prev) => prev.filter((t) => t.id !== data.id));
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("messagesDelivered", handleMessagesDelivered);
    socket.on("messageReactionUpdated", handleMessageReactionUpdated);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("bookingStatusUpdated", handleBookingStatusUpdated);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);
    socket.on("presenceReady", handlePresenceReady);
    socket.on("taskCreated", handleTaskCreated);
    socket.on("taskUpdated", handleTaskUpdated);
    socket.on("taskDeleted", handleTaskDeleted);

    return () => {
      socket.emit("leaveBooking", bookingId);
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("messagesDelivered", handleMessagesDelivered);
      socket.off("messageReactionUpdated", handleMessageReactionUpdated);
      socket.off("messageUpdated", handleMessageUpdated);
      socket.off("bookingStatusUpdated", handleBookingStatusUpdated);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
      socket.off("presenceReady", handlePresenceReady);
      socket.off("taskCreated", handleTaskCreated);
      socket.off("taskUpdated", handleTaskUpdated);
      socket.off("taskDeleted", handleTaskDeleted);
      socket.off("connect", onConnect);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [bookingId, token, user?.id, booking?.workerId, booking?.employerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // When a booking is completed, prompt BOTH parties to review — regardless of
  // who marked it complete. Fires once per open; the persistent "Leave Review"
  // banner button covers any later visits after the prompt is closed.
  useEffect(() => {
    if (!booking || !user) return;
    if (booking.status !== BOOKING_STATUS.COMPLETED) return;
    if (reviewAutoPromptedRef.current) return;

    const alreadyReviewed = Boolean(
      booking.reviews?.some(
        (review) => review.author?.id === user.id || review.authorId === user.id,
      ),
    );
    if (alreadyReviewed) return;

    reviewAutoPromptedRef.current = true;
    setIsReviewPromptOpen(true);
  }, [booking, user]);

  const fetchBookingDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/bookings/${bookingId}`);
      const data = response.data.data;
      setBooking(data);
      setMessages(((data.messages || []) as Message[]).map((m) => ({ ...m, status: 'sent' })));
      setTasks((data.tasks || []) as Task[]);
    } catch {
      toast.error("Failed to load conversation");
      router.push("/conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (contentOverride?: string) => {
    const isOverride = typeof contentOverride === "string";
    const messageContent = (isOverride ? contentOverride : newMessage).trim();
    if (!messageContent || isSending || !user || isReadOnly) return;

    const tempId = `temp-${Date.now()}`;
    // Canned reminders (handleRemindPartner) bypass the composer entirely —
    // don't attach whatever reply context happens to be open for those.
    const replyingTo = !isOverride ? replyTarget : null;

    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      senderId: user.id,
      bookingId,
      createdAt: new Date().toISOString(),
      // Start as "sent" (single gray), never optimistically "delivered" —
      // partnerOnline is only this client's cached presence guess and can be
      // stale. The real isDelivered comes back on the server ack (true only if
      // the recipient's socket actually received it) or a later messagesDelivered
      // event, so the double-gray tick reflects genuine device receipt.
      isDelivered: false,
      isRead: false,
      status: 'sending',
      sender: {
        id: user.id,
        firstName: user.firstName || "You",
        lastName: user.lastName || "",
      },
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content,
            senderId: replyingTo.senderId,
            sender: replyingTo.sender,
          }
        : null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    if (!isOverride) {
      setNewMessage("");
      setReplyTarget(null);
    }
    setIsSubmitting(true);

    try {
      const socket = getSocket();
      let serverMessage: Message | null = null;

      if (socket && socket.connected) {
        try {
          const response = await new Promise<SendMessageAck>((resolve, reject) => {
             const timeout = setTimeout(() => reject(new Error("Timeout")), 10000);
             socket.emit("sendMessage", { bookingId, message: { content: messageContent, replyToId: replyingTo?.id } }, (ack: SendMessageAck) => {
               clearTimeout(timeout);
               resolve(ack);
             });
          });

          if (response?.success && response.message) {
            serverMessage = response.message;
          }
        } catch {
          console.warn("Socket send failed, falling back to REST");
        }
      }

      if (!serverMessage) {
        const response = await api.post(`/bookings/${bookingId}/messages`, {
          content: messageContent,
          replyToId: replyingTo?.id,
        });
        if (response.data?.data) {
          serverMessage = response.data.data;
        }
      }

      if (serverMessage) {
        const confirmed = serverMessage;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...confirmed,
                  // Preserve any delivered/read state that already advanced
                  // while the send was in flight.
                  isDelivered: confirmed.isDelivered || m.isDelivered,
                  isRead: confirmed.isRead || m.isRead,
                  status: "sent" as const,
                }
              : m,
          ),
        );
      }
    } catch (error) {
      console.error("Message send error:", error);
      toast.error("Message failed to send");
      setMessages((prev) => prev.map(m => (m.id === tempId) ? { ...m, status: 'error' } : m));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemindPartner = () => {
    handleSendMessage(PENDING_REMINDER_MESSAGE);
  };

  // Same three-way toggle as the backend: no reaction from this user -> add;
  // same emoji already -> remove; different emoji already -> replace it.
  const computeOptimisticReactions = (current: MessageReaction[], emoji: string): MessageReaction[] => {
    if (!user) return current;
    const mine = current.find((r) => r.userId === user.id);
    if (mine?.emoji === emoji) {
      return current.filter((r) => r.userId !== user.id);
    }
    const withoutMine = current.filter((r) => r.userId !== user.id);
    return [
      ...withoutMine,
      {
        id: mine?.id ?? `temp-reaction-${Date.now()}`,
        emoji,
        userId: user.id,
        user: { id: user.id, firstName: user.firstName || "You", lastName: user.lastName || "" },
      },
    ];
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!user || isReadOnly) return;
    setActiveMessageActionsId(null);
    haptic();

    const target = messages.find((m) => m.id === messageId);
    const prevReactions = target?.reactions ?? [];
    const optimisticReactions = computeOptimisticReactions(prevReactions, emoji);

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, reactions: optimisticReactions } : m)),
    );

    const revert = () => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: prevReactions } : m)),
      );
      toast.error("Couldn't update reaction");
    };

    try {
      const socket = getSocket();
      let ack: ReactionAck | null = null;

      if (socket && socket.connected) {
        try {
          ack = await new Promise<ReactionAck>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Timeout")), 10000);
            socket.emit("reactToMessage", { messageId, emoji }, (response: ReactionAck) => {
              clearTimeout(timeout);
              resolve(response);
            });
          });
        } catch {
          console.warn("Socket reaction failed, falling back to REST");
        }
      }

      if (!ack?.success) {
        const response = await api.post(`/bookings/${bookingId}/messages/${messageId}/reactions`, { emoji });
        ack = response.data?.data ? { success: true, ...response.data.data } : null;
      }

      if (ack?.success && ack.reactions) {
        const confirmedReactions = ack.reactions;
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: confirmedReactions } : m)),
        );
      } else {
        revert();
      }
    } catch (error) {
      console.error("Reaction toggle error:", error);
      revert();
    }
  };

  const handleCopyMessage = async (content: string) => {
    setActiveMessageActionsId(null);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        const ta = document.createElement("textarea");
        ta.value = content;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  // Enter edit mode: the composer becomes an editor pre-filled with the
  // message text (mutually exclusive with replying).
  const handleStartEdit = (msg: Message) => {
    setActiveMessageActionsId(null);
    setReplyTarget(null);
    setEditingMessage(msg);
    setNewMessage(msg.content);
    inputRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setNewMessage("");
  };

  const handleSaveEdit = async () => {
    if (!editingMessage) return;
    const messageId = editingMessage.id;
    const content = newMessage.trim();
    if (!content) return;
    if (content === editingMessage.content) {
      handleCancelEdit();
      return;
    }

    const prev = editingMessage;
    // Optimistic: show the new text + an "edited" marker immediately.
    setMessages((cur) =>
      cur.map((m) => (m.id === messageId ? { ...m, content, editedAt: new Date().toISOString() } : m)),
    );
    setEditingMessage(null);
    setNewMessage("");
    setIsSubmitting(true);

    const revert = (msg: string) => {
      setMessages((cur) => cur.map((m) => (m.id === messageId ? { ...m, content: prev.content, editedAt: prev.editedAt ?? null } : m)));
      toast.error(msg);
    };

    try {
      const socket = getSocket();
      let ack: MessageMutationAck | null = null;
      if (socket && socket.connected) {
        try {
          ack = await new Promise<MessageMutationAck>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Timeout")), 10000);
            socket.emit("editMessage", { messageId, content }, (r: MessageMutationAck) => {
              clearTimeout(timeout);
              resolve(r);
            });
          });
        } catch {
          console.warn("Socket edit failed, falling back to REST");
        }
      }
      if (!ack?.success) {
        const response = await api.patch(`/bookings/${bookingId}/messages/${messageId}`, { content });
        ack = response.data?.data ? { success: true, message: response.data.data } : null;
      }
      if (ack?.success && ack.message) {
        const confirmed = ack.message;
        setMessages((cur) => cur.map((m) => (m.id === messageId ? { ...confirmed, status: "sent" } : m)));
      } else {
        revert(ack?.error || "Couldn't edit message");
      }
    } catch (err) {
      revert(getApiErrorMessage(err, "Couldn't edit message"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    setActiveMessageActionsId(null);
    const prev = messages.find((m) => m.id === messageId);
    if (!prev) return;

    // Optimistic tombstone.
    setMessages((cur) =>
      cur.map((m) => (m.id === messageId ? { ...m, content: "", deletedAt: new Date().toISOString(), reactions: [] } : m)),
    );

    const revert = (msg: string) => {
      setMessages((cur) => cur.map((m) => (m.id === messageId ? prev : m)));
      toast.error(msg);
    };

    try {
      const socket = getSocket();
      let ack: MessageMutationAck | null = null;
      if (socket && socket.connected) {
        try {
          ack = await new Promise<MessageMutationAck>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Timeout")), 10000);
            socket.emit("deleteMessage", { messageId }, (r: MessageMutationAck) => {
              clearTimeout(timeout);
              resolve(r);
            });
          });
        } catch {
          console.warn("Socket delete failed, falling back to REST");
        }
      }
      if (!ack?.success) {
        const response = await api.delete(`/bookings/${bookingId}/messages/${messageId}`);
        ack = response.data?.data ? { success: true, message: response.data.data } : null;
      }
      if (ack?.success && ack.message) {
        const confirmed = ack.message;
        setMessages((cur) => cur.map((m) => (m.id === messageId ? { ...confirmed, status: "sent" } : m)));
      } else {
        revert(ack?.error || "Couldn't unsend message");
      }
    } catch (err) {
      revert(getApiErrorMessage(err, "Couldn't unsend message"));
    }
  };

  const handleApproveRequest = async () => {
    if (!booking || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: BOOKING_STATUS.CONFIRMED });
      toast.success("Offer accepted. Booking confirmed.");
      fetchBookingDetails();
    } catch {
      toast.error("Failed to approve request");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // The employer who sent the offer can revoke it while it is still pending —
  // e.g. they chatted and couldn't agree on the work. Cancelling a PENDING
  // booking is permitted for either party by the backend.
  const handleRevokeOffer = async () => {
    if (!booking || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: BOOKING_STATUS.CANCELLED });
      toast.success("Offer revoked.");
      setIsConfirmingRevoke(false);
      fetchBookingDetails();
    } catch {
      toast.error("Failed to revoke offer");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getMyReview = () =>
    booking?.reviews?.find((review) => review.author?.id === user?.id || review.authorId === user?.id);

  const currentUserHasReviewed = () => Boolean(getMyReview());

  const normalizeReviewForBooking = (review: Review): Review => ({
    ...review,
    user: review.user || review.author || {
      id: "",
      firstName: "Previous",
      lastName: "Partner",
      profilePicture: "",
    },
    booking: review.booking || {
      scheduledFor: "",
      updatedAt: booking?.updatedAt || new Date().toISOString(),
    },
  });

  const handleBookingStatusChange = (status: string) => {
    setBooking((prev) =>
      prev ? { ...prev, status, updatedAt: new Date().toISOString() } : prev,
    );

    if (status !== BOOKING_STATUS.COMPLETED) return;

    if (currentUserHasReviewed()) {
      toast("You already reviewed this job.");
      return;
    }

    setIsReviewPromptOpen(true);
  };

  const submitChatReview = async (payload: ReviewPromptPayload) => {
    if (!booking) return false;

    const existing = getMyReview();

    try {
      // Completing/editing a review that was submitted without a comment.
      if (existing) {
        const comment = payload.comment?.trim();
        if (!comment) {
          toast.error("Add a comment to complete your review.");
          return false;
        }
        const response = await api.patch(`/feedback/${existing.id}`, { comment });
        const updated = response.data?.data || response.data;
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                reviews: (prev.reviews || []).map((review) =>
                  review.id === existing.id
                    ? normalizeReviewForBooking({ ...review, ...updated, comment })
                    : review,
                ),
              }
            : prev,
        );
        toast.success("Review updated.");
        return true;
      }

      const response = await api.post("/feedback", {
        bookingId: booking.id,
        wouldRehire: payload.wouldRehire,
        comment: payload.comment,
      });
      const created = response.data?.data || response.data;
      if (created) {
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                reviews: [...(prev.reviews || []), normalizeReviewForBooking(created)],
              }
            : prev,
        );
      }
      toast.success("Review submitted.");
      return true;
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Could not submit review.");
      return false;
    }
  };

  const replyToBookingReview = async (reviewId: string, reply: string) => {
    try {
      const response = await api.patch(`/feedback/${reviewId}/reply`, { reply });
      const updated = response.data?.data || response.data;
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              reviews: (prev.reviews || []).map((review) =>
                review.id === reviewId ? normalizeReviewForBooking({ ...review, ...updated }) : review,
              ),
            }
          : prev,
      );
      return true;
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Could not post reply.");
      return false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        handleSaveEdit();
      } else {
        handleSendMessage();
      }
      // The textarea is never disabled mid-send, so it keeps focus; this just
      // guards against any edge re-render dropping it so the user can keep typing.
      inputRef.current?.focus();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!booking || !user) return null;

  const partner = user.id === booking.workerId ? booking.employer : booking.worker;
  const partnerName = partner ? `${partner.firstName || "Unknown"} ${partner.lastName || ""}`.trim() : "Unknown Partner";
  const isWorker = user.id === booking.workerId;
  const contextTitle = booking.service?.category?.name || booking.job?.title || "Work request";
  // Role-aware label for the partner: a worker is described by the service they
  // provide (e.g. "Driver"); an employer is simply the "Employer" — never the
  // service title, which would wrongly imply they do that job.
  const partnerRoleLabel = isWorker ? "Employer" : contextTitle;
  // Review wording follows the direction of the relationship.
  const rehireQuestion = isWorker
    ? "Would you work with this person again?"
    : "Would you hire this person again?";
  const isPending = booking.status === BOOKING_STATUS.PENDING;
  const isApproved = booking.status !== BOOKING_STATUS.PENDING && booking.status !== BOOKING_STATUS.CANCELLED;
  // Timestamp of the partner's most recent message — a message of mine stops
  // being editable once the partner has sent anything newer (mirrors the
  // backend's assertMessageMutable rule).
  const lastPartnerMessageAt = messages.reduce((latest, m) => {
    if (m.senderId === user.id) return latest;
    const t = new Date(m.createdAt).getTime();
    return t > latest ? t : latest;
  }, 0);
  const canModifyMessage = (msg: Message) =>
    msg.senderId === user.id &&
    !msg.deletedAt &&
    msg.status !== "sending" &&
    msg.status !== "error" &&
    Date.now() - new Date(msg.createdAt).getTime() < MESSAGE_EDIT_WINDOW_MS &&
    lastPartnerMessageAt <= new Date(msg.createdAt).getTime();
  const incompleteTaskCount = tasks.filter((t) => !t.isCompleted && !t.isCanceled).length;
  const hasTaskTab = tasks.length > 0 || isApproved;
  const bookingReviews = (booking.reviews || []).map(normalizeReviewForBooking);
  const myReview = getMyReview();
  // A review left without a comment is treated as incomplete, so the user can
  // still finish it ("in case it was skipped") instead of being locked out.
  const myReviewNeedsComment = Boolean(myReview && !myReview.comment?.trim());
  const hasCompleteReview = Boolean(myReview && myReview.comment?.trim());
  const hasReviewedThisBooking = currentUserHasReviewed();
  const showPendingNudge =
    isPending &&
    messages.length - nudgeDismissBaseline >= PENDING_NUDGE_MESSAGE_THRESHOLD;

  return (
    <div className="bg-surface relative isolate flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => {
            // Opening a chat straight from a push notification lands here with
            // no prior history entry — router.back() would then do nothing.
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/conversations");
            }
          }}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>

        <div className="relative">
          <Avatar className="h-10 w-10 border border-gray-100">
            <AvatarImage src={partner?.profilePicture} className="object-cover" />
            <AvatarFallback className="bg-surface text-[13px] font-bold text-brand">
              {partner?.firstName?.[0] || "U"}{partner?.lastName?.[0] || "P"}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${partnerOnline ? "bg-green-500" : "bg-gray-300"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-bold text-ink">{partnerName}</h1>
            {partnerOnline && <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Online</span>}
          </div>
          <p className="truncate text-[11px] text-ink-subtle font-medium">{partnerRoleLabel}</p>
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

      <TaskDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        bookingId={bookingId}
        userId={user.id}
        employerId={booking.employerId}
        workerId={booking.workerId}
        status={booking.status}
        isApproved={isApproved}
        tasks={tasks}
        onTasksChange={setTasks}
        onStatusChange={handleBookingStatusChange}
      />

      <ReviewPromptDialog
        open={isReviewPromptOpen}
        subject={{
          title: partnerName,
          subtitle: partnerRoleLabel,
        }}
        rehireQuestion={rehireQuestion}
        initialRehire={myReview?.wouldRehire ?? null}
        initialComment={myReview?.comment ?? ""}
        onOpenChange={setIsReviewPromptOpen}
        onSubmit={submitChatReview}
      />

      <BookingReviewsDialog
        open={isBookingReviewsOpen}
        title={contextTitle}
        reviews={bookingReviews}
        canLeaveReview={booking.status === BOOKING_STATUS.COMPLETED && !hasCompleteReview}
        onOpenChange={setIsBookingReviewsOpen}
        onLeaveReview={() => {
          setIsBookingReviewsOpen(false);
          setIsReviewPromptOpen(true);
        }}
        onReply={replyToBookingReview}
      />

      {/* Right-edge sticky task tab */}
      {hasTaskTab && (
        <button
          onClick={() => setIsDrawerOpen(true)}
          aria-label="View job tasks"
          aria-expanded={isDrawerOpen}
          className={`absolute right-0 top-[72px] z-30 flex h-16 w-12 flex-col items-center justify-center gap-1 rounded-l-full rounded-r-none border border-r-0 shadow-[-6px_6px_18px_rgba(20,91,16,0.12)] transition-all hover:-translate-x-0.5 active:scale-95 ${
            isDrawerOpen
              ? "border-brand bg-brand text-white"
              : "border-brand/15 bg-white/95 text-brand backdrop-blur"
          }`}
        >
          <ClipboardList className="h-[18px] w-[18px]" strokeWidth={2.35} />
          <span className="text-[18px] font-extrabold leading-none">{incompleteTaskCount}</span>
        </button>
      )}

      {/* Banner for Status */}
      {isCompleted && (
        <div className="flex flex-col items-center justify-center gap-2 bg-gray-100 px-3 py-3 text-[11px] font-medium text-gray-600 shadow-inner">
          <div className="flex items-center gap-2">
            <Archive className="h-3.5 w-3.5" />
            This job is complete. Messages remain visible, but chat is read-only.
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (hasCompleteReview) {
                setIsBookingReviewsOpen(true);
              } else {
                setIsReviewPromptOpen(true);
              }
            }}
            className="h-8 rounded-full bg-brand px-4 text-[11px] font-bold text-white hover:bg-brand-dark"
          >
            {hasCompleteReview ? "View Review" : "Leave Review"}
          </Button>
        </div>
      )}
      {isCancelled && (
        <div className="flex items-center justify-center gap-2 bg-red-50 py-2 text-[11px] font-medium text-red-600 shadow-inner">
          <AlertCircle className="h-3.5 w-3.5" />
          This booking was cancelled. Chat is closed.
        </div>
      )}
      {isPending && !isWorker && (
        <div className="flex flex-col items-center gap-2 bg-orange-50 p-3 shadow-inner">
          <p className="text-center text-[11px] font-medium text-orange-700">
            Offer sent. You are protected once the provider accepts here.
          </p>
          {isConfirmingRevoke ? (
            <div className="flex w-full max-w-[300px] flex-col items-center gap-1.5">
              <p className="text-center text-[11px] font-bold text-red-600">
                Revoke this offer? This cancels the request.
              </p>
              <div className="flex w-full gap-2">
                <Button
                  onClick={handleRevokeOffer}
                  disabled={isUpdatingStatus}
                  size="sm"
                  className="h-8 flex-1 rounded-full bg-red-500 text-[11px] font-bold text-white hover:bg-red-600"
                >
                  {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, revoke"}
                </Button>
                <Button
                  onClick={() => setIsConfirmingRevoke(false)}
                  disabled={isUpdatingStatus}
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 rounded-full border-gray-300 text-[11px] font-bold text-ink hover:bg-gray-50"
                >
                  Keep offer
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsConfirmingRevoke(true)}
              disabled={isUpdatingStatus}
              size="sm"
              variant="outline"
              className="h-8 rounded-full border-red-300 px-4 text-[11px] font-bold text-red-600 hover:bg-red-50"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Revoke Offer
            </Button>
          )}
        </div>
      )}
      {isPending && isWorker && (
        <div className="flex flex-col items-center gap-2 bg-orange-50 p-3 shadow-inner">
          <p className="text-center text-[11px] font-medium text-orange-700">
            You have an offer. Accept here to start — your pay and reviews stay protected. Accept only if you agree to the work details.
          </p>
          <Button 
            onClick={handleApproveRequest}
            disabled={isUpdatingStatus}
            size="sm"
            className="h-8 rounded-full bg-brand px-4 text-[11px] font-bold text-white hover:bg-brand-dark"
          >
            {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
            Accept Offer
          </Button>
        </div>
      )}

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto overscroll-contain space-y-4 px-4 pt-4 pb-28">
        <div className="mx-auto max-w-[280px] rounded-xl bg-white p-3 text-center shadow-sm border border-gray-100">
          <p className="text-[11px] font-semibold text-ink">Booking Details</p>
          <p className="mt-1 text-[10px] text-ink-subtle">
            {isPending
              ? "This work isn't confirmed yet. Confirm here before starting so your pay and reviews are protected."
              : "Keep all communications within Akazek to ensure your safety and protection."}
          </p>
        </div>

        {messages.map((msg) => {
          if (isSystemMessage(msg.content)) {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="max-w-[300px] rounded-full bg-black/[0.04] px-3 py-1.5 text-center text-[10px] font-medium text-ink-subtle">
                  {msg.content}
                </div>
              </div>
            );
          }

          const isMe = msg.senderId === user.id;

          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMe={isMe}
              currentUserId={user.id}
              isReadOnly={isReadOnly}
              isHighlighted={highlightedMessageId === msg.id}
              isActionsOpen={activeMessageActionsId === msg.id}
              showActionsFull={actionsShowFull}
              canModify={canModifyMessage(msg)}
              skinTone={skinTone}
              onChangeSkinTone={handleChangeSkinTone}
              onOpenReact={() => { setActionsShowFull(false); setActiveMessageActionsId(msg.id); }}
              onOpenFull={() => { setActionsShowFull(true); setActiveMessageActionsId(msg.id); }}
              onCloseActions={() => setActiveMessageActionsId(null)}
              onReply={() => {
                setActiveMessageActionsId(null);
                setEditingMessage(null);
                setReplyTarget(msg);
                inputRef.current?.focus();
              }}
              onReact={(emoji) => handleToggleReaction(msg.id, emoji)}
              onQuickReact={() => handleToggleReaction(msg.id, applySkinTone(QUICK_TAP_EMOJI, skinTone))}
              onCopy={() => handleCopyMessage(msg.content)}
              onEdit={() => handleStartEdit(msg)}
              onDelete={() => handleDeleteMessage(msg.id)}
              onQuoteClick={scrollToMessage}
            />
          );
        })}
        {showPendingNudge && (
          <div className="mx-auto max-w-[300px] rounded-xl border border-brand/25 bg-brand/[0.06] p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-brand">
                  {isWorker ? "Ready to start?" : `Waiting for ${partner?.firstName || "the provider"}`}
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-ink-subtle">
                  {isWorker
                    ? "Tap Accept to start the job. Your pay and reviews are protected here."
                    : `${partner?.firstName || "The provider"} has not accepted yet. Do not pay or start outside Akazek — you are protected once they accept here.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNudgeDismissBaseline(messages.length)}
                aria-label="Dismiss reminder"
                className="rounded-full p-0.5 text-ink-subtle hover:bg-black/5 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {isWorker ? (
              <Button
                onClick={handleApproveRequest}
                disabled={isUpdatingStatus}
                size="sm"
                className="mt-2 h-9 w-full rounded-full bg-brand text-[12px] font-bold text-white hover:bg-brand-dark"
              >
                {isUpdatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                Accept Offer
              </Button>
            ) : (
              <Button
                onClick={handleRemindPartner}
                disabled={isSending}
                size="sm"
                variant="outline"
                className="mt-2 h-9 w-full rounded-full border-brand/30 text-[12px] font-bold text-brand hover:bg-brand/5"
              >
                {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Remind {partner?.firstName || "provider"}</>}
              </Button>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white p-4 pb-8 shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
        {editingMessage ? (
          <div className="mb-2 flex items-center gap-2 rounded-xl border-l-2 border-amber-400 bg-amber-50 px-3 py-2">
            <Pencil className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-amber-600">Editing message</p>
              <p className="line-clamp-1 text-[12px] text-ink-subtle">{editingMessage.content}</p>
            </div>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cancel edit"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : replyTarget && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border-l-2 border-brand/40 bg-gray-50 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-brand">
                {replyTarget.senderId === user?.id ? "You" : replyTarget.sender.firstName}
              </p>
              <p className="line-clamp-1 text-[12px] text-ink-subtle">{replyTarget.content}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cancel reply"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            placeholder={isReadOnly ? "This conversation is read-only" : editingMessage ? "Edit your message..." : "Type a message..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isReadOnly}
            rows={1}
            className="min-h-[44px] max-h-[120px] flex-1 resize-none rounded-2xl border-gray-200 bg-gray-50 px-5 py-3 focus:ring-1 focus:ring-brand/20 scrollbar-hide"
          />
          <Button
            onClick={() => editingMessage ? handleSaveEdit() : handleSendMessage()}
            size="icon"
            disabled={!newMessage.trim() || isSending || isReadOnly}
            className="h-11 w-11 flex-shrink-0 rounded-full bg-brand text-white hover:bg-brand-dark"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingMessage ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ChatRoom;
