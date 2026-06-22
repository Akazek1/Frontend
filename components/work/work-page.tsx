"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Baby,
  Banknote,
  Briefcase,
  CalendarDays,
  Car,
  ChefHat,
  ChevronRight,
  ClipboardList,
  Heart,
  Loader2,
  MapPin,
  MessageCircleMore,
  Plus,
  Send,
  Shield,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  Trees,
  UserPlus,
  Wrench,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useWorkData } from "@/hooks/useWorkData";
import jobsService, { Job } from "@/services/jobs-service";
import { cn, formatPrice } from "@/lib/utils";
import {
  PageHeader,
  PageShell,
  EmptyState,
  AppButton,
  SheetOverlay,
  SheetPanel,
  SheetHeader,
  SheetBody,
  SheetFooter,
  appContentClass,
  appListCardClass,
  appTextareaClass,
} from "@/components/ui/app-primitives";
import {
  FILTER_LABELS,
  SECTION_COPY,
  SECTION_GROUPS,
  accentClasses,
  sectionOrder,
  statusClasses,
  type SectionKey,
  type WorkFilter,
  type WorkItem,
} from "./types";
import { getInitials, getTimeAgo } from "./utils";
import { ReviewCard } from "@/components/ReviewCard";
import type { Review } from "@/hooks/useReviews";
import {
  ReviewPromptDialog,
  type ReviewPromptPayload,
  type ReviewSubject,
} from "@/components/reviews/review-prompt-dialog";
import { BookingReviewsDialog } from "@/components/reviews/booking-reviews-dialog";
import { getBookingType } from "@/lib/service-display";

function getReviewSubject(item: WorkItem): ReviewSubject {
  return {
    title: item.title,
    subtitle: item.subtitle,
    meta: item.meta,
  };
}

// A review is editable for a 14-day grace period after posting, and only until
// the reviewed party replies (mirrors the backend rule in feedback.service).
const REVIEW_EDIT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
function isReviewEditable(review?: Review | null): boolean {
  if (!review || review.reply) return false;
  if (!review.createdAt) return true; // unknown age — let the server decide
  return Date.now() - new Date(review.createdAt).getTime() < REVIEW_EDIT_WINDOW_MS;
}

function normalizeBookingReviews(reviews: Review[], bookingUpdatedAt?: string): Review[] {
  return reviews.map((review) => ({
    ...review,
    user: review.user || review.author || {
      id: "",
      firstName: "Previous",
      lastName: "Partner",
      profilePicture: "",
    },
    booking: review.booking || {
      scheduledFor: "",
      updatedAt: bookingUpdatedAt || new Date().toISOString(),
    },
  }));
}

export default function WorkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, jobPosts, loading, error, isProvider, isDualRole, refetch } = useWorkData();
  const [filter, setFilter] = useState<WorkFilter>("all");
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  // Accept-chat note sheet (provider adds an optional opening message).
  const [acceptChatTarget, setAcceptChatTarget] = useState<WorkItem | null>(null);
  const [acceptChatNote, setAcceptChatNote] = useState("");
  const [reviewTarget, setReviewTarget] = useState<WorkItem | null>(null);
  // When set, the review dialog is in EDIT mode for an already-authored review.
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewDetails, setReviewDetails] = useState<{
    item: WorkItem;
    reviews: Review[];
    loading: boolean;
    /** Set for employer-side completed bookings whose service is still
     *  available — routes to the existing booking flow to hire again. */
    hireHref?: string;
    /** Labeled job facts shown in the detail dialog. */
    infoRows?: { label: string; value: string }[];
  } | null>(null);
  const [authoredReviewBookingIds, setAuthoredReviewBookingIds] = useState<Set<string>>(new Set());
  // Full authored reviews keyed by bookingId — used to prefill the edit dialog
  // and decide whether a review is still editable.
  const [authoredReviewsByBooking, setAuthoredReviewsByBooking] = useState<Map<string, Review>>(new Map());
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);

  useEffect(() => {
    const tab = searchParams.get("tab") || searchParams.get("filter");
    if (tab === "requests" || tab === "active" || tab === "done" || tab === "all") {
      setFilter(tab);
    }
  }, [searchParams]);

  // Fetch reviews separately: authored reviews prevent duplicate submissions,
  // received reviews are shown so employers/workers can read and reply.
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const [receivedResponse, authoredResponse] = await Promise.all([
          api.get("/feedback/user/me"),
          api.get("/feedback/user/me/authored"),
        ]);
        const received = receivedResponse.data?.data || receivedResponse.data || [];
        const authored = authoredResponse.data?.data || authoredResponse.data || [];
        setReceivedReviews(Array.isArray(received) ? normalizeBookingReviews(received) : []);
        const authoredList: Review[] = Array.isArray(authored) ? authored : [];
        setAuthoredReviewBookingIds(
          new Set(
            authoredList
              .map((review: Review) => review.bookingId)
              .filter((bookingId): bookingId is string => Boolean(bookingId)),
          ),
        );
        setAuthoredReviewsByBooking(
          new Map(
            authoredList
              .filter((review) => Boolean(review.bookingId))
              .map((review) => [review.bookingId as string, review]),
          ),
        );
      } catch {
        // Silently handle error - user might not have reviews yet
      }
    };
    fetchReviews();
  }, []);

  const sections = useMemo(() => {
    const grouped = sectionOrder.reduce<Record<SectionKey, WorkItem[]>>(
      (acc, section) => {
        acc[section] = items.filter((item) => item.section === section);
        return acc;
      },
      {
        awaitingReview: [],
        awaitingReply: [],
        expressedInterest: [],
        activeDeals: [],
        done: [],
      },
    );
    // Surface completed-but-unreviewed bookings at the top of "Done" so the
    // pending review prompt isn't buried under already-reviewed history.
    const owesReview = (item: WorkItem) =>
      item.status === "COMPLETED" &&
      !!item.bookingId &&
      !authoredReviewBookingIds.has(item.bookingId);
    grouped.done = [...grouped.done].sort(
      (a, b) => Number(owesReview(b)) - Number(owesReview(a)),
    );
    return grouped;
  }, [items, authoredReviewBookingIds]);

  const counts = useMemo(
    () => ({
      all: items.length,
      requests: sections.awaitingReview.length + sections.awaitingReply.length + sections.expressedInterest.length,
      active: sections.activeDeals.length,
      done: sections.done.length,
    }),
    [items.length, sections],
  );

  const activeSections = SECTION_GROUPS[filter];
  const hasAnyActivity = items.length > 0 || jobPosts.length > 0 || receivedReviews.length > 0;
  const visibleSections = activeSections.filter((section) => sections[section].length > 0);
  const activeFilterCount = counts[filter];

  const activePostCount = jobPosts.filter((job) => job.status === "OPEN").length;
  const totalApplicants = jobPosts.reduce((sum, job) => sum + (job._count?.applications || 0), 0);

  const handleBookingStatus = async (item: WorkItem, status: "CONFIRMED" | "CANCELLED") => {
    if (!item.bookingId) return;
    setActingId(item.id);
    try {
      await api.patch(`/bookings/${item.bookingId}/status`, { status });
      const message = status === "CONFIRMED" ? "Offer accepted." : "Request rejected.";
      toast.success(message);
      setLiveMessage(message);
      await refetch();
      if (status === "CONFIRMED") router.push(`/conversations/inbox/${item.bookingId}`);
    } catch {
      toast.error(status === "CONFIRMED" ? "Could not accept this offer." : "Could not reject this request.");
    } finally {
      setActingId(null);
    }
  };

  // Opening the accept-chat sheet lets the provider add a note that becomes the
  // first message; the room is created on confirm.
  const handleAcceptChat = (item: WorkItem) => {
    if (!item.bookingId) return;
    setAcceptChatTarget(item);
    setAcceptChatNote("");
  };

  const confirmAcceptChat = async () => {
    const item = acceptChatTarget;
    if (!item?.bookingId) return;
    setActingId(item.id);
    try {
      const note = acceptChatNote.trim();
      await api.post(`/bookings/${item.bookingId}/accept-chat`, note ? { note } : {});
      const message = "Chat accepted. The employer has been notified.";
      toast.success(message);
      setLiveMessage(message);
      setAcceptChatTarget(null);
      await refetch();
      router.push(`/conversations/inbox/${item.bookingId}`);
    } catch {
      toast.error("Could not accept this chat request.");
    } finally {
      setActingId(null);
    }
  };

  const handleReminder = async (item: WorkItem) => {
    if (!item.bookingId) {
      toast.error("This application does not have a conversation yet.");
      return;
    }
    setActingId(item.id);
    try {
      await api.post(`/bookings/${item.bookingId}/messages`, {
        content: `Friendly reminder about "${item.subtitle}".`,
      });
      toast.success("Reminder sent.");
      setLiveMessage("Reminder sent.");
    } catch {
      toast.error("Could not send reminder.");
    } finally {
      setActingId(null);
    }
  };

  const handleWithdraw = async (item: WorkItem) => {
    if (!item.applicationId) return;
    setActingId(item.id);
    try {
      await jobsService.withdrawApplication(item.applicationId);
      toast.success("Application withdrawn.");
      setLiveMessage("Application withdrawn.");
      await refetch();
    } catch {
      toast.error("Could not withdraw this application.");
    } finally {
      setActingId(null);
    }
  };

  const openReview = (item: WorkItem) => {
    const existing = item.bookingId
      ? authoredReviewsByBooking.get(item.bookingId)
      : undefined;
    if (existing) {
      // Already reviewed: edit it while still inside the grace period, else
      // fall back to the read-only booking reviews.
      if (isReviewEditable(existing)) {
        setEditingReview(existing);
        setReviewTarget(item);
      } else {
        void openBookingReviews(item);
      }
      return;
    }
    setEditingReview(null);
    setReviewTarget(item);
  };

  const submitReview = async (payload: ReviewPromptPayload) => {
    if (!reviewTarget?.bookingId) return false;
    try {
      // Edit an existing review (PATCH) vs. create a new one (POST).
      const response = editingReview
        ? await api.patch(`/feedback/${editingReview.id}`, {
            wouldRehire: payload.wouldRehire,
            comment: payload.comment ?? "",
          })
        : await api.post("/feedback", {
            wouldRehire: payload.wouldRehire,
            comment: payload.comment,
            bookingId: reviewTarget.bookingId,
          });
      toast.success(editingReview ? "Review updated." : "Review submitted.");
      setLiveMessage(editingReview ? "Review updated." : "Review submitted.");
      setAuthoredReviewBookingIds(prev => new Set(prev).add(reviewTarget.bookingId!));
      const created = response.data?.data || response.data;
      if (created && reviewTarget.bookingId) {
        setAuthoredReviewsByBooking((prev) => {
          const next = new Map(prev);
          next.set(reviewTarget.bookingId!, created);
          return next;
        });
      }
      if (reviewDetails?.item.bookingId === reviewTarget.bookingId && created) {
        setReviewDetails((prev) =>
          prev
            ? { ...prev, reviews: normalizeBookingReviews([...prev.reviews, created]) }
            : prev,
        );
      }
      void refetch();
      return true;
    } catch (error: any) {
      const message = error?.response?.data?.message || "Could not submit review.";
      toast.error(message);
      return false;
    }
  };

  const openBookingReviews = async (item: WorkItem) => {
    if (!item.bookingId) return;
    setReviewDetails({ item, reviews: [], loading: true });
    try {
      const response = await api.get(`/bookings/${item.bookingId}`);
      const booking = response.data?.data || response.data;
      const reviews = Array.isArray(booking?.reviews) ? booking.reviews : [];

      // Employer can re-hire: prefer the original service's booking flow; fall
      // back to the worker's profile when the booking came from a job post.
      const service = booking?.service;
      const hireHref =
        item.role === "employer"
          ? service?.id
            ? `/book/${getBookingType(service)}/${service.id}`
            : item.profileHref
          : undefined;

      // Clear, labeled facts about the job (replaces the raw card meta).
      const fmtDate = (value?: string | null) =>
        value
          ? new Date(value).toLocaleDateString([], {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : null;
      const categoryName: string | undefined =
        booking?.service?.category?.name || booking?.job?.category?.name;
      const infoRows: { label: string; value: string }[] = [];
      if (categoryName && categoryName.toLowerCase() !== "other") {
        infoRows.push({ label: "Category", value: categoryName });
      }
      const scheduled = fmtDate(booking?.scheduledFor);
      if (scheduled) infoRows.push({ label: "Scheduled", value: scheduled });
      if (booking?.agreedPrice) {
        infoRows.push({ label: "Agreed price", value: formatPrice(booking.agreedPrice) });
      }
      const closedOn = fmtDate(booking?.updatedAt);
      if (booking?.status === "COMPLETED" && closedOn) {
        infoRows.push({ label: "Completed", value: closedOn });
      } else if (booking?.status === "CANCELLED" && closedOn) {
        infoRows.push({ label: "Cancelled", value: closedOn });
      }

      setReviewDetails({
        item,
        reviews: normalizeBookingReviews(reviews, booking?.updatedAt),
        loading: false,
        hireHref,
        infoRows,
      });
    } catch {
      setReviewDetails((prev) => prev ? { ...prev, loading: false } : prev);
      toast.error("Could not load reviews for this job.");
    }
  };

  const openPrimary = (item: WorkItem) => {
    if (item.primaryAction === "acceptChat") {
      void handleAcceptChat(item);
      return;
    }
    if (item.primaryAction === "acceptBooking") {
      void handleBookingStatus(item, "CONFIRMED");
      return;
    }
    if (item.primaryAction === "openChat" && item.bookingId) {
      router.push(`/conversations/inbox/${item.bookingId}`);
      return;
    }
    if (item.primaryAction === "leaveReview") {
      void openBookingReviews(item);
      return;
    }
    if (item.primaryAction === "viewApplicants" && item.jobHref) {
      router.push(item.jobHref);
      return;
    }
    if (item.jobHref) {
      router.push(item.jobHref);
      return;
    }
    if (item.bookingId) {
      router.push(`/conversations/inbox/${item.bookingId}`);
    }
  };

  const replyToReceivedReview = async (reviewId: string, reply: string) => {
    try {
      const response = await api.patch(`/feedback/${reviewId}/reply`, { reply });
      const updated = response.data?.data || response.data;
      setReceivedReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? normalizeBookingReviews([{ ...review, ...updated }], review.booking?.updatedAt)[0]
            : review,
        ),
      );
      return true;
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Could not post reply");
      return false;
    }
  };

  if (loading) {
    return (
      <div className="bg-surface flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!hasAnyActivity) {
    return (
      <PageShell>
        <WorkHeader />
        <div className="flex min-h-[62vh] items-center">
          <EmptyState
            icon={Briefcase}
            title="No work yet"
            description={
              isProvider
                ? "Find a job post or complete your service profile so employers can reach you."
                : "Post your first job or book a provider to start managing work here."
            }
            action={
              <button
                onClick={() => router.push(isProvider ? "/" : "/post-job")}
                className="h-12 w-full rounded-xl bg-brand px-5 text-[13px] font-bold text-white"
              >
                {isProvider ? "Find jobs" : "Post your first job"}
              </button>
            }
          />
        </div>
      </PageShell>
    );
  }

  return (
    <main className="bg-surface min-h-dvh pb-24">
      <div className="sr-only" aria-live="polite">{liveMessage}</div>
      <div className="bg-surface sticky top-0 z-20 mx-auto max-w-[428px] space-y-4 px-4 pb-3 pt-6 shadow-sm backdrop-blur">
        <WorkHeader />
        <WorkFilterChips counts={counts} filter={filter} onChange={setFilter} />
      </div>

      <div className={cn(appContentClass, "px-4 pt-4")}>
        {error && (
          <div className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-[12px] font-medium text-orange-700">
            {error}
          </div>
        )}

        {/*
          Always visible — any authenticated user can post a job. Counts
          default to 0 for users with no posts yet; the entry doubles as
          the launchpad for "create your first job post".
        */}
        <MyJobPostsEntry
          activePostCount={activePostCount}
          totalApplicants={totalApplicants}
        />

        {activeFilterCount === 0 && filter !== "all" ? (
          <InlineEmpty filter={filter} />
        ) : (
          visibleSections.map((section) => {
            const sectionItems = sections[section];
            const expanded = expandedSection === section;
            const shownItems = expanded ? sectionItems : sectionItems.slice(0, 2);
            return (
              <WorkSection
                key={section}
                section={section}
                count={sectionItems.length}
                onViewAll={() => setExpandedSection(expanded ? null : section)}
                expanded={expanded}
              >
                {shownItems.map((item) => (
                  <DealCard
                    key={item.id}
                    item={item}
                    isDualRole={isDualRole}
                    isActing={actingId === item.id}
                    needsReview={
                      item.section === "done" &&
                      item.status === "COMPLETED" &&
                      !!item.bookingId &&
                      !authoredReviewBookingIds.has(item.bookingId)
                    }
                    canEditReview={
                      item.section === "done" &&
                      !!item.bookingId &&
                      isReviewEditable(authoredReviewsByBooking.get(item.bookingId))
                    }
                    onPrimary={openPrimary}
                    onReview={openReview}
                    onReject={(target) => void handleBookingStatus(target, "CANCELLED")}
                    onReminder={(target) => void handleReminder(target)}
                    onWithdraw={(target) => void handleWithdraw(target)}
                  />
                ))}
              </WorkSection>
            );
          })
        )}
      </div>
      {receivedReviews.length > 0 && (
        <div id="reviews-received" className={cn(appContentClass, "px-4 pt-6 pb-24 scroll-mt-24")}>
          <h2 className="text-lg font-bold text-ink mb-4">Reviews About You ({receivedReviews.length})</h2>
          <p className="text-[12px] text-ink-muted mb-4">
            These are reviews other people left about working with you. You can reply once to each review.
          </p>
          <div className="space-y-3 rounded-2xl border border-[#DCE8D9] bg-white p-4 shadow-sm">
            {receivedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onReply={replyToReceivedReview}
              />
            ))}
          </div>
        </div>
      )}

      <BookingReviewsDialog
        open={Boolean(reviewDetails)}
        title={reviewDetails?.item.subtitle || reviewDetails?.item.title || "Completed job"}
        reviews={reviewDetails?.reviews || []}
        loading={reviewDetails?.loading}
        infoRows={reviewDetails?.infoRows}
        hireHref={reviewDetails?.hireHref}
        canLeaveReview={Boolean(
          reviewDetails?.item.bookingId &&
          reviewDetails.item.status === "COMPLETED" &&
          !authoredReviewBookingIds.has(reviewDetails.item.bookingId)
        )}
        alreadyReviewed={Boolean(
          reviewDetails?.item.bookingId &&
          authoredReviewBookingIds.has(reviewDetails.item.bookingId)
        )}
        onOpenChange={(open) => {
          if (!open) setReviewDetails(null);
        }}
        onLeaveReview={() => {
          if (reviewDetails?.item) {
            setReviewTarget(reviewDetails.item);
            setReviewDetails(null);
          }
        }}
        onReply={replyToReceivedReview}
      />

      <ReviewPromptDialog
        open={Boolean(reviewTarget)}
        subject={reviewTarget ? getReviewSubject(reviewTarget) : null}
        rehireQuestion={
          reviewTarget?.role === "provider"
            ? "Would you work with this person again?"
            : "Would you hire this person again?"
        }
        initialRehire={editingReview?.wouldRehire ?? null}
        initialComment={editingReview?.comment ?? ""}
        onOpenChange={(open) => {
          if (!open) {
            setReviewTarget(null);
            setEditingReview(null);
          }
        }}
        onSubmit={submitReview}
      />

      {acceptChatTarget && (
        <>
          <SheetOverlay onClick={() => setAcceptChatTarget(null)} aria-hidden="true" />
          <SheetPanel className="max-w-sm rounded-t-[28px]" onClose={() => setAcceptChatTarget(null)}>
            <SheetHeader
              title={`Chat with ${acceptChatTarget.title}`}
              subtitle="Add a note to start the conversation (optional)"
              onClose={() => setAcceptChatTarget(null)}
              className="border-b-0 pb-2"
            />
            <SheetBody className="space-y-4 pt-2">
              {acceptChatTarget.requestNote && (
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">Their request</p>
                  <p className="mt-1 text-[13px] text-ink">{acceptChatTarget.requestNote}</p>
                </div>
              )}
              <textarea
                value={acceptChatNote}
                onChange={(e) => setAcceptChatNote(e.target.value)}
                placeholder="e.g. Hi! Yes, I'm available — when would you like to start?"
                rows={3}
                className={cn(appTextareaClass, "min-h-[88px]")}
              />
            </SheetBody>
            <SheetFooter className="flex gap-3">
              <AppButton
                appVariant="secondary"
                onClick={() => setAcceptChatTarget(null)}
                className="flex-1"
              >
                Cancel
              </AppButton>
              <AppButton
                onClick={() => void confirmAcceptChat()}
                disabled={actingId === acceptChatTarget.id}
                className="flex-1"
              >
                {actingId === acceptChatTarget.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Accept & open chat"
                )}
              </AppButton>
            </SheetFooter>
          </SheetPanel>
        </>
      )}
    </main>
  );
}

function WorkHeader() {
  return <PageHeader title="My Work" />;
}

function WorkFilterChips({
  counts,
  filter,
  onChange,
}: {
  counts: Record<WorkFilter, number>;
  filter: WorkFilter;
  onChange: (filter: WorkFilter) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {(Object.keys(FILTER_LABELS) as WorkFilter[]).map((key) => {
        const active = filter === key;
        const muted = counts[key] === 0;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold transition-colors",
              active
                ? "border-[#C17A5D] bg-white text-[#C17A5D]"
                : "border-gray-200 bg-white text-ink",
              muted && !active && "text-gray-400",
            )}
          >
            {FILTER_LABELS[key]}
            <span
              className={cn(
                "flex min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                active ? "bg-[#C17A5D] text-white" : muted ? "bg-gray-50 text-gray-400" : "bg-gray-100 text-ink",
              )}
            >
              {counts[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MyJobPostsEntry({
  activePostCount,
  totalApplicants,
}: {
  activePostCount: number;
  totalApplicants: number;
}) {
  return (
    <Link
      href="/work/job-posts"
      className={cn(appListCardClass, "flex min-h-[78px] items-center gap-3 border-purple-100 px-3.5 py-3")}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50">
        <ClipboardList className="h-7 w-7 text-[#6D28D9]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-black text-ink">My Job Posts</p>
        <p className="mt-1 text-[12px] font-medium text-ink-muted">
          {activePostCount} active posts <span className="mx-1">•</span> {totalApplicants} total applicants
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink" />
    </Link>
  );
}

function WorkSection({
  section,
  count,
  onViewAll,
  expanded,
  children,
}: {
  section: SectionKey;
  count: number;
  onViewAll: () => void;
  expanded: boolean;
  children: React.ReactNode;
}) {
  const copy = SECTION_COPY[section];
  const accent = section === "awaitingReview" ? "orange" : section === "awaitingReply" ? "slate" : section === "expressedInterest" ? "purple" : section === "activeDeals" ? "green" : "gray";

  return (
    <section className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={cn("text-[13px] font-black", accentClasses[accent].title)}>{copy.title}</h2>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-black", accentClasses[accent].soft)}>{count}</span>
          </div>
          {copy.subtitle && <p className="mt-1 text-[12px] text-ink-muted">{copy.subtitle}</p>}
        </div>
        {count > 2 && (
          <button
            type="button"
            onClick={onViewAll}
            className={cn("min-h-8 text-[12px] font-black", accentClasses[accent].title)}
          >
            {expanded ? "Show less" : "View all"}
          </button>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function DealCard({
  item,
  isDualRole,
  isActing,
  needsReview = false,
  canEditReview = false,
  onPrimary,
  onReview,
  onReject,
  onReminder,
  onWithdraw,
}: {
  item: WorkItem;
  isDualRole: boolean;
  isActing: boolean;
  // A completed booking the current user hasn't reviewed yet — show the
  // "Leave a Review" prompt directly on the card.
  needsReview?: boolean;
  // Already reviewed but still within the edit window — offer "Edit review".
  canEditReview?: boolean;
  onPrimary: (item: WorkItem) => void;
  onReview: (item: WorkItem) => void;
  onReject: (item: WorkItem) => void;
  onReminder: (item: WorkItem) => void;
  onWithdraw: (item: WorkItem) => void;
}) {
  // Per design: incoming hire requests in AWAITING YOUR REVIEW do NOT show
  // a status badge ("From Employer") — the section header already conveys the
  // direction. The clickable name handles profile access (no View Profile button).
  const hideStatusBadge =
    item.section === "awaitingReview" && item.kind === "booking";

  const titleNode = (
    <h3 className="truncate text-[15px] font-black text-ink">{item.title}</h3>
  );

  const isClickable = item.section === "done";

  return (
    <article
      onClick={isClickable ? () => onPrimary(item) : undefined}
      className={cn(
        appListCardClass,
        "overflow-hidden",
        "border-l-4",
        accentClasses[item.accent].bar,
        accentClasses[item.accent].border,
        accentClasses[item.accent].card,
        isClickable && "cursor-pointer transition-shadow hover:shadow-md",
      )}
    >
      <div className="p-3.5">
        <div className="flex gap-3">
          <AvatarBlock item={item} />
          <div className="min-w-0 flex-1">
            {/* Row 1 — clickable name on the left, status pill on the right (where applicable) */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {item.profileHref ? (
                  <Link href={item.profileHref} onClick={(e) => e.stopPropagation()} className="min-w-0 hover:underline">
                    {titleNode}
                  </Link>
                ) : item.jobHref ? (
                  <Link href={item.jobHref} onClick={(e) => e.stopPropagation()} className="min-w-0 hover:underline">
                    {titleNode}
                  </Link>
                ) : (
                  titleNode
                )}
              </div>
              {needsReview ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFF4E5] px-2 py-0.5 text-[10px] font-black text-[#C2630B]">
                  <Star className="h-3 w-3 fill-[#C2630B] stroke-[#C2630B]" />
                  Review owed
                </span>
              ) : (
                !hideStatusBadge && (
                  <StatusBadge status={item.status} label={item.statusLabel} />
                )
              )}
            </div>

            {/* Row 2 — subtitle (job title / work type) */}
            <p className="mt-0.5 truncate text-[13px] font-bold text-ink">
              {item.subtitle}
            </p>

            {/* Row 3 — category · date · price meta with icons */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
              {item.meta.map((meta) => (
                <span key={meta} className="inline-flex items-center gap-1">
                  {meta.includes("RWF") ? (
                    <Banknote className="h-3 w-3 text-ink-subtle" />
                  ) : meta.includes("Sat") ||
                    meta.includes("Sun") ||
                    meta.includes("Mon") ||
                    meta.includes("Tue") ||
                    meta.includes("Wed") ||
                    meta.includes("Thu") ||
                    meta.includes("Fri") ||
                    meta.includes("To agree") ? (
                    <CalendarDays className="h-3 w-3 text-ink-subtle" />
                  ) : null}
                  {meta}
                </span>
              ))}
            </div>

            {/* Row 4 — secondary meta + (subtly) dual-role hint */}
            {(item.secondaryMeta || isDualRole) && (
              <p className="mt-1.5 text-[11px] text-[#9CA3AF]">
                {item.secondaryMeta}
                {isDualRole && item.secondaryMeta && " · "}
                {isDualRole && (item.role === "provider" ? "As Provider" : "As Employer")}
              </p>
            )}
            {item.requestNote && (
              <p className="mt-2 line-clamp-2 rounded-lg bg-white/70 px-2 py-1.5 text-[12px] font-medium text-ink-muted">
                {item.requestNote}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 p-3">
        <DealCardActions
          item={item}
          isActing={isActing}
          needsReview={needsReview}
          canEditReview={canEditReview}
          onPrimary={onPrimary}
          onReview={onReview}
          onReject={onReject}
          onReminder={onReminder}
          onWithdraw={onWithdraw}
        />
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Action layout per section — keeps DealCard markup readable.
// ---------------------------------------------------------------------------

function DealCardActions({
  item,
  isActing,
  needsReview = false,
  canEditReview = false,
  onPrimary,
  onReview,
  onReject,
  onReminder,
  onWithdraw,
}: {
  item: WorkItem;
  isActing: boolean;
  needsReview?: boolean;
  canEditReview?: boolean;
  onPrimary: (item: WorkItem) => void;
  onReview: (item: WorkItem) => void;
  onReject: (item: WorkItem) => void;
  onReminder: (item: WorkItem) => void;
  onWithdraw: (item: WorkItem) => void;
}) {
  // Section: AWAITING YOUR REVIEW — grouped applicants on the user's own job post.
  if (item.section === "awaitingReview" && item.kind === "jobApplicants") {
    return (
      <button
        type="button"
        onClick={() => onPrimary(item)}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand/30 bg-white text-[12px] font-black text-brand"
      >
        View Applicants
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }

  // Section: AWAITING YOUR REVIEW — incoming hire request (provider-side accept/reject).
  // Per design: no View Profile button — name in the card is clickable to the profile.
  // Buttons: Message (top, full width) then Accept | Reject (bottom row).
  if (item.section === "awaitingReview" && item.kind === "booking") {
    if (!item.chatOpened) {
      return (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isActing}
            onClick={() => onPrimary(item)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand text-[12px] font-black text-white disabled:opacity-60"
          >
            {isActing && <Loader2 className="h-4 w-4 animate-spin" />}
            Accept Chat
          </button>
          <button
            type="button"
            disabled={isActing}
            onClick={() => onReject(item)}
            className="flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-white text-[12px] font-black text-red-500 disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <MessageButton bookingId={item.bookingId} className="w-full" />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isActing}
            onClick={() => onPrimary(item)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#C17A5D] text-[12px] font-black text-white disabled:opacity-60"
          >
            {isActing && <Loader2 className="h-4 w-4 animate-spin" />}
            Accept Job
          </button>
          <button
            type="button"
            disabled={isActing}
            onClick={() => onReject(item)}
            className="flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-white text-[12px] font-black text-red-500 disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      </div>
    );
  }

  // Section: AWAITING THEIR REPLY — outgoing direct request, waiting on worker.
  // Per design: no View Profile (the clickable name handles that). User can
  // Revoke (cancel the request) or Send Reminder.
  if (item.section === "awaitingReply") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <RevokeButton
          isActing={isActing}
          onClick={() => onReject(item)}
          label="Revoke"
        />
        {item.chatOpened ? (
          <MessageButton bookingId={item.bookingId} />
        ) : (
          <span className="flex min-h-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-center text-[12px] font-black text-ink-muted">
            Waiting for chat
          </span>
        )}
      </div>
    );
  }

  // Section: YOU EXPRESSED INTEREST — application to a job post.
  // Per design: no View Job (the clickable title handles that). User can
  // Revoke (withdraw application) or Send Reminder.
  if (item.section === "expressedInterest") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <RevokeButton
          isActing={isActing}
          onClick={() => onWithdraw(item)}
          label="Revoke"
        />
        <SendReminderButton item={item} onReminder={onReminder} />
      </div>
    );
  }

  // Section: ACTIVE DEALS — in-progress booking.
  if (item.section === "activeDeals" && item.bookingId) {
    return (
      <Link
        href={`/conversations/inbox/${item.bookingId}`}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand/30 bg-white text-[12px] font-black text-brand"
      >
        <MessageCircleMore className="h-4 w-4" />
        Open Chat
      </Link>
    );
  }

  // Section: DONE — opens the job detail dialog (info + reviews + rehire).
  if (item.section === "done") {
    // A completed booking the user hasn't reviewed yet — lead with the review
    // prompt so the feedback loop is one tap away, not buried in details.
    if (needsReview) {
      return (
        <div className="space-y-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReview(item);
            }}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[12px] font-black text-white"
          >
            <Star className="h-4 w-4 fill-white stroke-white" />
            Leave a Review
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrimary(item);
            }}
            className="flex min-h-11 w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-[12px] font-black text-ink"
          >
            View Details
          </button>
        </div>
      );
    }
    // Completed + reviewed employer booking: the feedback loop is closed, so
    // lead with "Hire Again" (re-book the same service) — the explicit re-hire
    // path requested for the Done list.
    const canHireAgain =
      item.role === "employer" && item.status === "COMPLETED" && Boolean(item.hireHref);
    // Already reviewed and still inside the 14-day edit window — let the author
    // amend their review (locked once the other party replies, server-enforced).
    if (canEditReview) {
      return (
        <div className="space-y-2">
          {canHireAgain && <HireAgainButton href={item.hireHref!} />}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReview(item);
              }}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand/30 bg-white text-[12px] font-black text-brand"
            >
              <Star className="h-4 w-4" />
              Edit review
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrimary(item);
              }}
              className="flex min-h-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-[12px] font-black text-ink"
            >
              View Details
            </button>
          </div>
        </div>
      );
    }
    if (canHireAgain) {
      return (
        <div className="space-y-2">
          <HireAgainButton href={item.hireHref!} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrimary(item);
            }}
            className="flex min-h-11 w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-[12px] font-black text-ink"
          >
            View Details
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrimary(item);
        }}
        className="flex min-h-11 w-full items-center justify-center rounded-lg bg-brand text-[12px] font-black text-white"
      >
        View Details
      </button>
    );
  }

  // Defensive fallback — should not normally render.
  return (
    <button
      type="button"
      onClick={() => onPrimary(item)}
      className="flex min-h-11 w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-[12px] font-black text-ink"
    >
      View Details
    </button>
  );
}

function RevokeButton({
  isActing,
  onClick,
  label = "Revoke",
}: {
  isActing: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      disabled={isActing}
      onClick={onClick}
      className="flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-white text-[12px] font-black text-red-500 disabled:opacity-60"
    >
      {isActing && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
      {label}
    </button>
  );
}

function HireAgainButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-brand text-[12px] font-black text-white"
    >
      <UserPlus className="h-4 w-4" />
      Hire Again
    </Link>
  );
}

function MessageButton({ bookingId, className }: { bookingId?: string; className?: string }) {
  const href = bookingId ? `/conversations/inbox/${bookingId}` : "/conversations";
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-brand/30 bg-white text-[12px] font-black text-brand",
        className,
      )}
    >
      <MessageCircleMore className="h-3.5 w-3.5" />
      Message
    </Link>
  );
}

function SendReminderButton({
  item,
  onReminder,
}: {
  item: WorkItem;
  onReminder: (item: WorkItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onReminder(item)}
      className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-white text-[12px] font-black text-[#1155FF]"
    >
      <Send className="h-3.5 w-3.5" />
      Send Reminder
    </button>
  );
}

function AvatarBlock({ item }: { item: WorkItem }) {
  if (item.avatarUrl) {
    return (
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gray-100">
        <Image src={item.avatarUrl} alt="" fill className="object-cover" />
      </div>
    );
  }

  return (
    <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-xl", accentClasses[item.accent].soft)}>
      {item.icon || <span className="text-[16px] font-black">{getInitials(item.title)}</span>}
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-[10px] font-black",
        statusClasses[status] || "bg-gray-100 text-gray-600",
      )}
    >
      {label}
    </span>
  );
}

function InlineEmpty({ filter }: { filter: WorkFilter }) {
  const text =
    filter === "requests"
      ? "No pending requests right now."
      : filter === "active"
        ? "No active deals right now."
        : "No closed work right now.";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-5 text-center text-[13px] font-semibold text-ink-subtle">
      {text}
    </div>
  );
}

export function JobPostsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "filled" | "closed">("all");

  useEffect(() => {
    jobsService
      .getMyJobs()
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => {
        toast.error("Could not load job posts.");
        setJobs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    all: jobs.length,
    open: jobs.filter((job) => job.status === "OPEN").length,
    filled: jobs.filter((job) => job.status === "AWARDED").length,
    closed: jobs.filter((job) => ["CLOSED", "CANCELLED"].includes(job.status)).length,
  };

  const filtered = jobs.filter((job) => {
    if (filter === "all") return true;
    if (filter === "open") return job.status === "OPEN";
    if (filter === "filled") return job.status === "AWARDED";
    return ["CLOSED", "CANCELLED"].includes(job.status);
  });

  const totalApplicants = jobs.reduce((sum, job) => sum + (job._count?.applications || 0), 0);
  const activePosts = counts.open;

  return (
    <main className="bg-surface min-h-screen pb-24">
      <div className="bg-surface sticky top-0 z-20 space-y-3 px-4 pb-2 pt-6 backdrop-blur">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/work")}
              aria-label="Back to work"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
            <h1 className="truncate text-[20px] font-black text-[#101828]">My Job Posts</h1>
          </div>
          <Link
            href="/post-job"
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-brand/30 bg-white px-3 text-[12px] font-black text-brand"
          >
            <Plus className="h-4 w-4" />
            Post Job
          </Link>
        </header>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "open", "filled", "closed"] as const).map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-bold capitalize transition-colors",
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-gray-200 bg-white text-ink",
                )}
              >
                {key}
                <span
                  className={cn(
                    "flex min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    active ? "bg-white/25 text-white" : "bg-gray-100 text-ink",
                  )}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 px-4 pt-3">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-10 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-[14px] font-black text-ink">No job posts here</p>
            <p className="mt-1 text-[12px] text-ink-subtle">Post a new job to find help.</p>
          </div>
        ) : (
          <>
            <JobPostsSummary activePosts={activePosts} totalApplicants={totalApplicants} />
            {filtered.map((job) => (
              <JobPostCard key={job.id} job={job} onTap={() => router.push(`/jobs/${job.id}`)} />
            ))}
            <NeedToHireAgainCard onPostNew={() => router.push("/post-job")} />
            <SafeAndSecureCard />
          </>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// My Job Posts — sub-components
// ---------------------------------------------------------------------------

function JobPostsSummary({
  activePosts,
  totalApplicants,
}: {
  activePosts: number;
  totalApplicants: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#F1F4FA] px-4 py-3.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
        <ClipboardList className="h-5 w-5 text-ink" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-black text-ink">
          {activePosts} active post{activePosts === 1 ? "" : "s"}
          <span className="mx-1.5 text-ink-subtle">•</span>
          {totalApplicants} total applicants
        </p>
        <p className="mt-0.5 text-[12px] text-ink-subtle">
          Manage your job posts and review applicants.
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink-subtle" />
    </div>
  );
}

function JobPostCard({ job, onTap }: { job: Job; onTap: () => void }) {
  const isOpen = job.status === "OPEN";
  const isFilled = job.status === "AWARDED";
  const accent = isOpen
    ? { bg: "bg-[#E7F4E2]", fg: "text-brand", pill: "bg-[#E7F4E2] text-brand" }
    : isFilled
      ? { bg: "bg-[#EDE9FE]", fg: "text-[#6D28D9]", pill: "bg-[#EDE9FE] text-[#6D28D9]" }
      : { bg: "bg-gray-100", fg: "text-gray-500", pill: "bg-gray-100 text-gray-500" };

  const statusLabel = isFilled
    ? "Filled"
    : isOpen
      ? "Open"
      : job.status[0] + job.status.slice(1).toLowerCase();

  const location = formatJobLocation(job);
  const schedule = formatJobSchedule(job);
  const applicants = job._count?.applications || 0;
  const previewAvatars = (job.applications || []).slice(0, 5);
  const overflow = Math.max(0, applicants - previewAvatars.length);
  const hiredAvatar = previewAvatars.find((a) => a.status === "ACCEPTED");

  return (
    <article className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={onTap}
        className="block w-full p-4 text-left"
      >
        <div className="flex gap-3">
          <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", accent.bg)}>
            <JobCategoryIcon category={job.category?.name} className={cn("h-7 w-7", accent.fg)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="truncate text-[15px] font-black text-ink">{job.title}</h2>
              <div className="flex shrink-0 items-center gap-1">
                <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold", accent.pill)}>
                  {statusLabel}
                </span>
                <span aria-hidden className="flex h-6 w-6 items-center justify-center text-[18px] leading-none text-ink-subtle">
                  ⋮
                </span>
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-muted">
              {location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-ink-subtle" />
                  {location}
                </span>
              )}
              {schedule && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-ink-subtle" />
                  {schedule}
                </span>
              )}
            </div>
            <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-ink-muted">
              <Banknote className="h-3.5 w-3.5 text-ink-subtle" />
              Budget: {formatPrice(job.budgetMin, job.budgetMax)}
            </p>
          </div>
        </div>
      </button>

      <div className="border-t border-gray-100 px-4 py-3">
        {isFilled ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-black text-ink">1</span>
              <span className="text-[13px] text-ink-muted">Hired</span>
              {hiredAvatar?.worker && <AvatarChip person={hiredAvatar.worker} />}
            </div>
            <Link
              href={`/jobs/${job.id}`}
              className="inline-flex items-center gap-1 text-[13px] font-black text-[#6D28D9]"
            >
              View Details
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-[13px] font-black text-brand">
                {applicants} Interested
              </span>
              {previewAvatars.length > 0 && (
                <div className="flex -space-x-2">
                  {previewAvatars.map((app) =>
                    app.worker ? <AvatarChip key={app.id} person={app.worker} /> : null,
                  )}
                  {overflow > 0 && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#E7F4E2] text-[10px] font-black text-brand">
                      +{overflow}
                    </span>
                  )}
                </div>
              )}
            </div>
            <Link
              href={`/jobs/${job.id}`}
              className="inline-flex shrink-0 items-center gap-1 text-[13px] font-black text-brand"
            >
              View Applicants
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      <p className="px-4 pb-3 text-[11px] text-ink-subtle">
        {isFilled ? "Filled" : "Posted"} {getTimeAgo(job.createdAt) || "recently"}
      </p>
    </article>
  );
}

function AvatarChip({
  person,
}: {
  person: { firstName?: string; lastName?: string; profilePicture?: string | null };
}) {
  const fullName = `${person.firstName || ""} ${person.lastName || ""}`.trim() || "User";
  if (person.profilePicture) {
    return (
      <span className="relative inline-block h-7 w-7 overflow-hidden rounded-full border-2 border-white bg-gray-100">
        <Image src={person.profilePicture} alt={fullName} fill className="object-cover" />
      </span>
    );
  }
  return (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[10px] font-black text-ink"
      title={fullName}
    >
      {getInitials(fullName)}
    </span>
  );
}

function NeedToHireAgainCard({ onPostNew }: { onPostNew: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#D6BCFA] bg-[#F5F3FF] px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE9FE]">
          <Plus className="h-5 w-5 text-[#6D28D9]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-black text-ink">Need to hire again?</p>
          <p className="mt-0.5 text-[12px] text-ink-muted">
            Post a new job and find the right help.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onPostNew}
        className="mt-3 flex min-h-10 w-full items-center justify-center rounded-xl border border-[#6D28D9] bg-white text-[13px] font-black text-[#6D28D9]"
      >
        Post New Job
      </button>
    </div>
  );
}

function SafeAndSecureCard() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F4E2]">
        <ShieldCheck className="h-5 w-5 text-brand" />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-black text-ink">Safe &amp; Secure</p>
        <p className="mt-0.5 text-[12px] text-ink-muted">
          We review all applications and keep your information protected.
        </p>
      </div>
    </div>
  );
}

function formatJobLocation(job: Job): string {
  const { address } = job;
  if (!address) return "";
  const parts = [address.city, address.district].filter(Boolean) as string[];
  return parts.join(", ");
}

function formatJobSchedule(job: Job): string {
  if (job.startDate) {
    try {
      return new Date(job.startDate).toLocaleDateString("en-RW", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch {
      // fall through
    }
  }
  if (job.scheduleType) {
    return job.scheduleType.charAt(0).toUpperCase() + job.scheduleType.slice(1);
  }
  return "";
}

/** Small icon picker so the leading tile reflects the category — falls back to briefcase. */
function JobCategoryIcon({
  category,
  className,
}: {
  category?: string;
  className?: string;
}) {
  const name = (category || "").toLowerCase();
  if (name.includes("cleaning")) return <Sparkles className={className} />;
  if (name.includes("cook")) return <ChefHat className={className} />;
  if (name.includes("child") || name.includes("nann")) return <Baby className={className} />;
  if (name.includes("garden")) return <Trees className={className} />;
  if (name.includes("driver")) return <Car className={className} />;
  if (name.includes("plumb")) return <Wrench className={className} />;
  if (name.includes("electric")) return <Zap className={className} />;
  if (name.includes("elder")) return <Heart className={className} />;
  if (name.includes("laundry")) return <Shirt className={className} />;
  if (name.includes("security") || name.includes("guard")) return <Shield className={className} />;
  return <Briefcase className={className} />;
}
