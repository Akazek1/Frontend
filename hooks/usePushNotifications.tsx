"use client";

import { useEffect, useCallback } from "react";
import { getMessagingInstance } from "@/lib/firebase";
import { onMessage } from "firebase/messaging";
import { useAuth } from "./useAuth";
import toast from "react-hot-toast";
import { registerFcmToken } from "@/services/fcm-token-service";

export const usePushNotifications = () => {
  const { user, isAuthenticated } = useAuth();

  const requestPermission = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      await registerFcmToken();
    } catch (err) {
      // Non-critical — don't surface errors to user
    }
  }, []);

  // If permission was granted previously, refresh the server-side token binding
  // silently when the user authenticates.
  useEffect(() => {
    if (!isAuthenticated || !user || typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    registerFcmToken().catch(() => undefined);
  }, [isAuthenticated, user?.id]);

  // Ask only after the authenticated user has had some activity in this tab.
  // This avoids the cold-login permission prompt while still keeping push
  // available for users who are clearly engaging with the app.
  useEffect(() => {
    if (!isAuthenticated || !user || typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "default") return;

    let interactionCount = 0;
    let requested = false;

    const onInteraction = () => {
      interactionCount += 1;
      if (requested || interactionCount < 2) return;
      requested = true;
      requestPermission();
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };

    window.addEventListener("click", onInteraction, { passive: true });
    window.addEventListener("keydown", onInteraction);

    return () => {
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };
  }, [isAuthenticated, user?.id, requestPermission]); // user?.id prevents re-run on unrelated user object updates

  // Set up foreground message listener once per session
  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribe: (() => void) | undefined;

    getMessagingInstance().then((messaging) => {
      if (messaging) {
        unsubscribe = onMessage(messaging, (payload) => {
          const title = payload.notification?.title || "Notification";
          const body = payload.notification?.body || "";
          toast.success(`${title}: ${body}`, { duration: 5000 });
        });
      }
    });

    return () => { unsubscribe?.(); };
  }, [isAuthenticated]); // only re-run on auth change, not on every render

  return { requestPermission };
};
