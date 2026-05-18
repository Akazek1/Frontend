"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Briefcase, Calendar, CheckCircle, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import BackButtonHeader from "@/components/header/back-button-header";
import { NotificationItem, formatRelativeTime } from "@/hooks/useNotifications";

const PAGE_SIZE = 20;

function iconForType(type?: string) {
  switch (type) {
    case "NEW_APPLICATION":
      return Briefcase;
    case "JOB_AWARDED":
      return CheckCircle;
    case "BOOKING_CONFIRMED":
      return Calendar;
    case "BOOKING_CANCELLED":
      return XCircle;
    default:
      return Bell;
  }
}

function routeFor(n: NotificationItem): string | null {
  const meta = n.metadata || {};
  if (meta.bookingId) return `/bookings/${meta.bookingId}`;
  if (meta.jobId) return `/jobs/${meta.jobId}`;
  return null;
}

const NotificationHistoryPage = () => {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (nextPage: number, append: boolean) => {
    try {
      if (append) setLoadingMore(true); else setLoading(true);
      const res = await api.get(`/users/notifications`, { params: { page: nextPage, limit: PAGE_SIZE } });
      const payload = res.data?.data ?? res.data;
      const newItems: NotificationItem[] = payload?.items ?? [];
      setItems((prev) => (append ? [...prev, ...newItems] : newItems));
      setTotal(payload?.total ?? 0);
      setPage(nextPage);
    } catch (err) {
      console.error("Error loading notifications:", err);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(1, false);
  }, [load]);

  const handleClick = async (n: NotificationItem) => {
    if (!n.readAt) {
      try {
        await api.patch(`/users/notifications/${n.id}/read`);
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, status: "READ", readAt: new Date().toISOString() } : x)),
        );
      } catch (err) {
        console.error(err);
      }
    }
    const href = routeFor(n);
    if (href) router.push(href);
  };

  const handleMarkAll = async () => {
    try {
      await api.patch(`/users/notifications/read-all`);
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, status: "READ", readAt: n.readAt ?? now })));
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all read");
    }
  };

  const hasMore = items.length < total;

  return (
    <div className="bg-[#F1FCEF] px-6 py-11 space-y-6 min-h-screen pb-16">
      <BackButtonHeader text="Notification history" backHref="/more/notifications" />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleMarkAll}
          disabled={items.every((n) => !!n.readAt)}
          className="text-[12px] font-bold text-[#145B10] disabled:text-gray-400"
        >
          Mark all as read
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#145B10]" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-[#757575] py-10">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const Icon = iconForType(n.metadata?.type);
            const isUnread = !n.readAt;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className="w-full text-left bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-3"
              >
                <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F1FCEF]">
                  <Icon className="h-5 w-5 text-[#145B10]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`text-[14px] text-[#1B2431] ${isUnread ? "font-bold" : "font-semibold"}`}>
                      {n.title}
                    </span>
                    {isUnread && <span className="w-2 h-2 rounded-full bg-red-500" />}
                  </span>
                  <span className="mt-1 block text-[12px] leading-5 text-[#616161]">{n.body}</span>
                  <span className="mt-1 block text-[11px] font-semibold text-[#9E9E9E]">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </span>
              </button>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => load(page + 1, true)}
                disabled={loadingMore}
                className="text-[13px] font-bold text-[#145B10] disabled:text-gray-400"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationHistoryPage;
