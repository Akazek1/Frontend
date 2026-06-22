import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { DocumentUploadStep } from "@/components/onboarding/DocumentUploadStep"
import { vi, describe, it, expect, beforeEach } from "vitest"
import React from "react"
import api from "@/lib/axios"

// Mock axios
vi.mock("@/lib/axios", () => ({
  default: {
    post: vi.fn(),
  },
}))

// Mock FileReader
class MockFileReader {
  readAsDataURL = vi.fn()
  onload: any = null
}
vi.stubGlobal("FileReader", MockFileReader)

describe("DocumentUploadStep Component", () => {
  const mockOnUploadSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the correct headline", () => {
    render(<DocumentUploadStep onUploadSuccess={mockOnUploadSuccess} onCancel={mockOnCancel} />)
    expect(screen.getByText(/Upload National ID, Passport, or Driver's License/i)).toBeInTheDocument()
  })

  it("handles file selection and validation", async () => {
    const { container } = render(<DocumentUploadStep onUploadSuccess={mockOnUploadSuccess} onCancel={mockOnCancel} />)
    
    const file = new File(["dummy content"], "test.png", { type: "image/png" })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    
    // We need to capture the reader instance
    let capturedReader: any
    vi.stubGlobal("FileReader", class extends MockFileReader {
      constructor() {
        super()
        capturedReader = this
      }
    })

    fireEvent.change(input, { target: { files: [file] } })

    // Simulate FileReader.onload
    await waitFor(() => {
      if (capturedReader && capturedReader.onload) {
        capturedReader.onload({ target: { result: "data:image/png;base64,dummy" } })
      }
    })

    expect(await screen.findByAltText(/Preview/i)).toBeInTheDocument()
    expect(screen.getByText(/test.png/i)).toBeInTheDocument()
  })

  it("rejects invalid file types", () => {
    render(<DocumentUploadStep onUploadSuccess={mockOnUploadSuccess} onCancel={mockOnCancel} />)
    
    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" })
    const uploadArea = screen.getByText(/Tap to upload or drag and drop/i).closest("div")
    const input = uploadArea?.parentElement?.querySelector("input") as HTMLInputElement
    
    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.queryByAltText(/Preview/i)).not.toBeInTheDocument()
  })
})
