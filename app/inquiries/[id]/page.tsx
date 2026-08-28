"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { goBackOr } from "@/lib/navigation";
import { colors } from "@/constant/colors";
import { useAuth } from "@/hooks/useAuth";
import { AgencyInquiry, inquiryStatusMap, inquiryPersonName } from "@/constant/agency-inquiries";
import { AgencyReviewPrompt } from "@/components/agency-review-prompt";

export default function InquiryDetailPage() {
  const t = useTranslations("inquiryDetail");
  const tShared = useTranslations("inquiryShared");
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();

  const [inquiry, setInquiry] = useState<AgencyInquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await api.get(`/inquiries/${id}`);
      setInquiry(res.data?.data || res.data);
      // Viewing marks the agency's messages read (read receipts).
    } catch (err) {
      setError(getApiErrorMessage(err, t("inquiryNotFound")));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Poll for status changes while the inquiry is live (the conversation
  // component polls its own messages).
  useEffect(() => {
    const active = inquiry?.status === "TALKING" || inquiry?.status === "HANDED_OVER";
    if (!active) return;
    const t = setInterval(() => { load(); }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiry?.status]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }
  if (error || !inquiry) {
    return (
      <div className="p-4">
        <button onClick={() => goBackOr(router, "/inquiries")} className="mb-4 flex items-center gap-2 text-sm font-medium text-ink">
          <ArrowLeft className="h-5 w-5" /> {t("back")}
        </button>
        <p className="text-sm text-ink-muted">{error || t("inquiryNotFound")}</p>
      </div>
    );
  }

  const meId = user?.id;
  const isEmployer = meId === inquiry.employer.id;
  const isHandoverWorker = meId === inquiry.handoverWorker?.id;
  const st = inquiryStatusMap(tShared)[inquiry.status];


  async function acceptHandover() {
    setBusy(true);
    try {
      const res = await api.post(`/inquiries/${id}/handover/accept`);
      toast.success(t("confirmedBookingCreated"));
      // Land in the new booking's chat room, which opens with a notice saying
      // who placed you (never the client's private note to the agency).
      const newBookingId = (res.data?.data || res.data)?.booking?.id;
      router.push(newBookingId ? `/conversations/inbox/${newBookingId}` : "/conversations");
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotAccept")));
      setBusy(false);
    }
  }

  async function declineHandover() {
    setBusy(true);
    try {
      await api.post(`/inquiries/${id}/handover/decline`);
      toast.success(t("offerDeclined"));
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotDecline")));
    } finally {
      setBusy(false);
    }
  }

  async function cancelInquiry() {
    if (!confirm(t("withdrawConfirm"))) return;
    setBusy(true);
    try {
      await api.post(`/inquiries/${id}/cancel`);
      toast.success(t("inquiryWithdrawn"));
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotCancel")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[428px] flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <button onClick={() => goBackOr(router, "/inquiries")} aria-label={t("back")}><ArrowLeft className="h-5 w-5 text-ink" /></button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-ink">{inquiry.agency?.name ?? t("agencyFallback")}</p>
          <p className="text-[11px] text-ink-muted">{st.label}</p>
        </div>
        <span className="rounded-full bg-[#EEF8EA] px-2.5 py-1 text-[11px] font-bold text-brand">{st.label}</span>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {/* Worker hand-over offer */}
        {isHandoverWorker && inquiry.status === "HANDED_OVER" && (
          <div className="rounded-2xl border border-[#C8E6C4] bg-[#EEF8EA] p-4">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <p className="text-[14px] font-bold text-ink">{t("placementOffer")}</p>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              {t.rich("wantsToPlaceYouWith", {
                agency: inquiry.agency?.name ?? t("agencyFallback"),
                employer: inquiryPersonName(inquiry.employer, tShared),
                agencyName: (chunks) => <span className="font-semibold text-ink">{chunks}</span>,
                employerName: (chunks) => <span className="font-semibold text-ink">{chunks}</span>,
              })}
            </p>
            <div className="mt-3 rounded-xl bg-white/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{t("employersNote")}</p>
              <p className="mt-1 text-[13px] text-ink">{inquiry.note}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={acceptHandover}
                disabled={busy}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand text-[14px] font-bold text-white disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> {t("accept")}</>}
              </button>
              <button
                onClick={declineHandover}
                disabled={busy}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 text-[14px] font-bold text-ink disabled:opacity-60"
              >
                <XCircle className="h-5 w-5" /> {t("decline")}
              </button>
            </div>
          </div>
        )}

        {isHandoverWorker && inquiry.status === "CONVERTED" && (
          <div className="rounded-2xl border border-[#C8E6C4] bg-[#EEF8EA] p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-brand" />
            <p className="text-[14px] font-bold text-ink">{t("youAcceptedPlacement")}</p>
            <button onClick={() => router.push("/conversations")} className="mt-3 text-[13px] font-semibold text-brand underline">
              {t("goToYourBookings")}
            </button>
          </div>
        )}

        {/* Employer: note recap + conversation */}
        {isEmployer && (
          <>
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{t("yourInquiry")}</p>
              <p className="mt-1 text-[13px] text-ink">{inquiry.note}</p>
              {inquiry.status === "PENDING" && (
                <p className="mt-2 text-[12px] text-ink-muted">{t("waitingForResponse", { agency: inquiry.agency?.name ?? t("agencyFallback") })}</p>
              )}
              {/* Between hand-over and the worker's answer the client used to
                  see nothing at all — the request just went quiet. */}
              {inquiry.status === "HANDED_OVER" && (
                <div className="mt-3 rounded-xl border border-[#C8E6C4] bg-[#EEF8EA] p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-brand" />
                    <p className="text-[13px] font-bold text-ink">
                      {t("workerProposedTitle", { worker: inquiryPersonName(inquiry.handoverWorker, tShared) })}
                    </p>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                    {t("workerProposedBody", { worker: inquiryPersonName(inquiry.handoverWorker, tShared) })}
                  </p>
                </div>
              )}
              {inquiry.status === "CONVERTED" && (
                <>
                  <button onClick={() => router.push("/conversations")} className="mt-2 block text-[13px] font-semibold text-brand underline">
                    {t("workerConfirmedGoToBookings")}
                  </button>
                  {inquiry.agency?.id && (
                    <AgencyReviewPrompt
                      agencyId={inquiry.agency.id}
                      agencyName={inquiry.agency.name ?? t("agencyFallback")}
                      bookingId={inquiry.bookingId ?? undefined}
                    />
                  )}
                </>
              )}
              {(inquiry.status === "PENDING" || inquiry.status === "TALKING" || inquiry.status === "HANDED_OVER") && (
                <button
                  onClick={cancelInquiry}
                  disabled={busy}
                  className="mt-3 h-10 w-full rounded-xl border-2 border-[#FBD5D5] text-[13px] font-bold text-[#DC2626] hover:bg-[#FEF2F2] disabled:opacity-60"
                >
                  {t("withdrawInquiry")}
                </button>
              )}
              {(inquiry.status === "CLOSED" || inquiry.status === "DECLINED") && (
                <p className="mt-2 text-[12px] text-ink-muted">
                  {inquiry.status === "CLOSED" ? t("inquiryStatusWithdrawn") : t("inquiryStatusDeclined")}
                </p>
              )}
            </div>

            {inquiry.conversation?.id && (
              <button
                onClick={() => router.push(`/conversations/thread/${inquiry.conversation!.id}`)}
                className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-ink">{t("conversation")}</p>
                  <p className="truncate text-[12px] text-ink-muted">{t("openConversationHint")}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
              </button>
            )}
          </>
        )}
      </div>

    </div>
  );
}
