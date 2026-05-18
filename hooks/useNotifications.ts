"use client";

import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import api from "@/lib/axios";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  status: "PENDING" | "SENT" | "FAILED" | "READ";
  readAt: string | null;
  createdAt: string;
  metadata?: Record<string, any> | null;
}

interface UseNotificationsOptions {
  limit?: number;
  page?: number;
}

export function useNotifications({ limit = 5, page = 1 }: UseNotificationsOptions = {}) {
  const { user } = useSelector((state: RootState) => state.auth);
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
