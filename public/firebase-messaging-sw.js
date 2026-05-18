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
    icon: "/hwa-green-icon.png",
    badge: "/hwa-green-icon.png",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
