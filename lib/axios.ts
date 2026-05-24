import axios from "axios";
import { getAuthToken } from "@/lib/auth-utils";

// Determine the API base URL
let baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000,
});

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
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const hadToken = !!getAuthToken();

      try {
        if (hadToken && typeof window !== "undefined") {
          localStorage.removeItem("token");
          document.cookie =
            "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          // Don't redirect if already on the onboarding page — let the
          // onboarding context handle auth errors in its own catch blocks.
          if (!window.location.pathname.startsWith("/onboarding")) {
            window.location.href = "/onboarding";
          }
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
