"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type WouldRehire = "YES" | "MAYBE" | "NO";

export interface ReviewSubject {
  title: string;
  subtitle?: string;
  meta?: string[];
}

export interface ReviewPromptPayload {
  wouldRehire: WouldRehire;
  comment?: string;
}

interface ReviewPromptDialogProps {
  open: boolean;
  subject: ReviewSubject | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: ReviewPromptPayload) => Promise<boolean>;
  onSubmitted?: () => void;
  /** Direction-aware question, e.g. "Would you hire this person again?" for an
   *  employer reviewing a worker, or "Would you work with this person again?"
   *  for a worker reviewing an employer. */
  rehireQuestion?: string;
  /** Pre-fill when completing/editing an existing review. */
  initialRehire?: WouldRehire | null;
  initialComment?: string;
}

const DEFAULT_REHIRE_QUESTION = "Would you hire this person again?";

const REVIEW_COMMENT_MAX_WORDS = 300;

function countWords(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function ReviewPromptDialog({
  open,
  subject,
  onOpenChange,
  onSubmit,
  onSubmitted,
  rehireQuestion = DEFAULT_REHIRE_QUESTION,
  initialRehire = null,
  initialComment = "",
}: ReviewPromptDialogProps) {
  const [wouldRehire, setWouldRehire] = useState<WouldRehire | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const commentWordCount = countWords(comment);
  const isCommentTooLong = commentWordCount > REVIEW_COMMENT_MAX_WORDS;

  useEffect(() => {
    if (open) {
      // Pre-fill when completing/editing an existing review. If a rating was
      // already chosen, jump straight to the comment step.
      setWouldRehire(initialRehire);
      setComment(initialComment);
      setSubmitting(false);
      setStep(initialRehire ? 2 : 1);
    } else {
      setWouldRehire(null);
      setComment("");
      setSubmitting(false);
      setStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async () => {
    if (!wouldRehire) {
      toast.error("Please choose an option above.");
      return;
    }
    if (isCommentTooLong) {
      toast.error(`Review must be ${REVIEW_COMMENT_MAX_WORDS} words or fewer.`);
      return;
    }

    setSubmitting(true);
    const ok = await onSubmit({
      wouldRehire,
      comment: comment.trim() || undefined,
    });
    setSubmitting(false);

    if (!ok) return;

    setStep(3);
    onSubmitted?.();
    window.setTimeout(() => onOpenChange(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-sm sm:w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
        {step === 1 && subject && (
          <>
            <DialogHeader>
              <DialogTitle>Review Experience</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="rounded-lg bg-green-50 p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-3xl">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-ink">Job Completed!</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Thank you! Your feedback helps build trust in the Akazek community.
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-gray-200 p-4">
                <p className="font-semibold text-ink">{subject.title}</p>
                {subject.subtitle && <p className="text-sm text-ink-muted">{subject.subtitle}</p>}
                {subject.meta?.[1] && <p className="text-xs text-ink-muted">{subject.meta[1]}</p>}
              </div>

              <div>
                <p className="mb-4 text-center text-sm font-semibold text-ink">
                  {rehireQuestion}
                </p>
                <div className="flex gap-3 justify-center">
                  {[
                    { value: "YES", emoji: "😊", label: "Yes" },
                    { value: "MAYBE", emoji: "😐", label: "Maybe" },
                    { value: "NO", emoji: "😞", label: "No" },
                  ].map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setWouldRehire(value as WouldRehire);
                        setStep(2);
                      }}
                      className={cn(
                        "flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-lg border-2 transition-all",
                        wouldRehire === value
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300",
                      )}
                    >
                      <span className="text-4xl">{emoji}</span>
                      <span className="text-xs font-semibold text-ink">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                Cancel
              </Button>
            </div>
          </>
        )}

        {step === 2 && subject && (
          <>
            <DialogHeader>
              <DialogTitle>Share your experience</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <p className="mb-4 text-center text-sm font-semibold text-ink">
                  {rehireQuestion}
                </p>
                <div className="flex gap-3 justify-center">
                  {[
                    { value: "YES", emoji: "😊", label: "Yes" },
                    { value: "MAYBE", emoji: "😐", label: "Maybe" },
                    { value: "NO", emoji: "😞", label: "No" },
                  ].map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setWouldRehire(value as WouldRehire)}
                      className={cn(
                        "flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 transition-all",
                        wouldRehire === value
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300",
                      )}
                    >
                      <span className="text-3xl">{emoji}</span>
                      <span className="text-xs font-semibold text-ink">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">
                  Tell others about your experience <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Cleria arrived on time and did an amazing job. The house was left spotless and she was very polite and professional. Would definitely hire again."
                  rows={4}
                  className={cn(
                    "resize-none",
                    isCommentTooLong ? "border-red-400 focus-visible:ring-red-200" : "",
                  )}
                />
                <p
                  className={cn(
                    "mt-1 text-right text-xs",
                    isCommentTooLong ? "text-red-600" : "text-gray-500",
                  )}
                >
                  {commentWordCount}/{REVIEW_COMMENT_MAX_WORDS} words
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-xs text-green-800">
                  ✓ Tip: Your review helps others make the right choice.
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !wouldRehire || isCommentTooLong}
                  className="flex-1 bg-brand hover:bg-[#0e4209]"
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Review
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 3 && subject && (
          <>
            <DialogHeader>
              <DialogTitle>Review Submitted</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 text-center">
              <div className="rounded-lg bg-green-50 p-6">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-5xl">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-ink">Thank you!</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Your review has been submitted successfully.
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-gray-200 p-4">
                <p className="flex items-center gap-2 text-sm text-ink-muted">
                  <Check className="h-4 w-4 text-green-500" />
                  {subject.title} will be notified and can respond to your review.
                </p>
              </div>

              <Button type="button" onClick={() => onOpenChange(false)} className="w-full bg-brand hover:bg-[#0e4209]">
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
