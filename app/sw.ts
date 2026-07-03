/// <reference lib="webworker" />

import { Serwist, CacheFirst, ExpirationPlugin } from "serwist";
import type { PrecacheEntry } from "serwist";
import { defaultCache } from "@serwist/next/worker";
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
  },
  disableDevLogs: true,
  skipWaiting: true,
  clientsClaim: true,
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
    // Next.js' default caching strategies: NetworkFirst for page navigations and
    // RSC payloads (so previously-visited pages open offline), plus caching for
    // static chunks, images, and fonts. Listed after the specific matcher above
    // so that rule still wins for the village dataset.
    ...defaultCache,
  ],
  // When a page navigation misses the cache while offline (e.g. a route never
  // visited before), serve the precached static offline page instead of the
  // browser's error screen. offline.html is a self-contained static file
  // (precached via globPublicPatterns in next.config.ts), so it renders offline
  // without depending on the dynamic app shell.
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
