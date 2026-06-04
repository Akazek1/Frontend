"use client";

import {
  Bell,
  Briefcase,
  Calendar,
  CheckCircle,
  CreditCard,
  MessageCircle,
  Star,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NotificationItem,
  formatRelativeTime,
  getNotificationType,
} from "@/hooks/useNotifications";

export type NotificationFilter = "all" | "unread" | "jobs" | "payments";

export const notificationFilters: Array<{
  id: NotificationFilter;
  label: string;
  showCount?: boolean;
}> = [
  { id: "all", label: "All", showCount: true },
  { id: "unread", label: "Unread", showCount: true },
  { id: "jobs", label: "Jobs" },
  { id: "payments", label: "Payments" },
];

type NotificationTone = "green" | "blue" | "gold" | "red" | "purple";
type NotificationCategory = Exclude<NotificationFilter, "all" | "unread"> | "messages" | "system";

interface NotificationPresentation {
  Icon: LucideIcon;
  tone: NotificationTone;
  category: NotificationCategory;
}

const toneClasses: Record<NotificationTone, { icon: string; bg: string }> = {
  green: { icon: "text-[#10851B]", bg: "bg-[#EAF8E9]" },
  blue: { icon: "text-[#2F6EA5]", bg: "bg-[#EAF4FF]" },
  gold: { icon: "text-[#E7A600]", bg: "bg-[#FFF7DD]" },
  red: { icon: "text-[#B42318]", bg: "bg-[#FEECEC]" },
  purple: { icon: "text-[#7C4DAD]", bg: "bg-[#F1E8FF]" },
};

export function getNotificationPresentation(notification: NotificationItem): NotificationPresentation {
  const type = getNotificationType(notification);
  const title = `${notification.title} ${notification.body}`.toLowerCase();

  switch (type) {
    case "NEW_APPLICATION":
    case "HIRE_REQUEST":
    case "JOB_AWARDED":
      return { Icon: Briefcase, tone: "green", category: "jobs" };
    case "BOOKING_CONFIRMED":
      return { Icon: Calendar, tone: "blue", category: "jobs" };
    case "BOOKING_CANCELLED":
    case "APPLICATION_REJECTED":
    case "JOB_FILLED":
      return { Icon: XCircle, tone: "red", category: "jobs" };
    case "NEW_REVIEW":
      return { Icon: Star, tone: "gold", category: "jobs" };
    case "NEW_MESSAGE":
      return { Icon: MessageCircle, tone: "green", category: "messages" };
    default:
      break;
  }

  if (title.includes("payment") || title.includes("paid") || title.includes("rwf")) {
    return { Icon: CreditCard, tone: "green", category: "payments" };
  }

  if (title.includes("review") || title.includes("reminder")) {
    return { Icon: Star, tone: "gold", category: "jobs" };
  }

  if (title.includes("message")) {
    return { Icon: MessageCircle, tone: "green", category: "messages" };
  }

  if (title.includes("verified") || title.includes("verification")) {
    return { Icon: CheckCircle, tone: "blue", category: "system" };
  }

  return { Icon: Bell, tone: "purple", category: "system" };
}

export function filterNotifications(items: NotificationItem[], filter: NotificationFilter) {
  if (filter === "all") return items;
  if (filter === "unread") return items.filter((item) => !item.readAt && item.status !== "READ");
  return items.filter((item) => getNotificationPresentation(item).category === filter);
}

export function getNotificationFilterCounts(items: NotificationItem[]) {
  return notificationFilters.reduce<Record<NotificationFilter, number>>(
    (counts, filter) => {
      counts[filter.id] = filterNotifications(items, filter.id).length;
      return counts;
    },
    { all: 0, unread: 0, jobs: 0, payments: 0 },
  );
}

export function groupNotificationsByDate(items: NotificationItem[]) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

  const groups = [
    { title: "Today", items: [] as NotificationItem[] },
    { title: "Yesterday", items: [] as NotificationItem[] },
    { title: "Earlier", items: [] as NotificationItem[] },
  ];

  items.forEach((item) => {
    const createdAt = new Date(item.createdAt);
    if (isSameDay(createdAt, today)) {
      groups[0].items.push(item);
    } else if (isSameDay(createdAt, yesterday)) {
      groups[1].items.push(item);
    } else {
      groups[2].items.push(item);
    }
  });

  return groups.filter((group) => group.items.length > 0);
}

interface NotificationRowProps {
  notification: NotificationItem;
  onClick?: (notification: NotificationItem) => void;
  variant?: "compact" | "history";
}

export function NotificationRow({
  notification,
  onClick,
  variant = "history",
}: NotificationRowProps) {
  const { Icon, tone } = getNotificationPresentation(notification);
  const isUnread = !notification.readAt && notification.status !== "READ";
  const styles = toneClasses[tone];
  const isCompact = variant === "compact";

  return (
    <button
      type="button"
      onClick={() => onClick?.(notification)}
      className={cn(
        "flex w-full text-left transition-colors",
        isCompact
          ? "gap-3 rounded-xl px-2 py-3 hover:bg-gray-50"
          : "gap-3 border-b border-gray-100 bg-white px-4 py-4 last:border-b-0 hover:bg-[#F8FFF7]",
        isUnread && (isCompact ? "bg-surface/60" : "bg-[#F8FFF7]"),
      )}
    >
      <span
        className={cn(
          "flex flex-shrink-0 items-center justify-center rounded-full",
          styles.bg,
          isCompact ? "mt-0.5 h-9 w-9" : "h-12 w-12",
        )}
      >
        <Icon className={cn(styles.icon, isCompact ? "h-4 w-4" : "h-5 w-5")} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "min-w-0 flex-1 text-ink",
              isCompact ? "text-[13px]" : "text-[15px]",
              isUnread ? "font-bold" : "font-semibold",
            )}
          >
            {notification.title}
          </span>
          <span
            className={cn(
              "flex-shrink-0 whitespace-nowrap font-semibold text-[#757575]",
              isCompact ? "text-[10px]" : "text-[12px]",
            )}
          >
            {formatRelativeTime(notification.createdAt)}
          </span>
        </span>

        <span
          className={cn(
            "mt-1 block text-[#616161]",
            isCompact ? "line-clamp-2 text-[11px] leading-4" : "text-[13px] leading-5",
          )}
        >
          {notification.body}
        </span>
      </span>

      {isUnread && (
        <span
          className={cn(
            "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#10851B]",
            isCompact && "hidden",
          )}
          aria-label="Unread notification"
        />
      )}
    </button>
  );
}
