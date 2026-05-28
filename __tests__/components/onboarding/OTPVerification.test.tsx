import { render, screen, fireEvent } from "@testing-library/react"
import { OTPVerification } from "@/components/onboarding/OTPVerification"
import { OnboardingProvider } from "@/context/onboarding-context"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import authReducer from "@/store/slices/auth-slice"
import { vi, describe, it, expect, beforeEach } from "vitest"
import React from "react"

// Mock next/navigation
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

const createMockStore = () => configureStore({
  reducer: {
    auth: authReducer,
  },
})

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <Provider store={createMockStore()}>
      <OnboardingProvider>{ui}</OnboardingProvider>
    </Provider>
  )
}

describe("OTPVerification Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders correctly with title and description", () => {
    renderWithProviders(<OTPVerification />)
    
    expect(screen.getByText(/Enter Verification Code/i)).toBeInTheDocument()
    expect(screen.getByText(/We sent a 6-digit code to/i)).toBeInTheDocument()
  })

  it("shows the Back button", () => {
    renderWithProviders(<OTPVerification />)
    
    const backButton = screen.getByRole("button", { name: /back/i })
    expect(backButton).toBeInTheDocument()
  })

  it("shows the Resend OTP button", () => {
    renderWithProviders(<OTPVerification />)
    
    const resendButton = screen.getByRole("button", { name: /resend code/i })
    expect(resendButton).toBeInTheDocument()
  })
})
