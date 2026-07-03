import axios from "axios";
import { getAuthToken } from "@/lib/auth-utils";

// Per-request opt-out for the global 401 handling below. Set on "enhancement"
// calls — optional, authenticated helper requests fired from otherwise-public
// pages (e.g. /jobs/my-applications on the home feed). A 401 on these must NOT
// clear the session or hard-redirect to home; the caller handles it quietly.
declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

// Determine the API base URL
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000,
});

// Persist a freshly-minted access token everywhere the app reads it, so the
// next request (and middleware route-gating) sees the renewed session.
function storeAccessToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
  // Match the access-token lifetime so middleware doesn't bounce a user whose
  // token is still valid. The session lasts until explicit sign-out.
  document.cookie = `token=${token}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

// Silent refresh: exchange the HttpOnly refresh cookie for a new access token.
// De-duplicated so a burst of parallel 401s triggers only one /auth/refresh.
// Uses a bare axios call (not `api`) to avoid recursing through this interceptor.
let refreshPromise: Promise<string | null> | null = null;
function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const token: string | null =
          res.data?.data?.token ?? res.data?.token ?? null;
        if (token) storeAccessToken(token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token =
      getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If the request has FormData, remove Content-Type header
    // to let the browser set it automatically with the boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized) - token expired.
    // Only treat this as an expired session if a token actually existed.
    // A guest (no token) browsing public pages may hit an authed endpoint
    // and get a 401 — that must NOT bounce them to onboarding; let the
    // calling component handle it quietly.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRedirect
    ) {
      originalRequest._retry = true;
      const hadToken = !!getAuthToken();

      // First, try to silently renew the session via the refresh cookie. This
      // is what keeps users logged in across days without a new OTP, and turns
      // the old "expired token → logged out" failure into a transparent retry.
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      // Refresh failed (no/expired/revoked refresh token) → end the session.
      // Clear everything so we don't leave a stale half-logged-in shell that
      // keeps firing protected calls.
      try {
        if (hadToken && typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("persist:root");
          document.cookie =
            "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          // Don't redirect if already on the onboarding page — let the
          // onboarding context handle auth errors in its own catch blocks.
          if (!window.location.pathname.startsWith("/onboarding")) {
            window.location.href = "/";
          }
        }
      } catch (cleanupError) {
        return Promise.reject(cleanupError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
