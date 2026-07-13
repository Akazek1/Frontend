"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import type { AppDispatch, RootState } from "@/store";
import { persistor } from "@/store";
import { initializeSocket, disconnectSocket } from "@/lib/socket";
import { getAuthToken } from "@/lib/auth-utils";
import { isDevicePushOptedOut } from "@/services/fcm-token-service";
import { logout, updateUser } from "@/store/slices/auth-slice";

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

    // Global notification toast — fires on every page. Skipped when push is
    // active on this device: the same event also arrives through FCM and
    // usePushNotifications shows a richer, tappable toast — both firing gave
    // users every in-app notification twice. This socket toast remains the
    // fallback for users without notification permission.
    const handleNewNotification = (notification: { title: string; body: string }) => {
      if (
        "Notification" in window &&
        Notification.permission === "granted" &&
        !isDevicePushOptedOut()
      ) {
        return;
      }
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
      window.location.href = "/";
    };

    // Cross-device availability sync — when the worker flips "Available
    // for work" on another tab/device, the backend emits this so every
    // session updates Redux and re-derives the card badges in real time.
    const handleAvailabilityChanged = (payload: { userId: string; available: boolean }) => {
      if (!payload || payload.userId !== user.id) return;
      dispatch(updateUser({ availableForWork: payload.available } as any));
    };

    socket.on("newNotification", handleNewNotification);
    socket.on("forceLogout", handleForceLogout);
    socket.on("availabilityChanged", handleAvailabilityChanged);

    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("forceLogout", handleForceLogout);
      socket.off("availabilityChanged", handleAvailabilityChanged);
      // Do NOT disconnect here — only on auth state change (handled above).
    };
  }, [dispatch, effectiveIsAuthenticated, effectiveToken, user?.id]);
}
