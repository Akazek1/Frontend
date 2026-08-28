"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import api from "@/lib/axios";
import { ReviewPromptDialog, type ReviewPromptPayload } from "@/components/reviews/review-prompt-dialog";

// Client-facing prompt to review an agency AS A COMPANY (Phase 5). Reuses the
// shared ReviewPromptDialog (Yes/Maybe/No, matching the platform's review model)
// so there is no duplicate review UI. Gated server-side (author must have an
// inquiry with the agency).
export function AgencyReviewPrompt({
  agencyId,
  agencyName,
  bookingId,
}: {
  agencyId: string;
  agencyName: string;
  bookingId?: string;
}) {
  const t = useTranslations("agencyReviewSubmit");
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(payload: ReviewPromptPayload): Promise<boolean> {
    try {
      await api.post("/agency-reviews", {
        agencyId,
        wouldRehire: payload.wouldRehire,
        comment: payload.comment?.trim() || undefined,
        bookingId,
      });
      return true;
    } catch {
      return false;
    }
  }

  if (done) {
    return <p className="mt-2 text-[12px] text-ink-muted">{t("thanks")}</p>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand underline"
      >
        <Star className="h-3.5 w-3.5" /> {t("rateAgency")}
      </button>

      <ReviewPromptDialog
        open={open}
        onOpenChange={setOpen}
        subject={{ title: agencyName }}
        rehireQuestion={t("rehireQuestion")}
        onSubmit={handleSubmit}
        onSubmitted={() => setDone(true)}
      />
    </>
  );
}
