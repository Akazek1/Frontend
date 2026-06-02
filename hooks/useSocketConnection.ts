"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import type { AppDispatch, RootState } from "@/store";
import { persistor } from "@/store";
import { initializeSocket, disconnectSocket } from "@/lib/socket";
import { getAuthToken } from "@/lib/auth-utils";
import { logout } from "@/store/slices/auth-slice";

/**
 * Manages the Socket.IO lifecycle at the app level:
 * - Connects immediately when the user logs in (so presence is visible right away)
 * - Disconnects on logout (so green dots disappear immediately)
 * - Listens for newNotification on EVERY page (not just the home page where the
 *   Header/bell lives) so toast popups always fire regardless of current route.
 */
export function useSocketConnection() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, token, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const effectiveToken = token || getAuthToken();
  const effectiveIsAuthenticated = isAuthenticated || Boolean(effectiveToken);

  useEffect(() => {
    if (!effectiveIsAuthenticated || !effectiveToken || !user?.id) {
      disconnectSocket();
      return;
    }

    const socket = initializeSocket(effectiveToken, user.id);

    // Global notification toast — fires on every page
    const handleNewNotification = (notification: { title: string; body: string }) => {
      console.log("🔔 [socket] newNotification received:", notification);
      toast.success(`${notification.title}\n${notification.body}`, {
        duration: 5000,
        style: { fontSize: "13px", maxWidth: "320px" },
      });
    };

    const handleForceLogout = async (payload?: { reason?: string }) => {
      toast.error(payload?.reason || "Your session was ended. Please log in again.");
      await dispatch(logout());
      await persistor.purge();
      disconnectSocket();
      window.location.href = "/onboarding";
    };

    socket.on("newNotification", handleNewNotification);
    socket.on("forceLogout", handleForceLogout);

    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("forceLogout", handleForceLogout);
      // Do NOT disconnect here — only on auth state change (handled above).
    };
  }, [dispatch, effectiveIsAuthenticated, effectiveToken, user?.id]);
}
