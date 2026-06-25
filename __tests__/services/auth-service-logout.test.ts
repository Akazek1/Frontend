import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "@/lib/axios";
import { unregisterFcmToken } from "@/services/fcm-token-service";
import { clearPersistedQueryCache } from "@/lib/query-persistence";
import { clearAppQueryClient } from "@/lib/query-client";
import authService from "@/services/auth-service";

// These are the security-critical side effects of logout: without them, a
// shared device keeps the previous user's push token + cached query data
// (both on disk and in memory).
vi.mock("@/services/fcm-token-service", () => ({
  unregisterFcmToken: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/query-persistence", () => ({
  clearPersistedQueryCache: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/query-client", () => ({
  clearAppQueryClient: vi.fn(),
}));

describe("authService.logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
  });

  it("unregisters FCM, clears persisted cache, revokes the session, and clears the local token", async () => {
    await authService.logout();

    expect(unregisterFcmToken).toHaveBeenCalledTimes(1);
    expect(clearPersistedQueryCache).toHaveBeenCalledTimes(1);
    expect(clearAppQueryClient).toHaveBeenCalledTimes(1);
    // Endpoint is what matters; logout passes extra opts (e.g. skipAuthRedirect).
    expect((api.post as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe("/auth/logout");
    expect(localStorage.removeItem).toHaveBeenCalledWith("token");
  });

  it("still clears the session when FCM unregister fails (shared-device safety)", async () => {
    (unregisterFcmToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("no service worker"),
    );

    await authService.logout();

    expect(clearPersistedQueryCache).toHaveBeenCalledTimes(1);
    // Endpoint is what matters; logout passes extra opts (e.g. skipAuthRedirect).
    expect((api.post as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe("/auth/logout");
    expect(localStorage.removeItem).toHaveBeenCalledWith("token");
  });

  it("clears the local token even if the server logout call fails", async () => {
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("network"));

    await authService.logout();

    expect(localStorage.removeItem).toHaveBeenCalledWith("token");
  });
});
