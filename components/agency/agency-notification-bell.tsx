"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationRow } from "@/components/notifications/notification-row";
import { useNotifications, getNotificationHref, type NotificationItem } from "@/hooks/useNotifications";
import { useAgency } from "@/context/agency-context";

export function AgencyNotificationBell() {
  const router = useRouter();
  const { items, unreadCount, refetch, markRead } = useNotifications({ limit: 10 });
  const { refresh } = useAgency();

  // Keep the bell + sidebar badges reasonably live without sockets.
  useEffect(() => {
    const t = setInterval(() => { refetch(); refresh(); }, 30000);
    return () => clearInterval(t);
  }, [refetch, refresh]);

  const handleClick = async (n: NotificationItem) => {
    if (!n.readAt) await markRead(n.id);
    const href = getNotificationHref(n);
    if (href) router.push(href);
    // Refresh counts after acting on a notification.
    refresh();
  };

  return (
    <Popover onOpenChange={(open) => { if (open) refetch(); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-gray-100"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border border-white bg-red-500 px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] max-w-[calc(100vw-24px)] rounded-2xl border-gray-100 bg-white p-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="text-[14px] font-bold text-ink">Notifications</p>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">{unreadCount} new</span>
          )}
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-[12px] text-ink-subtle">No notifications yet.</p>
          ) : (
            items.map((n) => (
              <NotificationRow key={n.id} notification={n} onClick={handleClick} variant="compact" />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
