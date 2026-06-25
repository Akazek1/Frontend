import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, Messaging } from "firebase/messaging";
import { firebaseConfig } from "@/lib/firebase-config";

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
