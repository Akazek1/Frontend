"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Send,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { AgencyCard, AgencyLoading, AgencyPageHeader, Avatar, StatusPill } from "@/components/agency/agency-ui";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { AgencyInquiry, inquiryStatusMap, inquiryPersonName } from "@/constant/agency-inquiries";
import { cn } from "@/lib/utils";

interface AgencyWorkerLite {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  skill: string | null;
  status: string;
}

export default function AgencyInquiryDetailPage() {
  const t = useTranslations("agencyInquiryDetail");
  const tShared = useTranslations("inquiryShared");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [inquiry, setInquiry] = useState<AgencyInquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [workers, setWorkers] = useState<AgencyWorkerLite[]>([]);
  const [handoverId, setHandoverId] = useState<string>("");
  const [showEmployer, setShowEmployer] = useState(false);
  const [openingReply, setOpeningReply] = useState("");

  async function load() {
    try {
      const res = await api.get(`/inquiries/${id}`);
      const data: AgencyInquiry = res.data?.data || res.data;
      setInquiry(data);
      setHandoverId((prev) => prev || data.workerOfInterest?.id || "");
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

  // Load agency workers for the hand-over picker
  useEffect(() => {
    api.get("/agency/workers").then((res) => {
      setWorkers(Array.isArray(res.data?.data) ? res.data.data : res.data ?? []);
    }).catch(() => setWorkers([]));
  }, []);

  // Poll for status changes while the inquiry is live.
  useEffect(() => {
    const active = inquiry?.status === "TALKING" || inquiry?.status === "HANDED_OVER";
    if (!active) return;
    const t = setInterval(() => { load(); }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiry?.status]);

  // Accepting posts the agency's opening reply into the room and drops the
  // agency straight into it — the client gets the same room via their notification.
  async function acceptToTalk() {
    setBusy("accept");
    try {
      const res = await api.post(`/inquiries/${id}/accept`, { message: openingReply.trim() || undefined });
      const data: AgencyInquiry = res.data?.data || res.data;
      toast.success(t("conversationOpened"));
      const convoId = data?.conversation?.id;
      if (convoId) router.push(`/agency/messages/${convoId}`);
      else await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("actionFailed")));
    } finally {
      setBusy(null);
    }
  }

  async function act(path: string, body?: unknown, successMsg?: string) {
    setBusy(path);
    try {
      await api.post(`/inquiries/${id}/${path}`, body ?? {});
      if (successMsg) toast.success(successMsg);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("actionFailed")));
    } finally {
      setBusy(null);
    }
  }


  const availableWorkers = useMemo(
    () => workers.filter((w) => w.status === "AVAILABLE" || w.id === inquiry?.workerOfInterest?.id),
    [workers, inquiry],
  );

  if (loading) return <AgencyLoading />;
  if (error || !inquiry) {
    return (
      <div>
        <AgencyPageHeader title={t("inquiry")} backHref="/agency/requests" />
        <p className="text-[14px] text-ink-muted">{error || t("inquiryNotFound")}</p>
      </div>
    );
  }

  const st = inquiryStatusMap(tShared)[inquiry.status];
  const isTalking = inquiry.status === "TALKING";
  const isPending = inquiry.status === "PENDING";

  return (
    <div className="pb-6">
      <AgencyPageHeader
        title={t("hiringInquiry")}
        subtitle={t("fromName", { name: inquiryPersonName(inquiry.employer, tShared) })}
        backHref="/agency/requests"
        badge={<StatusPill label={st.label} tone={st.tone} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* LEFT: employer + note + worker of interest */}
        <div className="flex flex-col gap-4">
          <AgencyCard className="p-5">
            <h2 className="mb-3 text-[15px] font-bold text-ink">{t("employer")}</h2>
            <button onClick={() => setShowEmployer((s) => !s)} className="flex w-full items-center gap-3 text-left">
              <Avatar src={inquiry.employer.profilePicture} name={inquiryPersonName(inquiry.employer, tShared)} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-[16px] font-bold text-ink hover:underline">{inquiryPersonName(inquiry.employer, tShared)}</p>
                  {inquiry.employer.isVerified && <VerifiedBadge size={14} />}
                </div>
                {(() => {
                  const a = inquiry.employer.addresses?.[0];
                  const loc = a ? [a.sector, a.district].filter(Boolean).join(", ") || a.city : null;
                  return loc ? (
                    <p className="flex items-center gap-1 text-[12px] text-ink-muted"><MapPin className="h-3 w-3" /> {loc}</p>
                  ) : null;
                })()}
              </div>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform", showEmployer && "rotate-180")} />
            </button>
            {showEmployer && (
              <div className="mt-3 space-y-1.5 border-t border-gray-50 pt-3 text-[12px] text-ink-muted">
                {inquiry.employer.email && <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {inquiry.employer.email}</p>}
                {(() => {
                  const a = inquiry.employer.addresses?.[0];
                  const loc = a ? [a.sector, a.district, a.city].filter(Boolean).join(", ") : null;
                  return loc ? (
                    <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {loc}</p>
                  ) : null;
                })()}
              </div>
            )}
            {inquiry.workerOfInterest && (
              <p className="mt-4 rounded-xl bg-[#EEF8EA] px-3 py-2 text-[13px] font-semibold text-ink">
                {t("wouldLikeToWorkWith", {
                  employer: inquiryPersonName(inquiry.employer, tShared),
                  worker: inquiryPersonName(inquiry.workerOfInterest, tShared),
                })}
              </p>
            )}
            <div className="mt-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink"><MessageSquare className="h-4 w-4 text-ink-muted" /> {t("theirNote")}</p>
              <p className="whitespace-pre-line rounded-xl bg-[#F4F7F3] p-3 text-[13px] leading-relaxed text-ink-muted">{inquiry.note}</p>
            </div>
          </AgencyCard>

          {inquiry.workerOfInterest && (
            <AgencyCard className="p-5">
              <h2 className="mb-3 text-[15px] font-bold text-ink">{t("workerOfInterest")}</h2>
              <div className="flex items-center gap-3">
                <Avatar src={inquiry.workerOfInterest.profilePicture} name={inquiryPersonName(inquiry.workerOfInterest, tShared)} size={44} />
                <div className="flex items-center gap-1">
                  <p className="text-[14px] font-bold text-ink">{inquiryPersonName(inquiry.workerOfInterest, tShared)}</p>
                  {inquiry.workerOfInterest.isVerified && <VerifiedBadge size={13} />}
                </div>
              </div>
            </AgencyCard>
          )}

          {/* Status-specific summaries */}
          {inquiry.status === "HANDED_OVER" && inquiry.handoverWorker && (
            <AgencyCard className="p-4">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 shrink-0 text-[#B45309]" />
                <p className="text-[13px] text-ink">
                  {t.rich("waitingForAcceptance", {
                    worker: inquiryPersonName(inquiry.handoverWorker, tShared),
                    name: (chunks) => <span className="font-bold">{chunks}</span>,
                  })}
                </p>
              </div>
              <button
                onClick={() => act("handover/cancel", undefined, t("offerWithdrawn"))}
                disabled={busy !== null}
                className="mt-3 h-10 w-full rounded-xl border-2 border-gray-200 text-[13px] font-bold text-ink hover:bg-gray-50 disabled:opacity-60"
              >
                {t("cancelOfferChooseAnother")}
              </button>
            </AgencyCard>
          )}
          {inquiry.status === "CONVERTED" && (
            <AgencyCard className="flex items-center gap-3 p-4">
              <CheckCircle2 className="h-5 w-5 text-brand" />
              <p className="text-[13px] text-ink">
                {t.rich("placedWith", {
                  worker: inquiryPersonName(inquiry.handoverWorker, tShared),
                  name: (chunks) => <span className="font-bold">{chunks}</span>,
                })}
              </p>
            </AgencyCard>
          )}
          {inquiry.status === "DECLINED" && (
            <AgencyCard className="flex items-center gap-3 p-4">
              <XCircle className="h-5 w-5 text-[#DC2626]" />
              <p className="text-[13px] text-ink">{t("declinedInquiry")}</p>
            </AgencyCard>
          )}
        </div>

        {/* RIGHT: actions + conversation */}
        <div className="flex flex-col gap-4">
          {isPending && (
            <AgencyCard className="p-5">
              <h2 className="text-[15px] font-bold text-ink">{t("respond")}</h2>
              <p className="mt-0.5 text-[12px] text-ink-muted">{t("acceptOrDeclineDesc")}</p>
              <textarea
                value={openingReply}
                onChange={(e) => setOpeningReply(e.target.value)}
                rows={3}
                placeholder={t("openingReplyPlaceholder")}
                className="mt-3 w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-brand"
              />
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={acceptToTalk}
                  disabled={busy !== null}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand text-[14px] font-bold text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  <MessageSquare className="h-5 w-5" /> {t("acceptToTalk")}
                </button>
                <button
                  onClick={() => act("decline", undefined, t("inquiryDeclined"))}
                  disabled={busy !== null}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#FBD5D5] text-[14px] font-bold text-[#DC2626] hover:bg-[#FEF2F2] disabled:opacity-60"
                >
                  <XCircle className="h-5 w-5" /> {t("decline")}
                </button>
              </div>
            </AgencyCard>
          )}

          {/* Conversation lives in Messages — link to the chat room. */}
          {(isTalking || inquiry.status === "HANDED_OVER" || inquiry.status === "CONVERTED") && (
            <button
              onClick={() => inquiry.conversation?.id && router.push(`/agency/messages/${inquiry.conversation.id}`)}
              className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm hover:bg-gray-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF8EA]">
                <MessageSquare className="h-5 w-5 text-brand" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-ink">{t("openConversation")}</p>
                <p className="truncate text-[12px] text-ink-muted">
                  {(inquiry.messages?.length ?? 0) > 0 ? inquiry.messages![inquiry.messages!.length - 1].content : t("startConversation")}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
            </button>
          )}

          {/* Hand over a worker */}
          {isTalking && (
            <AgencyCard className="p-5">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink"><Users className="h-4 w-4 text-brand" /> {t("handOverWorker")}</h2>
              <p className="mt-0.5 text-[12px] text-ink-muted">{t("handOverDesc")}</p>
              <select
                value={handoverId}
                onChange={(e) => setHandoverId(e.target.value)}
                className="mt-3 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[14px] outline-none focus:border-brand"
              >
                <option value="">{t("selectWorker")}</option>
                {availableWorkers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {inquiryPersonName(w, tShared)}{w.skill ? ` · ${w.skill}` : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handoverId && act("handover", { workerId: handoverId }, t("sentForConfirmation"))}
                disabled={busy !== null || !handoverId}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[14px] font-bold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                <Briefcase className="h-5 w-5" /> {t("handOverWorkerButton")}
              </button>
            </AgencyCard>
          )}
        </div>
      </div>
    </div>
  );
}
