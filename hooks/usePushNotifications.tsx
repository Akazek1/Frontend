"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { getMessagingInstance } from "@/lib/firebase";
import { onMessage } from "firebase/messaging";
import { useAuth } from "./useAuth";
import toast from "react-hot-toast";
import { registerFcmToken } from "@/services/fcm-token-service";
import { getNotificationHref, type NotificationItem } from "./useNotifications";
import api from "@/lib/axios";

export const usePushNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

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
          // Data-only messages carry title/body in `data` (see backend
          // sendPushNotification); fall back to the old `notification` shape.
          const title = payload.data?.title || payload.notification?.title || "Notification";
          const body = payload.data?.body || payload.notification?.body || "";
          const data = (payload.data || {}) as Record<string, unknown>;
          // Route to the SAME place tapping the notification in the in-app list
          // would (e.g. a hire request → /work?tab=requests, not the empty
          // inbox), by reusing the canonical resolver.
          const href = getNotificationHref({ metadata: data } as NotificationItem);
          const notificationId =
            typeof data.notificationId === "string" ? data.notificationId : null;

          toast.custom(
            (t) => (
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  toast.dismiss(t.id);
                  if (notificationId) {
                    api
                      .patch(`/users/notifications/${notificationId}/read`)
                      .catch(() => undefined);
                  }
                  if (href) router.push(href);
                }}
                className="pointer-events-auto flex w-[min(92vw,380px)] cursor-pointer items-start gap-3 rounded-xl border border-[#E1EBDD] bg-white p-3 shadow-[0_10px_28px_rgba(0,0,0,0.14)]"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F7E5] text-brand">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-ink">{title}</p>
                  {body && (
                    <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-[#4B5563]">
                      {body}
                    </p>
                  )}
                  {href && (
                    <p className="mt-1 text-[12px] font-semibold text-brand">Tap to open</p>
                  )}
                </div>
              </div>
            ),
            { duration: 6000 },
          );
        });
      }
    });

    return () => { unsubscribe?.(); };
  }, [isAuthenticated]); // only re-run on auth change, not on every render

  return { requestPermission };
};
