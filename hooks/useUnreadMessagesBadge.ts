"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { listConversations } from "@/lib/conversations";
import { useSocketEvent } from "@/hooks/useSocketEvent";

const seenKey = (userId: string) => `huza:messages-seen-at:${userId}`;

/**
 * The number on the Messages tab: how many chats have something new since the
 * user last opened Messages — one per chat, however many messages it holds. It is a nudge to open the tab, not a read tracker — opening
 * Messages clears it even if individual chats stay unread (those keep their own
 * per-chat badges inside the list).
 */
export function useUnreadMessagesBadge(): number {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const userId = user?.id;
  const onMessages = pathname.startsWith("/conversations");
  const [seenAt, setSeenAt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    try {
      setSeenAt(Number(localStorage.getItem(seenKey(userId))) || 0);
    } catch {
      /* storage unavailable: the badge just shows every unread message */
    }
  }, [userId]);

  const { data } = useQuery({
    queryKey: ["messages-badge", userId],
    queryFn: listConversations,
    enabled: Boolean(token && userId),
    staleTime: 15_000,
    refetchInterval: 60_000,
  });

  const markSeen = useCallback(() => {
    if (!userId) return;
    const now = Date.now();
    setSeenAt(now);
    try {
      localStorage.setItem(seenKey(userId), String(now));
    } catch {
      /* ignore */
    }
  }, [userId]);

  // Being on Messages counts as having seen everything that has arrived.
  useEffect(() => {
    if (onMessages) markSeen();
  }, [onMessages, data, markSeen]);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["messages-badge", userId] });
  }, [queryClient, userId]);
  useSocketEvent("newMessage", refresh, Boolean(userId));
  useSocketEvent("conversationMessage", refresh, Boolean(userId));

  if (onMessages || !data) return 0;
  return data.reduce((total, c) => {
    const last = c.lastMessage;
    if (!last || last.mine || new Date(last.createdAt).getTime() <= seenAt) return total;
    return total + (c.unreadCount ? 1 : 0);
  }, 0);
}
