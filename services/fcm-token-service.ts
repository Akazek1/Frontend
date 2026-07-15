"use client";

import { deleteToken, getToken } from "firebase/messaging";
import api from "@/lib/axios";
import { getMessagingInstance } from "@/lib/firebase";
import { getAppServiceWorkerRegistration } from "@/lib/service-worker-registration";

// Per-device push opt-out, set by the "Notifications on this device" toggle in
// /more/notifications. Checked here, at the single place tokens are minted, so
// no auto-registration path (e.g. the silent re-register on login in
// usePushNotifications) can undo the user's choice on the next app launch.
export const DEVICE_PUSH_KEY = "huza-device-push";

export function isDevicePushOptedOut() {
  return (
    typeof window !== "undefined" && localStorage.getItem(DEVICE_PUSH_KEY) === "off"
  );
}

export async function registerFcmToken() {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (isDevicePushOptedOut()) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) return null;

  const messaging = await getMessagingInstance();
  const serviceWorkerRegistration = await getAppServiceWorkerRegistration();
  if (!messaging || !serviceWorkerRegistration) return null;

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  });

  if (token) {
    await api.patch("/users/fcm-token", { token });
  }

  return token;
}

export async function unregisterFcmToken() {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) return;

  const messaging = await getMessagingInstance();
  const serviceWorkerRegistration = await getAppServiceWorkerRegistration();
  if (!messaging || !serviceWorkerRegistration) return;

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  }).catch(() => null);

  if (token) {
    await api.delete("/users/fcm-token", { data: { token }, skipAuthRedirect: true }).catch(() => {});
  }

  await deleteToken(messaging).catch(() => {});
}
