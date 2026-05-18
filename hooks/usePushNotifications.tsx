"use client";

import { useEffect, useCallback } from "react";
import { getMessagingInstance } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import api from "@/lib/axios";
import { useAuth } from "./useAuth";
import toast from "react-hot-toast";

export const usePushNotifications = () => {
  const { user, isAuthenticated } = useAuth();

  const requestPermission = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) return;

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) return; // skip entirely if VAPID key not configured

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const messaging = await getMessagingInstance();
      if (!messaging) return;

      const token = await getToken(messaging, { vapidKey });
      if (token) {
        await api.patch("/users/fcm-token", { token });
      }
    } catch (err) {
      // Non-critical — don't surface errors to user
    }
  }, []);

  // Register token once when user first authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      requestPermission();
    }
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
