/// <reference lib="webworker" />

import { Serwist, CacheFirst, NetworkFirst, ExpirationPlugin } from "serwist";
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

// Firebase compat scripts are self-hosted (public/firebase/*, pinned to the same
// version as the npm `firebase` SDK) instead of pulled from gstatic.com. Two
// reasons: no third-party network call at SW startup, and — critically for
// low-bandwidth/blocked networks — a failed fetch here can no longer abort the
// whole SW install. The entire FCM setup is wrapped so that if it throws, the
// SW still installs and Serwist's offline caching (the app shell) keeps working:
// the user never loses the app, they only lose background push.
try {
  importScripts(
    "/firebase/firebase-app-compat.js",
    "/firebase/firebase-messaging-compat.js",
  );

  self.firebase?.initializeApp(firebaseConfig);
  const messaging = self.firebase?.messaging();

  messaging?.onBackgroundMessage((payload) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[sw] Received background message", payload);
    }

    // Backend sends data-only messages (title/body inside `data`) so this is
    // the ONLY place a notification is displayed — a `notification` payload
    // would make the Firebase SDK show a duplicate. The fallback reads the old
    // shape in case an outdated backend is still deployed.
    const notificationTitle =
      payload.data?.title || payload.notification?.title || "Akazek";
    const notificationOptions: NotificationOptions = {
      body: payload.data?.body || payload.notification?.body || "",
      icon: notificationIcon,
      badge: notificationIcon,
      data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  // Push is best-effort; offline caching must survive a Firebase load failure.
  console.error("[sw] FCM background setup failed; push disabled", err);
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  disableDevLogs: true,
  // Updates must NOT auto-activate: the new worker waits until the user taps
  // "Reload" in the update toast (which posts SKIP_WAITING). With `true`, the
  // waiting worker would activate on install, fire `controllerchange`, and
  // hard-reload the page mid-session (e.g. while filling a booking form).
  skipWaiting: false,
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
    {
      // Page navigations must be an EXPLICIT registered route: @serwist/next's
      // defaultCache has no navigate matcher and cacheOnNavigation is false, so
      // without this the SW would register no navigation handler at all —
      // meaning nothing gets cached AND an offline navigation never reaches the
      // `fallbacks` catch handler below (it fails with a raw network error).
      // NetworkFirst gives: fresh pages online, previously-visited pages served
      // from cache offline, and — on an offline miss — a throw that triggers the
      // /offline fallback. The "pages" cache is cleared on logout
      // (lib/pwa-caches.ts SENSITIVE_SW_CACHES) so a shared device can't read
      // the previous user's authenticated pages.
      matcher: ({ request }: { request: Request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 7 * 24 * 60 * 60,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    // Next.js' default caching strategies for sub-resources: static chunks,
    // images, fonts, RSC/data payloads. Listed last so the specific matchers
    // above win for the village dataset and page navigations.
    ...defaultCache,
  ],
  // When a page navigation misses the cache while offline (e.g. a route never
  // visited before), serve the precached /offline page instead of the
  // browser's error screen. It's a real app route (precached together with its
  // chunks via additionalPrecacheEntries in next.config.ts), so the user keeps
  // the normal layout and bottom nav and can jump to any cached page.
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
