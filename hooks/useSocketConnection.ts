"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import type { RootState } from "@/store";
import { initializeSocket, disconnectSocket } from "@/lib/socket";

/**
 * Manages the Socket.IO lifecycle at the app level:
 * - Connects immediately when the user logs in (so presence is visible right away)
 * - Disconnects on logout (so green dots disappear immediately)
 * - Listens for newNotification on EVERY page (not just the home page where the
 *   Header/bell lives) so toast popups always fire regardless of current route.
 */
export function useSocketConnection() {
  const { isAuthenticated, token, user } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    if (!isAuthenticated || !token || !user?.id) {
      disconnectSocket();
      return;
    }

    const socket = initializeSocket(token, user.id);

    // Global notification toast — fires on every page
    const handleNewNotification = (notification: { title: string; body: string }) => {
      console.log("🔔 [socket] newNotification received:", notification);
      toast.success(`${notification.title}\n${notification.body}`, {
        duration: 5000,
        style: { fontSize: "13px", maxWidth: "320px" },
      });
    };

    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
      // Do NOT disconnect here — only on auth state change (handled above).
    };
  }, [isAuthenticated, token, user?.id]);
}
