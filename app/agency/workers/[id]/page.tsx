"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Coins,
  Download,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { AgencyCard, AgencyLoading, AgencyPageHeader, Avatar, Collapsible, StatusPill } from "@/components/agency/agency-ui";
import { cn } from "@/lib/utils";

interface WorkerDoc {
  id: string;
  type: string;
  status: string;
  documentFileName: string;
  documentUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface PlacementRow {
  id: string;
  status: "ACTIVE" | "TERMINATED" | "OPTED_OUT";
  placedAt: string;
  endedAt: string | null;
  commissionAmount: number | null;
  employer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
    addresses: { city: string; district: string | null }[];
  };
}

interface WorkerDetail {
  worker: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phoneNumber: string | null;
    dateOfBirth: string | null;
    profilePicture: string | null;
    languages: string[];
    yearsOfExperience: number | null;
    trustScore: number;
    isVerified: boolean;
    isActive: boolean;
    availableForWork: boolean;
    jobsCompleted: number;
    createdAt: string;
    addresses: { city: string; district: string | null; sector: string | null }[];
    services: { id: string; title: string; category: { name: string } | null }[];
    documents: WorkerDoc[];
    rating: number;
    reviewCount: number;
  };
  currentPlacement: PlacementRow | null;
  placementHistory: PlacementRow[];
}

function name(p: { firstName: string | null; lastName: string | null }, t: (key: string) => string) {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || t("unknownFallback");
}

function locationOf(addr: { city: string; district: string | null }[]) {
  const a = addr?.[0];
  if (!a) return null;
  return [a.district, a.city].filter(Boolean).join(", ");
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric" });
}

function ageFrom(iso: string | null) {
  if (!iso) return null;
  const age = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return age > 0 && age < 120 ? age : null;
}

const DOC_LABEL = (t: (key: string) => string): Record<string, string> => ({
  GOVERNMENT_ID: t("docNationalId"),
  PASSPORT: t("docPassport"),
  DRIVER_LICENSE: t("docDriverLicense"),
  OTHER: t("docOther"),
});

const DOC_STATUS = (t: (key: string) => string): Record<string, { label: string; tone: "green" | "amber" | "red" | "gray" }> => ({
  APPROVED: { label: t("docStatusApproved"), tone: "green" },
  PENDING_VERIFICATION: { label: t("docStatusPending"), tone: "amber" },
  UNDER_REVIEW: { label: t("docStatusUnderReview"), tone: "amber" },
  REJECTED: { label: t("docStatusRejected"), tone: "red" },
});

const PLACEMENT_OUTCOME = (t: (key: string) => string): Record<PlacementRow["status"], { label: string; tone: "green" | "red" | "amber" }> => ({
  ACTIVE: { label: t("outcomeOngoing"), tone: "green" },
  TERMINATED: { label: t("outcomeEndedByEmployer"), tone: "red" },
  OPTED_OUT: { label: t("outcomeWorkerOptedOut"), tone: "amber" },
});

function GuaranteeWindow({ placedAt }: { placedAt: string }) {
  const t = useTranslations("agencyWorkerDetail");
  const start = new Date(placedAt).getTime();
  const end = start + 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const remainingDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  const elapsed = Math.min(1, Math.max(0, (now - start) / (end - start)));
  const active = remainingDays > 0;
  return (
    <div className={cn("mt-3 rounded-xl p-3", active ? "bg-[#EEF8EA]" : "bg-gray-50")}>
      <div className="flex items-center gap-2">
        <ShieldCheck className={cn("h-4 w-4", active ? "text-brand" : "text-gray-400")} />
        <p className="text-[13px] font-bold text-ink">{t("guaranteeWindowTitle")}</p>
      </div>
      <p className="mt-0.5 text-[12px] text-ink-muted">
        {active
          ? t("guaranteeRemaining", { days: remainingDays, date: fmtDate(new Date(end).toISOString()) })
          : t("guaranteeEnded")}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round(elapsed * 100)}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-ink-muted">{t("guaranteeFreeReplacement")}</p>
    </div>
  );
}

export default function WorkerDetailPage() {
  const t = useTranslations("agencyWorkerDetail");
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<WorkerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await api.get(`/agency/workers/${id}`);
        setData(res.data?.data || res.data);
      } catch (err) {
        setError(getApiErrorMessage(err, t("workerNotFound")));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <AgencyLoading />;
  if (error || !data) {
    return (
      <div>
        <AgencyPageHeader title={t("workerDetail")} backHref="/agency/workers" />
        <p className="text-[14px] text-ink-muted">{error || t("workerNotFound")}</p>
      </div>
    );
  }

  const { worker, currentPlacement, placementHistory } = data;
  const age = ageFrom(worker.dateOfBirth);
  const skill = worker.services[0]?.category?.name ?? worker.services[0]?.title ?? null;
  const hasPoliceCheck = worker.documents.some((d) => d.status === "APPROVED" && d.type !== "GOVERNMENT_ID");

  return (
    <div className="pb-6">
      {/* Breadcrumb (desktop) */}
      <nav className="mb-3 hidden items-center gap-1.5 text-[13px] lg:flex">
        <Link href="/agency/workers" className="font-semibold text-ink-muted hover:text-brand">{t("workers")}</Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-brand">{name(worker, t)}</span>
      </nav>

      <AgencyPageHeader
        title={name(worker, t)}
        subtitle={skill ?? undefined}
        backHref="/agency/workers"
        badge={<StatusPill label={worker.isActive ? t("activeWorker") : t("inactive")} tone={worker.isActive ? "green" : "gray"} />}
        actions={
          <>
            <button className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-semibold text-ink hover:bg-gray-50">
              <Pencil className="h-4 w-4" /> {t("editProfile")}
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-ink-muted hover:bg-gray-50">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </>
        }
      />

      {/* Trust badge row */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {worker.isVerified && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EEF8EA] px-2.5 py-1 text-[12px] font-semibold text-brand">
            <ShieldCheck className="h-3.5 w-3.5" /> {t("idVerified")}
          </span>
        )}
        {hasPoliceCheck && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EEF8EA] px-2.5 py-1 text-[12px] font-semibold text-brand">
            <ShieldCheck className="h-3.5 w-3.5" /> {t("policeChecked")}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-[12px] font-medium text-ink-muted">
          <Calendar className="h-3.5 w-3.5" /> {t("joinedDate", { date: fmtDate(worker.createdAt) })}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* LEFT column */}
        <div className="flex flex-col gap-4">
          {/* Profile overview */}
          <AgencyCard className="p-5">
            <h2 className="mb-4 text-[15px] font-bold text-ink">{t("profileOverview")}</h2>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Avatar src={worker.profilePicture} name={name(worker, t)} size={88} className="h-24 w-24 rounded-2xl sm:h-22 sm:w-22" />
              <div className="flex-1 space-y-2">
                <OverviewRow icon={Phone} label={t("phone")} value={worker.phoneNumber || "—"} />
                <OverviewRow icon={Mail} label={t("email")} value={worker.email || "—"} />
                <OverviewRow icon={Calendar} label={t("dateOfBirth")} value={worker.dateOfBirth ? `${fmtDate(worker.dateOfBirth)}${age ? ` (${t("ageYears", { age })})` : ""}` : "—"} />
                <OverviewRow icon={MapPin} label={t("location")} value={locationOf(worker.addresses) || "—"} />
                <OverviewRow icon={MessageSquare} label={t("languages")} value={worker.languages?.length ? worker.languages.join(", ") : "—"} />
                <OverviewRow icon={Briefcase} label={t("experience")} value={worker.yearsOfExperience != null ? t("experienceYears", { years: worker.yearsOfExperience }) : "—"} />
                <OverviewRow
                  icon={MessageSquare}
                  label={t("reviews")}
                  value={worker.reviewCount > 0 ? t("reviewCount", { count: worker.reviewCount }) : t("noReviewsYet")}
                />
              </div>
            </div>
          </AgencyCard>

          {/* Current placement */}
          <Collapsible
            title={t("currentPlacement")}
            icon={CalendarClock}
            action={currentPlacement ? <StatusPill label={t("onJob")} tone="green" /> : undefined}
          >
            {currentPlacement ? (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={null} name={name(currentPlacement.employer, t)} size={44} />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{t("employer")}</p>
                      <p className="text-[14px] font-bold text-ink">{name(currentPlacement.employer, t)}</p>
                      {currentPlacement.employer.phoneNumber && (
                        <p className="text-[12px] text-ink-muted">{currentPlacement.employer.phoneNumber}</p>
                      )}
                      {locationOf(currentPlacement.employer.addresses) && (
                        <p className="flex items-center gap-1 text-[12px] text-ink-muted">
                          <MapPin className="h-3 w-3" /> {locationOf(currentPlacement.employer.addresses)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:text-right">
                    <Meta label={t("since")} value={fmtDate(currentPlacement.placedAt)} />
                    <Meta label={t("rate")} value={currentPlacement.commissionAmount ? `${new Intl.NumberFormat("en-RW").format(currentPlacement.commissionAmount)} RWF` : "—"} />
                  </div>
                </div>
                <GuaranteeWindow placedAt={currentPlacement.placedAt} />
              </>
            ) : (
              <p className="rounded-xl bg-gray-50 p-4 text-center text-[13px] text-ink-muted">
                {t("notCurrentlyPlaced")}
              </p>
            )}
          </Collapsible>

          {/* Documents */}
          <Collapsible title={t("documents")} icon={FileText}>
            {worker.documents.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-4 text-center text-[13px] text-ink-muted">{t("noDocumentsUploaded")}</p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-50">
                {worker.documents.map((doc) => {
                  const st = DOC_STATUS(t)[doc.status] ?? DOC_STATUS(t).PENDING_VERIFICATION;
                  return (
                    <div key={doc.id} className="flex items-center gap-3 py-3 first:pt-0">
                      <FileText className="h-5 w-5 shrink-0 text-ink-muted" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">{DOC_LABEL(t)[doc.type] ?? t("docOther")}</p>
                        <p className="truncate text-[12px] text-ink-muted">{doc.documentFileName}</p>
                      </div>
                      <StatusPill label={st.label} tone={st.tone} />
                      <span className="hidden text-right text-[11px] text-ink-muted sm:block">
                        {doc.status === "APPROVED" ? t("verifiedDate", { date: fmtDate(doc.updatedAt) }) : t("submittedDate", { date: fmtDate(doc.createdAt) })}
                      </span>
                      <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-gray-100">
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#FBD5D5] text-[13px] font-bold text-[#DC2626] hover:bg-[#FEF2F2]">
                <Trash2 className="h-4 w-4" /> {t("removeFromAgency")}
              </button>
              <button className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 text-[13px] font-bold text-ink hover:bg-gray-50">
                <CalendarClock className="h-4 w-4" /> {t("reportUnavailability")}
              </button>
            </div>
          </Collapsible>
        </div>

        {/* RIGHT column: placement history */}
        <div>
          <Collapsible title={t("placementHistory")} icon={Briefcase}>
            {placementHistory.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-4 text-center text-[13px] text-ink-muted">{t("noPlacementHistoryYet")}</p>
            ) : (
              <div className="flex flex-col gap-4">
                {placementHistory.map((p) => {
                  const outcome = PLACEMENT_OUTCOME(t)[p.status];
                  const loc = locationOf(p.employer.addresses);
                  return (
                    <div key={p.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar src={null} name={name(p.employer, t)} size={36} />
                          <div>
                            <p className="text-[14px] font-bold text-ink">{name(p.employer, t)}</p>
                            {loc && <p className="text-[12px] text-ink-muted">{loc}</p>}
                          </div>
                        </div>
                        <StatusPill label={p.status === "ACTIVE" ? t("current") : t("ended")} tone={p.status === "ACTIVE" ? "green" : "gray"} />
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-muted">
                        <Calendar className="h-3.5 w-3.5" />
                        {fmtDate(p.placedAt)} – {p.endedAt ? fmtDate(p.endedAt) : t("present")}
                      </div>
                      <p className="mt-1 text-[12px]">
                        <span className="text-ink-muted">{t("outcomePrefix")}</span>
                        <span className={cn("font-semibold", outcome.tone === "green" ? "text-brand" : outcome.tone === "red" ? "text-[#DC2626]" : "text-[#B45309]")}>
                          {outcome.label}
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

function OverviewRow({ icon: Icon, label, value }: { icon: React.ElementType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-ink-muted" />
      <span className="w-24 shrink-0 text-[13px] text-ink-muted">{label}</span>
      <span className="text-[13px] font-semibold text-ink">{value}</span>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className="text-[13px] font-semibold text-ink">{value}</p>
    </div>
  );
}
