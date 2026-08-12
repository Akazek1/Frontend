import { render, screen, fireEvent } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { ServiceCategorySelector } from "@/components/onboarding/ServiceCategorySelector"
import { vi, describe, it, expect, beforeEach } from "vitest"
import React from "react"
import api from "@/lib/axios"
import messages from "@/messages/en.json"

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

// Mock axios
vi.mock("@/lib/axios", () => ({
  default: {
    get: vi.fn(),
  },
}))

// Groupings as returned by /taxonomy/tree (same source as the More-page wizard).
const mockTree = [
  { id: "g1", name: "Cleaning", jobTypes: [{ id: "jt1", name: "House Cleaning" }] },
  { id: "g2", name: "Cooking", jobTypes: [{ id: "jt2", name: "Chef" }] },
]

describe("ServiceCategorySelector Component", () => {
  const mockOnContinue = vi.fn()
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("loads categories from the taxonomy tree", async () => {
    ;(api.get as any).mockResolvedValue({ data: { data: mockTree } })

    renderWithIntl(
      <ServiceCategorySelector onContinue={mockOnContinue} onBack={mockOnBack} />,
    )

    expect(await screen.findByText("Cleaning")).toBeInTheDocument()
    expect(screen.getByText("Cooking")).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith("/taxonomy/tree", expect.anything())
  })

  it("shows an empty state if loading fails", async () => {
    ;(api.get as any).mockRejectedValue(new Error("API Error"))

    renderWithIntl(
      <ServiceCategorySelector onContinue={mockOnContinue} onBack={mockOnBack} />,
    )

    // No categories render; the Continue button stays disabled.
    expect(
      await screen.findByRole("button", { name: /continue/i }),
    ).toBeDisabled()
    expect(screen.queryByText("Cleaning")).not.toBeInTheDocument()
  })

  it("handles category selection", async () => {
    ;(api.get as any).mockResolvedValue({ data: { data: mockTree } })

    renderWithIntl(
      <ServiceCategorySelector onContinue={mockOnContinue} onBack={mockOnBack} />,
    )

    const card = await screen.findByRole("button", { name: /cleaning/i })
    fireEvent.click(card)

    expect(screen.getByText(/1 category selected/i)).toBeInTheDocument()

    const continueButton = screen.getByRole("button", { name: /continue/i })
    expect(continueButton).not.toBeDisabled()

    fireEvent.click(continueButton)
    expect(mockOnContinue).toHaveBeenCalledWith(["g1"])
  })
})
