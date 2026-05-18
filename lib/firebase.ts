import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC-ZdFlQMQ_QWWaVmBqNZAoD_10Lo3iFAw",
  authDomain: "akazek.firebaseapp.com",
  projectId: "akazek",
  storageBucket: "akazek.firebasestorage.app",
  messagingSenderId: "335540347748",
  appId: "1:335540347748:web:384538b51c16a6fa851071",
  measurementId: "G-18Q2YRTEP1"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const getMessagingInstance = async (): Promise<Messaging | null> => {
  try {
    const isSupported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
    if (!isSupported) return null;
    return getMessaging(app);
  } catch (err) {
    console.error("Firebase Messaging not supported:", err);
    return null;
  }
};

export { app };
