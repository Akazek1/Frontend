"use client";

import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import api from "@/lib/axios";
import { initializeSocket } from "@/lib/socket";
import { getAuthToken } from "@/lib/auth-utils";
import { resolveNotificationHref } from "@/lib/notification-routing";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  status: "PENDING" | "SENT" | "FAILED" | "READ";
  readAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | string | null;
}

export function parseNotificationMetadata(metadata: NotificationItem["metadata"]) {
  if (!metadata) return {};
  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return metadata;
}

export function getNotificationType(notification: NotificationItem): string | undefined {
  const type = parseNotificationMetadata(notification.metadata).type;
  return typeof type === "string" ? type : undefined;
}

// Routing lives in lib/notification-routing.ts (shared with the service
// worker's notificationclick handler) so pushed notifications and their
// in-app twins always open the same page.
export function getNotificationHref(notification: NotificationItem): string | null {
  return resolveNotificationHref(parseNotificationMetadata(notification.metadata));
}

// A notification, or several message-notifications from the same conversation
// collapsed into one row so 30 messages from one person don't show as 30
// separate entries.
export interface GroupedNotification extends NotificationItem {
  groupCount: number;
  groupIds: string[];
  groupBookingId?: string;
  groupUnread: number;
}

export function groupNotifications(items: NotificationItem[]): GroupedNotification[] {
  const result: GroupedNotification[] = [];
  const byBooking = new Map<string, GroupedNotification>();
  for (const n of items) {
    const meta = parseNotificationMetadata(n.metadata);
    const bookingId = typeof meta.bookingId === "string" ? meta.bookingId : undefined;
    const isMessage = meta.type === "NEW_MESSAGE";
    const unread = !n.readAt && n.status !== "READ" ? 1 : 0;

    // Only NEW_MESSAGE notifications collapse; other types stay individual.
    const existing = isMessage && bookingId ? byBooking.get(bookingId) : undefined;
    if (existing) {
      existing.groupCount += 1;
      existing.groupIds.push(n.id);
      existing.groupUnread += unread;
      continue; // items are newest-first, so the first one stays as the display
    }

    const grouped: GroupedNotification = {
      ...n,
      groupCount: 1,
      groupIds: [n.id],
      groupBookingId: bookingId,
      groupUnread: unread,
    };
    result.push(grouped);
    if (isMessage && bookingId) byBooking.set(bookingId, grouped);
  }
  return result;
}

interface UseNotificationsOptions {
  limit?: number;
  page?: number;
}

export function useNotifications({ limit = 5, page = 1 }: UseNotificationsOptions = {}) {
  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const effectiveToken = token || getAuthToken();
  const effectiveIsAuthenticated = isAuthenticated || Boolean(effectiveToken);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get(`/users/notifications`, { params: { page, limit } });
      const payload = res.data?.data ?? res.data;
      setItems(payload?.items ?? []);
      setTotal(payload?.total ?? 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user, page, limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time: prepend new notifications pushed via socket.
  // We call initializeSocket (idempotent) rather than getSocket() so this works
  // even when this effect runs before the global useSocketConnection effect.
  useEffect(() => {
    if (!effectiveIsAuthenticated || !effectiveToken || !user?.id) return;

    const socket = initializeSocket(effectiveToken, user.id);

    const handleNewNotification = (notification: NotificationItem) => {
      setItems((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, limit);
      });
      setTotal((t) => t + 1);
    };

    // When a conversation is opened elsewhere, its notifications are marked
    // read server-side; reflect that here so the bell badge drops live.
    const handleNotificationsRead = (data: { bookingId: string }) => {
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) =>
          parseNotificationMetadata(n.metadata).bookingId === data.bookingId && !n.readAt
            ? { ...n, status: "READ", readAt: now }
            : n,
        ),
      );
    };

    socket.on("newNotification", handleNewNotification);
    socket.on("notificationsRead", handleNotificationsRead);
    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("notificationsRead", handleNotificationsRead);
    };
  }, [effectiveIsAuthenticated, effectiveToken, user?.id, limit]);

  const unreadCount = items.filter((n) => !n.readAt && n.status !== "READ").length;

  const markRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/users/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "READ", readAt: new Date().toISOString() } : n)),
      );
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch(`/users/notifications/read-all`);
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, status: "READ", readAt: n.readAt ?? now })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  }, []);

  // Marks every notification for a conversation read at once — used when a
  // grouped message row is opened.
  const markBookingRead = useCallback(async (bookingId: string) => {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((n) =>
        parseNotificationMetadata(n.metadata).bookingId === bookingId && !n.readAt
          ? { ...n, status: "READ", readAt: now }
          : n,
      ),
    );
    try {
      await api.patch(`/users/notifications/read-by-booking/${bookingId}`);
    } catch (err) {
      console.error("Error marking conversation notifications read:", err);
    }
  }, []);

  return { items, total, unreadCount, loading, refetch: fetchNotifications, markRead, markAllRead, markBookingRead };
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "Just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString();
}
