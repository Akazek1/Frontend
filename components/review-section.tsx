"use client"

import React from "react"
import { Loader2, Smile } from "lucide-react"
import { useReviews } from "@/hooks/useReviews"
import { ReviewCard } from "@/components/ReviewCard"

interface ReviewSectionProps {
  serviceId: string
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ serviceId }) => {
  const { reviews, wouldRehireCount, totalReviews, loading, replyToReview } = useReviews({ serviceId })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Smile className="w-4 h-4 text-brand" />
          {wouldRehireCount} would rehire · {totalReviews} reviews
        </p>
      </div>

      <div className="space-y-3">
        {reviews?.map((review) => (
          <ReviewCard key={review.id} review={review} onReply={replyToReview} />
        ))}
        {reviews?.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
      </div>
    </div>
  )
}

export default ReviewSection
