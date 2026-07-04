importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC-ZdFlQMQ_QWWaVmBqNZAoD_10Lo3iFAw",
  authDomain: "akazek.firebaseapp.com",
  projectId: "akazek",
  storageBucket: "akazek.firebasestorage.app",
  messagingSenderId: "335540347748",
  appId: "1:335540347748:web:384538b51c16a6fa851071",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = "/";

  if (data.bookingId) {
    targetUrl = `/conversations/inbox/${encodeURIComponent(data.bookingId)}`;
  } else if (data.jobId) {
    targetUrl = `/jobs/${encodeURIComponent(data.jobId)}`;
  }

  if (data.notificationId) {
    const separator = targetUrl.includes("?") ? "&" : "?";
    targetUrl += `${separator}notificationId=${encodeURIComponent(data.notificationId)}`;
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const url = new URL(targetUrl, self.location.origin).href;
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});
