import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import api from "@/lib/axios";
import { getToken, deleteToken } from "firebase/messaging";
import { getMessagingInstance } from "@/lib/firebase";
import { getAppServiceWorkerRegistration } from "@/lib/service-worker-registration";
import { registerFcmToken, unregisterFcmToken } from "@/services/fcm-token-service";

vi.mock("firebase/messaging", () => ({
  getToken: vi.fn(),
  deleteToken: vi.fn(),
}));
vi.mock("@/lib/firebase", () => ({ getMessagingInstance: vi.fn() }));
vi.mock("@/lib/service-worker-registration", () => ({
  getAppServiceWorkerRegistration: vi.fn(),
}));

const fakeMessaging = {} as never;
const fakeRegistration = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "test-vapid-key");
  // The service early-returns unless Notification exists in the window.
  Object.defineProperty(window, "Notification", {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("registerFcmToken", () => {
  it("skips registration when no VAPID key is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "");

    expect(await registerFcmToken()).toBeNull();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("skips registration when the service worker is unavailable", async () => {
    (getMessagingInstance as ReturnType<typeof vi.fn>).mockResolvedValue(fakeMessaging);
    (getAppServiceWorkerRegistration as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    expect(await registerFcmToken()).toBeNull();
    expect(getToken).not.toHaveBeenCalled();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("binds getToken to the app's SW registration and persists the token", async () => {
    (getMessagingInstance as ReturnType<typeof vi.fn>).mockResolvedValue(fakeMessaging);
    (getAppServiceWorkerRegistration as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeRegistration,
    );
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue("fcm-token-123");
    (api.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

    const result = await registerFcmToken();

    expect(getToken).toHaveBeenCalledWith(fakeMessaging, {
      vapidKey: "test-vapid-key",
      serviceWorkerRegistration: fakeRegistration,
    });
    expect(api.patch).toHaveBeenCalledWith("/users/fcm-token", { token: "fcm-token-123" });
    expect(result).toBe("fcm-token-123");
  });
});

describe("unregisterFcmToken", () => {
  it("removes the token server-side and deletes it on the device", async () => {
    (getMessagingInstance as ReturnType<typeof vi.fn>).mockResolvedValue(fakeMessaging);
    (getAppServiceWorkerRegistration as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeRegistration,
    );
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue("fcm-token-123");
    (api.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    (deleteToken as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    await unregisterFcmToken();

    expect(api.delete).toHaveBeenCalledWith(
      "/users/fcm-token",
      expect.objectContaining({ data: { token: "fcm-token-123" } }),
    );
    expect(deleteToken).toHaveBeenCalledWith(fakeMessaging);
  });
});
