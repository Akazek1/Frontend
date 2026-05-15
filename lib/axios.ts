import axios from "axios";

// Determine the API base URL
let baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// If running in browser and accessing localhost on a non-localhost origin, use the current host
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const hostname = window.location.hostname;
  // If page is accessed from a non-localhost IP/hostname, redirect API calls there too
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    baseURL = `http://${hostname}:3001`;
  }
}

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
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

    // Handle 401 errors (unauthorized) - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (typeof window !== "undefined") {
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
