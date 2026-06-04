"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import toast from "react-hot-toast"
import { Loader2, MessageSquareReply, Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Review } from "@/hooks/useReviews"
import type { RootState } from "@/store"

interface ReviewCardProps {
  review: Review
  showActions?: boolean
  onEdit?: (review: Review) => void
  onDelete?: (review: Review) => void
  onReply?: (reviewId: string, reply: string) => Promise<boolean>
}

export function ReviewCard({ review, showActions = false, onEdit, onDelete, onReply }: ReviewCardProps) {
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id)
  const [replyOpen, setReplyOpen] = useState(false)
  const [reply, setReply] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const canReply = !!onReply && !!currentUserId && review.target?.id === currentUserId && !review.reply

  const handleReply = async () => {
    const text = reply.trim()
    if (!text) {
      toast.error("Write a short reply first")
      return
    }

    setSubmitting(true)
    const ok = await onReply?.(review.id, text)
    setSubmitting(false)

    if (ok) {
      toast.success("Reply posted")
      setReply("")
      setReplyOpen(false)
    } else {
      toast.error("Could not post reply")
    }
  }

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
                className="text-brand hover:text-brand/80 p-1"
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
      <p className="text-[13px] leading-[120%] text-ink-muted font-semibold">{review.comment}</p>
      <p className="text-xs text-gray-400">
        Posted on {new Date(review.booking.updatedAt).toLocaleDateString()}
      </p>
      {review.reply && (
        <div className="ml-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <p className="text-[11px] font-bold text-ink">Response from {review.target?.firstName || "provider"}</p>
          <p className="mt-1 text-[13px] leading-[140%] text-ink-muted">{review.reply}</p>
          {review.repliedAt && (
            <p className="mt-1 text-[11px] text-gray-400">
              Replied on {new Date(review.repliedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
      {canReply && !replyOpen && (
        <button
          type="button"
          onClick={() => setReplyOpen(true)}
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-bold text-brand"
        >
          <MessageSquareReply className="h-3.5 w-3.5" />
          Reply to review
        </button>
      )}
      {canReply && replyOpen && (
        <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Write one public reply..."
            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setReply("")
                setReplyOpen(false)
              }}
              className="px-3 py-1.5 text-[12px] font-semibold text-gray-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReply}
              disabled={submitting || !reply.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
              Post reply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
