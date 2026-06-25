/// <reference lib="webworker" />

import { Serwist } from "serwist";
import type { PrecacheEntry } from "serwist";
import { firebaseConfig } from "@/lib/firebase-config";
import { buildNotificationTargetUrl } from "@/lib/notification-routing";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
  firebase?: {
    initializeApp: (config: typeof firebaseConfig) => void;
    messaging: () => {
      onBackgroundMessage: (
        callback: (payload: {
          notification?: { title?: string; body?: string };
          data?: Record<string, string>;
        }) => void,
      ) => void;
    };
  };
};

const notificationIcon = "/icons/icon-192.png";

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = buildNotificationTargetUrl(
    event.notification.data as Record<string, unknown> | undefined,
  );

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const url = new URL(targetUrl, self.location.origin).href;
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

self.firebase?.initializeApp(firebaseConfig);
const messaging = self.firebase?.messaging();

messaging?.onBackgroundMessage((payload) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("[sw] Received background message", payload);
  }

  const notificationTitle = payload.notification?.title || "Akazek";
  const notificationOptions: NotificationOptions = {
    body: payload.notification?.body || "",
    icon: notificationIcon,
    badge: notificationIcon,
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    navigateFallback: "/offline.html",
    navigateFallbackDenylist: [
      /^\/api\//,
      /^\/_next\/image/,
      /^\/admin/,
    ],
  },
  disableDevLogs: true,
  skipWaiting: false,
  clientsClaim: false,
});

serwist.addEventListeners();
