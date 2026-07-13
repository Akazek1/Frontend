"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  Info,
  MessageSquare,
  Phone,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { AgencyCard, AgencyLoading, AgencyPageHeader, Avatar, StatusPill } from "@/components/agency/agency-ui";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { cn } from "@/lib/utils";
import { ISSUE_STATUS, ISSUE_TYPE_LABEL } from "@/constant/agency-issues";

interface IssueDetail {
  id: string;
  issueType: string;
  description: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  agencyNotifiedAt: string | null;
  resolvedAt: string | null;
  reportedBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
    phoneNumber: string | null;
    createdAt: string | null;
    isVerified: boolean;
  };
  placement: {
    id: string;
    status: string;
    placedAt: string;
    commissionAmount: number | null;
    worker: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      profilePicture: string | null;
      phoneNumber: string | null;
      isVerified: boolean;
      services: { title: string; category: { name: string } | null }[];
    };
  };
}

function name(p: { firstName: string | null; lastName: string | null }, fallback: string) {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || fallback;
}

function fmt(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-RW", { dateStyle: "medium", timeStyle: "short" });
}

export default function IssueDetailPage() {
  const t = useTranslations("agencyIssueDetail");
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await api.get(`/agency/issues/${id}`);
        setIssue(res.data?.data || res.data);
      } catch (err) {
        setError(getApiErrorMessage(err, t("issueNotFound")));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function resolveIssue(note: string) {
    setBusy(true);
    try {
      const res = await api.patch(`/agency/issues/${id}/resolve`, { resolution: note || undefined });
      setIssue((prev) => (prev ? { ...prev, ...res.data?.data, ...res.data } : prev));
      toast.success(t("issueResolved"));
      setResolveOpen(false);
      setResolution("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotResolve")));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <AgencyLoading />;
  if (error || !issue) {
    return (
      <div>
        <AgencyPageHeader title={t("issueDetailTitle")} backHref="/agency/issues" />
        <p className="text-[14px] text-ink-muted">{error || t("issueNotFound")}</p>
      </div>
    );
  }

  const isResolved = issue.status === "RESOLVED";
  const worker = issue.placement.worker;
  const st = ISSUE_STATUS[issue.status] ?? ISSUE_STATUS.REPORTED;

  const trail = [
    { label: t("trailReported"), at: issue.createdAt, done: true, tone: "red" as const },
    { label: t("trailAgencyNotified"), at: issue.agencyNotifiedAt, done: Boolean(issue.agencyNotifiedAt), tone: "amber" as const },
    { label: t("trailResolved"), at: issue.resolvedAt, done: isResolved, tone: "green" as const },
  ];

  return (
    <div className="pb-6">
      <AgencyPageHeader
        title={t("issueDetailTitle")}
        subtitle={t("reportedOn", { date: fmt(issue.createdAt) as string })}
        backHref="/agency/issues"
        badge={
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[12px] font-bold text-ink-muted">
            #{issue.id.slice(0, 8).toUpperCase()}
          </span>
        }
        actions={<StatusPill label={st.label} tone={st.tone} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* LEFT (spans 2): info + placement + trail */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Issue information */}
          <AgencyCard className="p-5">
            <h2 className="mb-3 text-[15px] font-bold text-ink">{t("issueInformation")}</h2>
            <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">{t("issueType")}</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEECEC] px-3 py-1.5 text-[13px] font-bold text-[#DC2626]">
              <AlertCircle className="h-4 w-4" />
              {ISSUE_TYPE_LABEL[issue.issueType] ?? issue.issueType}
            </span>
            <p className="mb-1.5 mt-4 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">{t("descriptionFromEmployer")}</p>
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink">{issue.description}</p>
            {issue.resolution && (
              <div className="mt-4 rounded-xl bg-[#EEF8EA] p-3">
                <p className="mb-1 text-[12px] font-semibold text-brand">{t("resolution")}</p>
                <p className="text-[13px] text-ink">{issue.resolution}</p>
              </div>
            )}
          </AgencyCard>

          {/* Placement details */}
          <AgencyCard className="p-5">
            <h2 className="mb-4 text-[15px] font-bold text-ink">{t("placementDetails")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">{t("worker")}</p>
                <div className="flex items-center gap-3">
                  <Avatar src={worker.profilePicture} name={name(worker, t("unknownName"))} size={44} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-[14px] font-bold text-ink">{name(worker, t("unknownName"))}</p>
                      {worker.isVerified && <VerifiedBadge size={13} />}
                    </div>
                    <p className="truncate text-[12px] text-ink-muted">
                      {worker.services[0]?.category?.name ?? worker.services[0]?.title ?? "—"}
                    </p>
                    <StatusPill label={issue.placement.status === "ACTIVE" ? t("active") : issue.placement.status} tone={issue.placement.status === "ACTIVE" ? "green" : "gray"} className="mt-1" />
                    {worker.phoneNumber && <p className="mt-1 text-[11px] text-ink-muted">{t("phonePrefix", { phone: worker.phoneNumber })}</p>}
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">{t("employer")}</p>
                <div className="flex items-center gap-3">
                  <Avatar src={issue.reportedBy.profilePicture} name={name(issue.reportedBy, t("unknownName"))} size={44} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-[14px] font-bold text-ink">{name(issue.reportedBy, t("unknownName"))}</p>
                      {issue.reportedBy.isVerified && <VerifiedBadge size={13} />}
                    </div>
                    {issue.reportedBy.createdAt && (
                      <p className="text-[12px] text-ink-muted">
                        {t("memberSince", { date: new Date(issue.reportedBy.createdAt).toLocaleDateString("en-RW", { month: "short", year: "numeric" }) })}
                      </p>
                    )}
                    {issue.reportedBy.phoneNumber && <p className="mt-1 text-[11px] text-ink-muted">{t("phonePrefix", { phone: issue.reportedBy.phoneNumber })}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 border-t border-gray-50 pt-4 sm:grid-cols-3">
              <Meta icon={Calendar} label={t("placementStart")} value={new Date(issue.placement.placedAt).toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric" })} />
              <Meta icon={Clock} label={t("status")} value={issue.placement.status === "ACTIVE" ? t("active") : issue.placement.status} />
              <Meta icon={Coins} label={t("rate")} value={issue.placement.commissionAmount ? `${new Intl.NumberFormat("en-RW").format(issue.placement.commissionAmount)} RWF` : "—"} />
            </div>
          </AgencyCard>

          {/* Status trail */}
          <AgencyCard className="p-5">
            <h2 className="mb-5 text-[15px] font-bold text-ink">{t("statusTrail")}</h2>
            <div className="flex items-start justify-between">
              {trail.map((node, i) => (
                <div key={node.label} className="relative flex flex-1 flex-col items-center text-center">
                  {i < trail.length - 1 && (
                    <span className={cn("absolute left-1/2 top-4 h-0.5 w-full", node.done ? "bg-brand/40" : "bg-gray-200")} />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full",
                      node.done
                        ? node.tone === "red"
                          ? "bg-[#DC2626] text-white"
                          : node.tone === "amber"
                          ? "bg-[#FB9400] text-white"
                          : "bg-brand text-white"
                        : "bg-gray-200 text-gray-400",
                    )}
                  >
                    {node.tone === "red" ? <AlertCircle className="h-4 w-4" /> : node.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </span>
                  <p className="mt-2 text-[12px] font-bold text-ink">{node.label}</p>
                  <p className="text-[11px] text-ink-muted">{node.at ? fmt(node.at) : t("pending")}</p>
                </div>
              ))}
            </div>
          </AgencyCard>
        </div>

        {/* RIGHT: take action */}
        <div className="flex flex-col gap-4">
          <AgencyCard className="p-5">
            <h2 className="text-[15px] font-bold text-ink">{t("takeAction")}</h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">{t("chooseHowToResolve")}</p>

            <div className="mt-4 flex flex-col gap-3">
              <ActionButton
                disabled={isResolved || busy}
                onClick={() => resolveIssue(t("replacementOfferedNote"))}
                tone="green"
                icon={<Users className="h-5 w-5" />}
                title={t("offerReplacement")}
                desc={t("offerReplacementDesc")}
              />
              <ActionButton
                onClick={() => router.push("/agency/messages")}
                tone="blue"
                icon={<MessageSquare className="h-5 w-5" />}
                title={t("messageEmployer")}
                desc={t("messageEmployerDesc")}
              />
              <ActionButton
                disabled={isResolved || busy}
                onClick={() => setResolveOpen(true)}
                tone="amber"
                icon={<CheckCircle2 className="h-5 w-5" />}
                title={isResolved ? t("resolved") : t("markAsResolved")}
                desc={t("markAsResolvedDesc")}
              />
            </div>
          </AgencyCard>

          <div className="flex items-start gap-2.5 rounded-2xl border border-[#CFE3FB] bg-[#EFF6FF] p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4ED8]" />
            <p className="text-[12px] leading-snug text-[#1E40AF]">
              <span className="font-bold">{t("needHelp")}</span> {t("needHelpDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Resolve modal */}
      {resolveOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-ink">{t("markAsResolved")}</h3>
              <button onClick={() => setResolveOpen(false)} className="text-gray-400 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-[13px] text-ink-muted">{t("resolveNotePrompt")}</p>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
              placeholder={t("resolveNotePlaceholder")}
              className="w-full rounded-xl border border-gray-200 p-3 text-[13px] outline-none focus:border-brand"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setResolveOpen(false)}
                className="h-11 flex-1 rounded-xl border-2 border-gray-100 text-[14px] font-bold text-gray-500 hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => resolveIssue(resolution)}
                disabled={busy}
                className="h-11 flex-1 rounded-xl bg-brand text-[14px] font-bold text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {busy ? t("saving") : t("markResolved")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: React.ElementType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-brand" />
      <div className="min-w-0">
        <p className="text-[11px] text-ink-muted">{label}</p>
        <p className="truncate text-[13px] font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  title,
  desc,
  tone,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tone: "green" | "blue" | "amber";
  onClick: () => void;
  disabled?: boolean;
}) {
  const tones = {
    green: "border-[#C8E6C4] bg-[#F1FCEF] hover:bg-[#E8F7E5] text-brand",
    blue: "border-[#CFE3FB] bg-[#EFF6FF] hover:bg-[#E0EDFD] text-[#1D4ED8]",
    amber: "border-[#FCE4BD] bg-[#FFF8EC] hover:bg-[#FFF1D6] text-[#B45309]",
  } as const;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-colors disabled:opacity-50",
        tones[tone],
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold">{title}</p>
        <p className="text-[12px] opacity-80">{desc}</p>
      </div>
    </button>
  );
}
