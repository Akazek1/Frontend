import { AxiosError } from "axios"
import { toast } from "react-hot-toast"

export interface ApiError {
  status: number
  message: string
  code?: string
  originalError?: unknown
}

/**
 * Centralized error handler for API calls
 * Provides consistent error messages and logging
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = "An error occurred. Please try again."
): ApiError {
  // Handle AxiosError
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0
    const data = error.response?.data as any

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        return {
          status,
          message: data?.message || "Invalid request. Please check your input.",
          code: "BAD_REQUEST",
          originalError: error,
        }

      case 401:
        // Token expired or invalid
        if (typeof window !== "undefined") {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          window.location.href = "/onboarding"
        }
        return {
          status,
          message: "Session expired. Please log in again.",
          code: "UNAUTHORIZED",
          originalError: error,
        }

      case 403:
        return {
          status,
          message: "You don't have permission to access this resource.",
          code: "FORBIDDEN",
          originalError: error,
        }

      case 404:
        return {
          status,
          message: data?.message || "The requested resource was not found.",
          code: "NOT_FOUND",
          originalError: error,
        }

      case 409:
        return {
          status,
          message: data?.message || "This resource already exists.",
          code: "CONFLICT",
          originalError: error,
        }

      case 422:
        // Validation error
        const validationErrors = data?.errors || data?.message
        return {
          status,
          message: Array.isArray(validationErrors)
            ? validationErrors[0]
            : validationErrors || "Validation failed.",
          code: "VALIDATION_ERROR",
          originalError: error,
        }

      case 429:
        return {
          status,
          message: "Too many requests. Please wait a moment and try again.",
          code: "RATE_LIMITED",
          originalError: error,
        }

      case 500:
        return {
          status,
          message: "Server error. Please try again later.",
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        }

      case 502:
      case 503:
      case 504:
        return {
          status,
          message: "Service unavailable. Please try again later.",
          code: "SERVICE_UNAVAILABLE",
          originalError: error,
        }

      default:
        return {
          status,
          message: data?.message || defaultMessage,
          code: "UNKNOWN_ERROR",
          originalError: error,
        }
    }
  }

  // Handle network errors
  if (error instanceof TypeError) {
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return {
        status: 0,
        message: "Network error. Please check your connection and try again.",
        code: "NETWORK_ERROR",
        originalError: error,
      }
    }
  }

  // Handle timeout
  if ((error as any)?.code === "ECONNABORTED") {
    return {
      status: 0,
      message: "Request timeout. Please try again.",
      code: "TIMEOUT",
      originalError: error,
    }
  }

  // Generic error fallback
  return {
    status: 0,
    message: error instanceof Error ? error.message : defaultMessage,
    code: "UNKNOWN_ERROR",
    originalError: error,
  }
}

/**
 * Handle API error and show toast notification
 */
export function handleApiErrorWithToast(
  error: unknown,
  defaultMessage: string = "An error occurred. Please try again."
): ApiError {
  const apiError = handleApiError(error, defaultMessage)
  toast.error(apiError.message)
  return apiError
}

/**
 * Retry logic for failed requests
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      const isLastAttempt = attempt === maxRetries - 1

      if (isLastAttempt) {
        break
      }

      const delayMs = initialDelayMs * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw lastError
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const status = error.response?.status
    // Retry on network errors, 408, 429, 5xx
    return !status || status === 408 || status === 429 || (status >= 500 && status < 600)
  }

  // Retry on network-related errors
  if (error instanceof TypeError) {
    return error.message.includes("fetch") || error.message.includes("network")
  }

  return (error as any)?.code === "ECONNABORTED"
}
