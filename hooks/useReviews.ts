import { useState, useEffect } from "react"
import api from "@/lib/axios"

export interface Review {
  id: string
  rating: number
  comment: string
  user: {
    id: string
    firstName: string
    lastName: string
    profilePicture?: string
  }
  booking: {
    scheduledFor: string
    updatedAt: string
  }
}

interface UseReviewsOptions {
  serviceId: string
  filterByUserId?: string
}

export function useReviews({ serviceId, filterByUserId }: UseReviewsOptions) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState<number>(0)
  const [totalReviews, setTotalReviews] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get(`/feedback/service/${serviceId}`)
        const reviewsData = Array.isArray(response.data)
          ? response.data
          : response.data.data || []

        const normalizedReviews = reviewsData.map((review: Review & { author?: Review["user"] }) => ({
          ...review,
          user: review.user || review.author || {
            id: "",
            firstName: "Previous",
            lastName: "Employer",
            profilePicture: "",
          },
        }))

        const filteredReviews = filterByUserId
          ? normalizedReviews.filter((review: Review) => review.user.id === filterByUserId)
          : normalizedReviews

        setReviews(filteredReviews)
        setTotalReviews(filteredReviews.length)

        const avgRating =
          filteredReviews.length > 0
            ? filteredReviews.reduce((sum: number, review: Review) => sum + review.rating, 0) /
              filteredReviews.length
            : 0
        setAverageRating(avgRating)
      } catch (error: unknown) {
        const reviewsError = error as { response?: { status?: number } }
        if (reviewsError?.response?.status === 404) {
          setReviews([])
          setTotalReviews(0)
          setAverageRating(0)
        } else {
          console.error("Failed to fetch reviews:", error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [serviceId, filterByUserId])

  const submitReview = async (
    rating: number,
    comment: string,
    bookingId: string,
    reviewId?: string
  ) => {
    try {
      const payload = { rating, comment, bookingId }

      if (reviewId) {
        await api.post(`/feedback`, payload)
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId ? { ...review, rating, comment } : review
          )
        )
      } else {
        const response = await api.post(`/feedback`, payload)
        setReviews((prev) => [...prev, response.data])
      }

      return true
    } catch {
      return false
    }
  }

  const deleteReview = async (reviewId: string) => {
    try {
      await api.delete(`/feedback/${reviewId}`)
      setReviews((prev) => prev.filter((review) => review.id !== reviewId))
      return true
    } catch {
      return false
    }
  }

  return {
    reviews,
    averageRating,
    totalReviews,
    loading,
    submitReview,
    deleteReview,
  }
}
