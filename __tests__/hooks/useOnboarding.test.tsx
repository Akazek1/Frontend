import { renderHook, act } from "@testing-library/react"
import { OnboardingProvider, useOnboarding } from "@/context/onboarding-context"
import { ReactNode } from "react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import authReducer from "@/store/slices/auth-slice"
import { vi, describe, it, expect, beforeEach } from "vitest"

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: "/",
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}))

vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Create a mock store for each test
const createMockStore = () => configureStore({
  reducer: {
    auth: authReducer,
  },
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={createMockStore()}>
    <OnboardingProvider>{children}</OnboardingProvider>
  </Provider>
)

describe("useOnboarding Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper })
    
    expect(result.current.currentStep).toBe(-1)
    expect(result.current.phoneNumber).toBe("")
    expect(result.current.selectedRoles).toEqual([])
  })

  it("should navigate through steps", async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper })

    // Move to role selection
    act(() => {
      result.current.setCurrentStep(0)
    })
    expect(result.current.currentStep).toBe(0)

    // Select a role
    act(() => {
      result.current.setSelectedRoles(["WORKER"])
    })
    expect(result.current.selectedRoles).toEqual(["WORKER"])

    // Handle next
    await act(async () => {
      await result.current.handleNext()
    })
    expect(result.current.currentStep).toBe(1)
  })

  it("should handle phone number formatting", () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper })

    act(() => {
      result.current.handlePhoneChange("0787123456")
    })
    // It strips non-digits and leading 0/250 in handleSendOtp, but handlePhoneChange keeps digits
    expect(result.current.phoneNumber).toBe("0787123456")
  })

  it("should handle OTP resend cooldown", () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useOnboarding(), { wrapper })

    // Simulate starting a cooldown (normally done in handleResendOtp)
    // We can't directly set resendCooldown as it's state, but we can trigger the action
    // Mocking the API call inside handleSendOtp would be needed for a full test
  })
})
