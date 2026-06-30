/// <reference lib="webworker" />

import { Serwist, CacheFirst, ExpirationPlugin } from "serwist";
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
    // Offline fallback for cold navigations with no network. Served from a
    // real static file (public/offline.html) so it resolves on every host,
    // including Vercel — an App Router route is NOT reliably servable at the
    // precached "/offline.html" path.
    navigateFallback: "/offline.html",
    navigateFallbackDenylist: [/^\/api\//, /^\/_next\/image/],
  },
  disableDevLogs: true,
  // Prompted update (not silent): the new SW waits until the user taps
  // "Reload" in the PwaLifecycle toast, so active chat/booking/draft flows
  // aren't reloaded out from under the user.
  skipWaiting: false,
  clientsClaim: false,
  runtimeCaching: [
    {
      // The Rwanda village dataset (~2.5 MB / ~270 KB gzip) is fetched on demand
      // by the SectorPicker. Cache it across sessions so low-bandwidth users
      // download it at most once. It's immutable, so cache-first is safe.
      matcher: ({ url }: { url: URL }) => url.pathname === "/rwanda-villages.json",
      handler: new CacheFirst({
        cacheName: "rwanda-villages",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 1,
            maxAgeSeconds: 30 * 24 * 60 * 60,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
  ],
});

serwist.addEventListeners();
