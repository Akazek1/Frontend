import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ServiceCategorySelector } from "@/components/onboarding/ServiceCategorySelector"
import { vi, describe, it, expect, beforeEach } from "vitest"
import React from "react"
import api from "@/lib/axios"

// Mock axios
vi.mock("@/lib/axios", () => ({
  default: {
    get: vi.fn(),
  },
}))

describe("ServiceCategorySelector Component", () => {
  const mockOnContinue = vi.fn()
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("loads categories from API", async () => {
    const mockCategories = [
      { id: "1", name: "Cleaning" },
      { id: "2", name: "Cooking" },
    ]
    ;(api.get as any).mockResolvedValue({ data: { data: mockCategories } })

    render(<ServiceCategorySelector onContinue={mockOnContinue} onBack={mockOnBack} />)
    
    expect(await screen.findByText("Cleaning")).toBeInTheDocument()
    expect(screen.getByText("Cooking")).toBeInTheDocument()
  })

  it("falls back to default categories if API fails", async () => {
    ;(api.get as any).mockRejectedValue(new Error("API Error"))

    render(<ServiceCategorySelector onContinue={mockOnContinue} onBack={mockOnBack} />)
    
    expect(await screen.findByText("Cleaning")).toBeInTheDocument()
    expect(screen.getByText("Pet Care")).toBeInTheDocument()
  })

  it("handles category selection", async () => {
    const mockCategories = [{ id: "1", name: "Cleaning" }]
    ;(api.get as any).mockResolvedValue({ data: { data: mockCategories } })

    render(<ServiceCategorySelector onContinue={mockOnContinue} onBack={mockOnBack} />)
    
    const checkbox = await screen.findByRole("checkbox")
    fireEvent.click(checkbox)

    expect(screen.getByText(/1 category selected/i)).toBeInTheDocument()

    const continueButton = screen.getByRole("button", { name: /continue/i })
    expect(continueButton).not.toBeDisabled()
    
    fireEvent.click(continueButton)
    expect(mockOnContinue).toHaveBeenCalledWith(["1"])
  })
})
