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

    socket.on("newNotification", handleNewNotification);
    return () => {
      socket.off("newNotification", handleNewNotification);
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

  return { items, total, unreadCount, loading, refetch: fetchNotifications, markRead, markAllRead };
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
