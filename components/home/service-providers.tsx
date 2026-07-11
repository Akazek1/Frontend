"use client";
import React, { useEffect, useState } from "react";
import ServiceCard from "../service-card";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Service } from "@/types";
import { useServiceList } from "@/hooks/useServiceList";
import { getServiceDetailPath, mapServiceToProviderCard } from "@/lib/service-display";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getApiErrorMessage } from "@/lib/error-handler";
import {
  ReviewPromptDialog,
  type ReviewPromptPayload,
} from "@/components/reviews/review-prompt-dialog";
import {
  AppButton,
  FormField,
  SheetBody,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPanel,
  appTextareaClass,
} from "@/components/ui/app-primitives";
import { cn } from "@/lib/utils";

interface HireModal {
  serviceId: string;
  providerName: string;
  serviceTitle: string;
}

interface ServiceProviderProps {
  showHeader: boolean;
}

interface BookingSummary {
  id?: string;
  status?: string;
  service?: {
    id?: string;
  };
  // Reviews authored by the current employer for this booking (backend filters
  // to the caller). A review with no comment is "incomplete" — the rehire choice
  // was saved but the comment skipped, so it can still be finished.
  reviews?: { id: string; comment?: string | null; wouldRehire?: "YES" | "MAYBE" | "NO" | null }[];
  // Backend's authoritative flag: true when the booking is completed and still
  // has no comment-bearing review. It replaced the `reviews` array in the
  // /bookings response, so relying on `reviews` alone made every completed
  // booking show "Leave a review" forever.
  reviewPending?: boolean;
}

type ReviewableEntry = {
  bookingId: string;
  wouldRehire: "YES" | "MAYBE" | "NO" | null;
  comment: string;
};

const ServiceProvider: React.FC<ServiceProviderProps> = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  // Only treat someone as the owner when they have a live session — `user` can
  // linger in storage without a valid token.
  const currentUserId = isAuthenticated ? user?.id : undefined;
  const { requireAuth } = useRequireAuth();
  // Cached browse list — no spinner when returning to the home page.
  const { data: rawServices, isLoading: loading, error } = useServiceList();
  const services = (rawServices ?? []).filter(
    (service: Service) =>
      service.id && typeof service.id === "string" && service.id.trim() !== "",
  );
  const [hireModal, setHireModal] = useState<HireModal | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestedServiceIds, setRequestedServiceIds] = useState<Set<string>>(new Set());
  // serviceId -> details of a completed job that still needs (or can finish) a
  // review (review-first re-hire). Includes incomplete reviews so a skipped
  // comment can be completed without re-asking the rehire question.
  const [reviewableByService, setReviewableByService] = useState<Map<string, ReviewableEntry>>(new Map());
  const [reviewModal, setReviewModal] = useState<{ serviceId: string; bookingId: string; name: string; title: string; wouldRehire: "YES" | "MAYBE" | "NO" | null; comment: string } | null>(null);

  useEffect(() => {
    // Optional decoration: marks cards the user has already requested. It's a
    // protected call, so guests (no live session) must not fire it — otherwise
    // every guest browsing the home page triggers a 401. skipAuthRedirect keeps
    // a stale/expired token from hard-bouncing a browser to home.
    if (!currentUserId) return;

    const fetchBookings = async () => {
      try {
        const response = await api.get<{ data?: BookingSummary[] } | BookingSummary[]>(
          "/bookings",
          { params: { role: "employer" }, skipAuthRedirect: true },
        );
        const responseData = response.data;
        const bookings = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData.data)
            ? responseData.data
            : [];
        const active = new Set(["PENDING", "CONFIRMED", "IN_PROGRESS"]);
        const activeIds = new Set<string>(
          bookings
            .filter((b) => b.service?.id && active.has(String(b.status).toUpperCase()))
            .map((b) => b.service?.id)
            .filter((id): id is string => Boolean(id))
        );
        setRequestedServiceIds(activeIds);
        // Completed jobs whose review is missing OR was left without a comment →
        // card leads with "Leave a review". An incomplete review carries its
        // saved rehire choice so the dialog can skip re-asking it.
        const reviewable = new Map<string, ReviewableEntry>();
        for (const b of bookings) {
          const sid = b.service?.id;
          if (!sid || !b.id || activeIds.has(sid) || reviewable.has(sid)) continue;
          if (String(b.status).toUpperCase() !== "COMPLETED") continue;
          const myReview = b.reviews?.[0];
          // Prefer the backend's reviewPending flag (it replaced `reviews`);
          // fall back to the comment check for older API responses.
          const reviewPending =
            typeof b.reviewPending === "boolean"
              ? b.reviewPending
              : !(myReview?.comment && myReview.comment.trim());
          if (!reviewPending) continue; // already reviewed (with a comment)
          reviewable.set(sid, {
            bookingId: b.id,
            wouldRehire: myReview?.wouldRehire ?? null,
            comment: myReview?.comment ?? "",
          });
        }
        setReviewableByService(reviewable);
      } catch {
        // silent — button just defaults to "Request to Hire"
      }
    };
    fetchBookings();
  }, [currentUserId]);

  const handleHireSubmit = async () => {
    if (!hireModal) return;
    setSubmitting(true);
    try {
      await api.post("/bookings", {
        serviceId: hireModal.serviceId,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      toast.success(`Booking request sent to ${hireModal.providerName}!`);
      setRequestedServiceIds((prev) => {
        const next = new Set(prev);
        next.add(hireModal.serviceId);
        return next;
      });
      setHireModal(null);
      setNotes("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send request. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const submitProviderReview = async (payload: ReviewPromptPayload) => {
    if (!reviewModal) return false;
    try {
      await api.post("/feedback", {
        wouldRehire: payload.wouldRehire,
        comment: payload.comment,
        bookingId: reviewModal.bookingId,
      });
      toast.success("Review submitted.");
      // Card returns to "Request to Hire".
      setReviewableByService((prev) => {
        const next = new Map(prev);
        next.delete(reviewModal.serviceId);
        return next;
      });
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not submit your review."));
      return false;
    }
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-8"
          >
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-500 py-4"
          >
            Failed to load services.
          </motion.div>
        ) : (
          <motion.div
            key="services"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="flex flex-col gap-3 pb-8 mt-2"
          >
            {services.length > 0 ? (
              services.map((service) => {
                const provider = mapServiceToProviderCard(service);
                return (
                  <ServiceCard
                    key={provider.id}
                    onClick={() => {
                      router.push(getServiceDetailPath(service));
                    }}
                    onHireClick={() => {
                      if (currentUserId && provider.providerId === currentUserId) {
                        toast.error("You can't book your own service.");
                        return;
                      }
                      if (requestedServiceIds.has(provider.id)) return;
                      requireAuth(() => setHireModal({
                        serviceId: provider.id,
                        providerName: provider.name,
                        serviceTitle: provider.title,
                      }), "hire");
                    }}
                    {...provider}
                    hasRequested={requestedServiceIds.has(provider.id)}
                    isOwnService={Boolean(currentUserId && provider.providerId === currentUserId)}
                    needsReview={reviewableByService.has(provider.id)}
                    onLeaveReview={() => {
                      const entry = reviewableByService.get(provider.id);
                      if (entry)
                        setReviewModal({
                          serviceId: provider.id,
                          bookingId: entry.bookingId,
                          name: provider.name,
                          title: provider.title,
                          wouldRehire: entry.wouldRehire,
                          comment: entry.comment,
                        });
                    }}
                  />
                );
              })
            ) : (
              <p className="text-center text-gray-500 py-4">
                No providers found.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ReviewPromptDialog
        open={Boolean(reviewModal)}
        subject={
          reviewModal
            ? { title: reviewModal.name, subtitle: reviewModal.title }
            : null
        }
        rehireQuestion="Would you hire this person again?"
        initialRehire={reviewModal?.wouldRehire ?? null}
        initialComment={reviewModal?.comment ?? ""}
        onOpenChange={(open) => {
          if (!open) setReviewModal(null);
        }}
        onSubmit={submitProviderReview}
      />

      {/* Request to Hire modal */}
      {hireModal && (
        <>
          <SheetOverlay
            onClick={() => { setHireModal(null); setNotes(""); }}
            aria-hidden="true"
          />
          <SheetPanel side="floating" className="max-w-sm" onClose={() => { setHireModal(null); setNotes(""); }}>
            <SheetHeader
              title={hireModal.providerName}
              subtitle={hireModal.serviceTitle}
              onClose={() => { setHireModal(null); setNotes(""); }}
              className="border-b-0 pb-2"
              leading={
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-brand">
                  Request
                </span>
              }
            />

            <SheetBody className="space-y-5 pt-2">
              <FormField label="Message" hint="Optional">
                <textarea
                  autoFocus
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe what you need, preferred schedule, or any specific requirements…"
                  rows={3}
                  className={cn(appTextareaClass, "min-h-[96px]")}
                />
              </FormField>
            </SheetBody>

            <SheetFooter className="flex gap-3 border-t-0 pb-6 pt-0">
              <AppButton
                appVariant="secondary"
                onClick={() => { setHireModal(null); setNotes(""); }}
                className="flex-1"
              >
                Cancel
              </AppButton>
              <AppButton
                onClick={handleHireSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Request"}
              </AppButton>
            </SheetFooter>
          </SheetPanel>
        </>
      )}
    </div>
  );
};

export default ServiceProvider;
