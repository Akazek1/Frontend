"use client"

import React from "react"
import { Star, Loader2 } from "lucide-react"
import { useReviews } from "@/hooks/useReviews"
import { ReviewCard } from "@/components/ReviewCard"

interface ReviewSectionProps {
  serviceId: string
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ serviceId }) => {
  const { reviews, averageRating, totalReviews, loading } = useReviews({ serviceId })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Star className="w-4 h-4 fill-[#FB9400] stroke-[#FB9400]" />
          {averageRating.toFixed(1)} | {totalReviews} reviews
        </p>
      </div>

      <div className="space-y-3">
        {reviews?.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
        {reviews?.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
      </div>
    </div>
  )
}

export default ReviewSection
