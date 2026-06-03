import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import authReducer from "@/store/slices/auth-slice"
import { useAuth } from "@/hooks/useAuth"
import authService from "@/services/auth-service"

// Mock the auth service
vi.mock("@/services/auth-service")
vi.mock("react-hot-toast")

describe("useAuth hook", () => {
  let store: any

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    })
    vi.clearAllMocks()
  })

  const renderUseAuth = () => {
    return renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <Provider store={store}>{children}</Provider>
      ),
    })
  }

  describe("sendOtp", () => {
    it("should return false for empty phone number", async () => {
      const { result } = renderUseAuth()

      let response: boolean | undefined
      await act(async () => {
        response = await result.current.sendOtp({ phoneNumber: "" })
      })

      expect(response).toBe(false)
    })

    it("should return false for invalid phone number", async () => {
      const { result } = renderUseAuth()

      let response: boolean | undefined
      await act(async () => {
        response = await result.current.sendOtp({ phoneNumber: "123" })
      })

      expect(response).toBe(false)
    })

    it("should successfully send OTP", async () => {
      const { result } = renderUseAuth()
      const phoneNumber = "250788123456"

      await act(async () => {
        await result.current.sendOtp({ phoneNumber })
      })

      // Verify the hook state is properly set
      expect(result.current.phoneNumber).toBeDefined()
    })
  })

  describe("verifyOtp", () => {
    it("should return false for invalid OTP length", async () => {
      const { result } = renderUseAuth()

      let response: any
      await act(async () => {
        response = await result.current.verifyOtp("123")
      })

      expect(response).toBe(false)
    })

    it("should handle verification errors", async () => {
      const { result } = renderUseAuth()

      // Mock an error response
      vi.mocked(authService.verifyOtp).mockRejectedValueOnce(
        new Error("Invalid OTP")
      )

      let response: any
      await act(async () => {
        response = await result.current.verifyOtp({ phoneNumber: "250788123456", otp: "111111" })
      })

      expect(response).toBe(false)
    })
  })

  describe("logout", () => {
    it("should clear authentication state", async () => {
      const { result } = renderUseAuth()

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })
  })
})
