"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import BackButtonHeader from "@/components/header/back-button-header";
import {
  AppButton,
  Card,
  EmptyState,
  PageShell,
} from "@/components/ui/app-primitives";
import { NotificationItem, getNotificationHref } from "@/hooks/useNotifications";
import {
  NotificationFilter,
  NotificationRow,
  filterNotifications,
  getNotificationFilterCounts,
  groupNotificationsByDate,
  notificationFilters,
} from "@/components/notifications/notification-row";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const NotificationHistoryPage = () => {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");

  const load = useCallback(async (nextPage: number, append: boolean) => {
    try {
      if (append) setLoadingMore(true); else setLoading(true);
      const res = await api.get(`/users/notifications`, { params: { page: nextPage, limit: PAGE_SIZE } });
      const payload = res.data?.data ?? res.data;
      const newItems: NotificationItem[] = payload?.items ?? [];
      setItems((prev) => {
        if (!append) return newItems;
        const existingIds = new Set(prev.map((item) => item.id));
        return [...prev, ...newItems.filter((item) => !existingIds.has(item.id))];
      });
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
    const href = getNotificationHref(n);
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
  const counts = useMemo(() => getNotificationFilterCounts(items), [items]);
  const filteredItems = useMemo(
    () => filterNotifications(items, activeFilter),
    [activeFilter, items],
  );
  const groupedItems = useMemo(() => groupNotificationsByDate(filteredItems), [filteredItems]);
  const allLoadedNotificationsRead = items.length === 0 || items.every((n) => !!n.readAt || n.status === "READ");

  return (
    <PageShell className="gap-5">
      <div className="flex items-center justify-between gap-3">
        <BackButtonHeader text="Notifications" fallbackHref="/more/notifications" />

        <button
          type="button"
          onClick={handleMarkAll}
          disabled={allLoadedNotificationsRead}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#DCE8DA] bg-white text-brand shadow-sm disabled:text-gray-300"
          aria-label="Mark all notifications as read"
          title="Mark all as read"
        >
          <CheckCheck className="h-5 w-5" />
        </button>
      </div>

      <div className="-mx-5 overflow-x-auto px-5 scrollbar-hide">
        <div className="flex min-w-max gap-2">
          {notificationFilters.map((filter) => {
            const active = activeFilter === filter.id;
            const count = filter.id === "all" && total > counts.all ? total : counts[filter.id];

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-bold transition-colors",
                  active
                    ? "border-[#10851B] bg-[#10851B] text-white shadow-sm"
                    : "border-[#DCE8DA] bg-white text-ink",
                )}
              >
                {filter.label}
                {filter.showCount && count > 0 && (
                  <span
                    className={cn(
                      "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px]",
                      active ? "bg-white/20 text-white" : "bg-[#EAF8E9] text-[#10851B]",
                    )}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={items.length === 0 ? "No notifications yet" : "Nothing here yet"}
          description={
            items.length === 0
              ? "When something important happens, it will show up here."
              : "Try another filter to see more notifications."
          }
        />
      ) : (
        <div className="space-y-5">
          {groupedItems.map((group) => (
            <section key={group.title} className="space-y-2">
              <h2 className="px-1 text-[15px] font-bold text-[#616161]">{group.title}</h2>
              <Card variant="list" className="overflow-hidden rounded-xl">
                {group.items.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onClick={handleClick}
                  />
                ))}
              </Card>
            </section>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <AppButton
                type="button"
                onClick={() => load(page + 1, true)}
                disabled={loadingMore}
                appVariant="secondary"
                className="h-10 rounded-full px-5"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </AppButton>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
};

export default NotificationHistoryPage;
