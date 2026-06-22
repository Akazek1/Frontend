"use client";

import Link from "next/link";
import { Loader2, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "@/components/ReviewCard";
import type { Review } from "@/hooks/useReviews";

interface BookingReviewsDialogProps {
  open: boolean;
  title: string;
  reviews: Review[];
  loading?: boolean;
  canLeaveReview?: boolean;
  /** Labeled job facts (scheduled date, price, completion date, …). */
  infoRows?: { label: string; value: string }[];
  /** Shown when the viewer has already reviewed and can't leave another. */
  alreadyReviewed?: boolean;
  /** When set, shows a "Hire again" action linking to the booking flow. */
  hireHref?: string;
  onOpenChange: (open: boolean) => void;
  onLeaveReview?: () => void;
  onReply?: (reviewId: string, reply: string) => Promise<boolean>;
}

export function BookingReviewsDialog({
  open,
  title,
  reviews,
  loading = false,
  canLeaveReview = false,
  infoRows,
  alreadyReviewed = false,
  hireHref,
  onOpenChange,
  onLeaveReview,
  onReply,
}: BookingReviewsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-sm sm:w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-sm font-semibold text-ink">{title}</p>
            {infoRows && infoRows.length > 0 ? (
              <dl className="mt-2 space-y-1">
                {infoRows.map((row) => (
                  <div key={row.label} className="flex justify-between gap-3 text-xs">
                    <dt className="text-ink-muted">{row.label}</dt>
                    <dd className="font-semibold text-ink text-right">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-1 text-xs text-ink-muted">
                Reviews and replies linked to this specific booking.
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} onReply={onReply} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-gray-50 px-3 py-6 text-center text-sm text-ink-muted">
              No reviews have been left for this job yet.
            </p>
          )}

          {canLeaveReview ? (
            <Button
              type="button"
              onClick={onLeaveReview}
              className="w-full bg-brand hover:bg-[#0e4209]"
            >
              Leave Review
            </Button>
          ) : alreadyReviewed ? (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-center text-xs font-medium text-green-700">
              ✓ You&apos;ve reviewed this job.
            </p>
          ) : null}

          {hireHref && (
            <Button
              asChild
              type="button"
              variant="outline"
              className="w-full border-brand/30 text-brand hover:bg-brand/5"
            >
              <Link href={hireHref}>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Hire again
              </Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
