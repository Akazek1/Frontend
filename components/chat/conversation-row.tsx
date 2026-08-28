"use client";

import { useTranslations } from "next-intl";
import { Check, CheckCheck, ChevronRight, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";

/**
 * THE inbox row — used by every Messages list regardless of who is chatting
 * (client, worker, agency, company). Presentational only: each list maps its
 * own data into `ConversationRowData` and this decides how a conversation
 * looks. Add an affordance here and every inbox gets it.
 */
export interface ConversationRowData {
  /** Row key + the thing the click handler routes on. */
  id: string;
  name: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  /** Presence dot; omit entirely when the list has no presence data. */
  isOnline?: boolean;
  /** Green sub-label — service category, or the other party's role. */
  label: string;
  /** Lifecycle pill (booking status). Conversations without one pass null. */
  pill?: { label: string; className: string } | null;
  /** Left accent bar colour class. */
  accentClassName?: string;
  /** ISO date driving the relative timestamp. */
  timestamp: string;
  preview: string;
  /** Bolds the preview — the last message is theirs and I haven't read it. */
  isUnread?: boolean;
  /** Tick state of MY last message; null when the last message isn't mine. */
  ownReceipt?: "sent" | "delivered" | "read" | null;
  unreadCount?: number;
  reviewPending?: boolean;
}

/** Relative timestamp, translated. One implementation for every inbox. */
export function useRelativeTime() {
  const t = useTranslations("chatInbox");
  return (isoDate: string): string => {
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
}

export function ConversationRow({
  data,
  onClick,
}: {
  data: ConversationRowData;
  onClick: () => void;
}) {
  const t = useTranslations("chatInbox");
  const formatTimestamp = useRelativeTime();
  const initials =
    `${data.name?.[0] ?? ""}${data.name?.split(" ")[1]?.[0] ?? ""}`.trim() || "AK";

  return (
    <button
      type="button"
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white py-3 pl-4 pr-2 text-left shadow-sm transition-colors hover:bg-gray-50"
      onClick={onClick}
    >
      {/* Status accent bar */}
      <span className={`absolute left-0 top-0 h-full w-1.5 ${data.accentClassName ?? "bg-blue-500"}`} />

      <span className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={data.avatarUrl || ""} className="object-cover" />
          <AvatarFallback className="bg-surface text-[13px] font-bold text-brand">
            {initials}
          </AvatarFallback>
        </Avatar>
        {data.isOnline !== undefined && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white shadow-sm ${
              data.isOnline ? "bg-green-500" : "bg-gray-300"
            }`}
          />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1">
            <span className="block truncate text-[15px] font-bold text-ink">{data.name}</span>
            {data.isVerified ? <VerifiedBadge size={14} /> : null}
          </span>
          <span className="text-[11px] font-medium text-[#9E9E9E]">
            {formatTimestamp(data.timestamp)}
          </span>
        </span>

        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className="block truncate text-[12.5px] font-semibold text-brand">{data.label}</span>
          {data.pill && (
            <span
              className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${data.pill.className}`}
            >
              {data.pill.label}
            </span>
          )}
        </span>

        <span className="mt-1 flex items-end justify-between gap-2">
          <span
            className={`block truncate text-[12px] leading-5 ${
              data.isUnread ? "font-bold text-ink" : "text-ink-muted"
            }`}
          >
            {data.preview}
          </span>
          <span className="flex flex-shrink-0 items-center gap-1.5">
            {data.ownReceipt === "read" ? (
              <CheckCheck className="h-3.5 w-3.5 text-[#34B7F1]" />
            ) : data.ownReceipt === "delivered" ? (
              <CheckCheck className="h-3.5 w-3.5 text-[#9E9E9E]" />
            ) : data.ownReceipt === "sent" ? (
              <Check className="h-3.5 w-3.5 text-[#9E9E9E]" />
            ) : null}
            {data.unreadCount && data.unreadCount > 0 ? (
              <span className="min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                {data.unreadCount}
              </span>
            ) : data.reviewPending ? (
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
}

/** Loading placeholder matching the row's height. */
export function ConversationRowSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-[96px] animate-pulse rounded-2xl bg-white" />
      ))}
    </div>
  );
}

/** Shared empty state, so "no messages" looks the same everywhere. */
export function ConversationEmpty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
        <MessageCircle className="h-7 w-7 text-brand" />
      </span>
      <h3 className="mt-4 text-[15px] font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-[260px] text-[12px] leading-5 text-ink-muted">{hint}</p>
    </div>
  );
}
