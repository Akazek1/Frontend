import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useReviews } from "@/hooks/useReviews"
import api from "@/lib/axios"

vi.mock("@/lib/axios")

describe("useReviews hook", () => {
  const mockReviews = [
    {
      id: "1",
      rating: 5,
      comment: "Great service!",
      user: {
        id: "user1",
        firstName: "John",
        lastName: "Doe",
        profilePicture: "https://example.com/john.jpg",
      },
      booking: {
        scheduledFor: "2024-01-01",
        updatedAt: "2024-01-02",
      },
    },
    {
      id: "2",
      rating: 4,
      comment: "Good experience",
      user: {
        id: "user2",
        firstName: "Jane",
        lastName: "Smith",
      },
      booking: {
        scheduledFor: "2024-01-03",
        updatedAt: "2024-01-04",
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("fetching reviews", () => {
    it("should fetch reviews for a service", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockReviews,
      })

      const { result } = renderHook(() => useReviews({ serviceId: "service1" }))

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.reviews).toHaveLength(2)
      expect(result.current.totalReviews).toBe(2)
    })

    it("should calculate average rating", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockReviews,
      })

      const { result } = renderHook(() => useReviews({ serviceId: "service1" }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Average of 5 and 4
      expect(result.current.averageRating).toBe(4.5)
    })

    it("should filter reviews by user ID", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockReviews,
      })

      const { result } = renderHook(() =>
        useReviews({ serviceId: "service1", filterByUserId: "user1" })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.reviews).toHaveLength(1)
      expect(result.current.reviews[0].user.id).toBe("user1")
    })

    it("should handle 404 gracefully", async () => {
      const error = new Error("Not Found")
      ;(error as any).response = { status: 404 }
      vi.mocked(api.get).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useReviews({ serviceId: "service1" }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.reviews).toHaveLength(0)
      expect(result.current.totalReviews).toBe(0)
      expect(result.current.averageRating).toBe(0)
    })
  })

  describe("submitting reviews", () => {
    it("should submit a new review", async () => {
      const newReview = { ...mockReviews[0], id: "3" }
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] })
      vi.mocked(api.post).mockResolvedValueOnce({
        data: newReview,
      })

      const { result } = renderHook(() => useReviews({ serviceId: "service1" }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let success: boolean = false
      await act(async () => {
        success = await result.current.submitReview(5, "Great!", "booking1")
      })

      expect(success).toBe(true)
    })
  })

  describe("deleting reviews", () => {
    it("should delete a review", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockReviews })
      vi.mocked(api.delete).mockResolvedValueOnce({})

      const { result } = renderHook(() => useReviews({ serviceId: "service1" }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.reviews).toHaveLength(2)

      let success: boolean = false
      await act(async () => {
        success = await result.current.deleteReview("1")
      })

      expect(success).toBe(true)
    })
  })
})
