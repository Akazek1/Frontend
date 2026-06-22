import { renderHook, act } from "@testing-library/react"
import { ViewModeProvider, useViewMode } from "@/context/view-mode-context"
import { ReactNode } from "react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import React from "react"

// Mock useAuth
const mockUseAuth = vi.fn()
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock feature flags
vi.mock("@/lib/feature-flags", () => ({
  isGuestBrowsingEnabled: vi.fn().mockReturnValue(false),
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <ViewModeProvider>{children}</ViewModeProvider>
)

describe("ViewModeContext", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("defaults to employer mode for authenticated employers", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      roles: ["EMPLOYER"],
    })

    const { result } = renderHook(() => useViewMode(), { wrapper })
    
    expect(result.current.viewMode).toBe("employer")
  })

  it("defaults to provider mode for authenticated workers", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      roles: ["WORKER"],
    })

    const { result } = renderHook(() => useViewMode(), { wrapper })
    
    expect(result.current.viewMode).toBe("provider")
  })

  it("allows toggling view mode", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      roles: ["EMPLOYER", "WORKER"],
    })

    const { result } = renderHook(() => useViewMode(), { wrapper })
    
    act(() => {
      result.current.toggleViewMode()
    })
    
    expect(result.current.viewMode).toBe("provider")

    act(() => {
      result.current.toggleViewMode()
    })
    
    expect(result.current.viewMode).toBe("employer")
  })
})
