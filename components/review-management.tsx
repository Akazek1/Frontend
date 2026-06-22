"use client"

import React, { useState } from "react"
import { Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { useReviews, type Review } from "@/hooks/useReviews"
import { ReviewCard } from "@/components/ReviewCard"
import { useAuth } from "@/hooks/useAuth"

interface ReviewManagementProps {
  serviceId: string
}

const ReviewManagement: React.FC<ReviewManagementProps> = ({ serviceId }) => {
  const { user } = useAuth()
  const { reviews, loading, submitReview, deleteReview } = useReviews({
    serviceId,
    filterByUserId: user?.id,
  })

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [newReview, setNewReview] = useState<{ rating: number; comment: string }>({
    rating: 0,
    comment: "",
  })
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const handleRating = (rating: number) => {
    setNewReview((prev) => ({ ...prev, rating }))
  }

  const handleSubmitReview = async () => {
    if (newReview.rating === 0 || !newReview.comment.trim()) {
      toast.error("Please provide a rating and comment")
      return
    }

    setSubmitting(true)
    try {
      const success = await submitReview(
        newReview.rating,
        newReview.comment,
        serviceId,
        editingReview?.id
      )

      if (success) {
        toast.success(editingReview ? "Review updated successfully" : "Review submitted successfully")
        setIsModalOpen(false)
        setNewReview({ rating: 0, comment: "" })
        setEditingReview(null)
      } else {
        toast.error("Failed to submit review")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditReview = (review: Review) => {
    setEditingReview(review)
    setNewReview({ rating: review.rating || 0, comment: review.comment || "" })
    setIsModalOpen(true)
  }

  const handleDeleteReview = async (review: Review) => {
    if (!confirm("Are you sure you want to delete this review?")) return

    try {
      const success = await deleteReview(review.id)
      if (success) {
        toast.success("Review deleted successfully")
      } else {
        toast.error("Failed to delete review")
      }
    } catch {
      toast.error("Failed to delete review")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-ink">Manage Your Reviews</h1>
      <div className="space-y-4">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-brand text-white hover:bg-brand/90 rounded-[100px] text-sm"
              onClick={() => {
                setEditingReview(null)
                setNewReview({ rating: 0, comment: "" })
              }}
            >
              Write a Review
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingReview ? "Edit Review" : "Write a Review"}</DialogTitle>
              <DialogDescription>Share your experience with this service.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-2">
                <Label>Rating:</Label>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 cursor-pointer ${
                        star <= newReview.rating
                          ? "fill-[#FB9400] stroke-[#FB9400]"
                          : "fill-none stroke-[#FB9400]"
                      }`}
                      onClick={() => handleRating(star)}
                    />
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  placeholder="Write your review here..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand text-white hover:bg-brand/90"
                onClick={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingReview ? "Update Review" : "Submit Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-3">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showActions={true}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500">You haven&lsquo;t submitted any reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewManagement
