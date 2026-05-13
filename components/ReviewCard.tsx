"use client"

import { Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Review } from "@/hooks/useReviews"

interface ReviewCardProps {
  review: Review
  showActions?: boolean
  onEdit?: (review: Review) => void
  onDelete?: (review: Review) => void
}

export function ReviewCard({ review, showActions = false, onEdit, onDelete }: ReviewCardProps) {
  return (
    <div className="flex flex-col gap-3 border-b pb-4 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <Avatar className="w-10 h-10">
            <AvatarImage src={review.user.profilePicture} />
            <AvatarFallback>{review.user.firstName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-sm">
                {review.user.firstName} {review.user.lastName}
              </p>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating
                        ? "fill-[#FB9400] stroke-[#FB9400]"
                        : "fill-none stroke-[#FB9400]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        {showActions && (onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(review)}
                className="text-[#145B10] hover:text-[#145B10]/80 p-1"
                aria-label="Edit review"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(review)}
                className="text-red-500 hover:text-red-600 p-1"
                aria-label="Delete review"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      <p className="text-[13px] leading-[120%] text-[#616161] font-semibold">{review.comment}</p>
      <p className="text-xs text-gray-400">
        Posted on {new Date(review.booking.updatedAt).toLocaleDateString()}
      </p>
    </div>
  )
}
