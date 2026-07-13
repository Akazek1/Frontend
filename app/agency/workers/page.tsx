"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Download, Eye, Filter, MoreHorizontal, Search, UserPlus } from "lucide-react";
import api from "@/lib/axios";
import { AgencyCard, AgencyLoading, AgencyPageHeader, Avatar, StatusPill } from "@/components/agency/agency-ui";
import { cn } from "@/lib/utils";

type WorkerStatus = "ON_JOB" | "AVAILABLE" | "UNAVAILABLE" | "INACTIVE";

interface AgencyWorker {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  phoneNumber: string | null;
  trustScore: number;
  isVerified: boolean;
  jobsCompleted: number;
  skill: string | null;
  skillTitle: string | null;
  status: WorkerStatus;
  needsAttention: boolean;
  openIssues: number;
  currentPlacement: {
    id: string;
    placedAt: string;
    employer: { id: string; firstName: string | null; lastName: string | null };
  } | null;
}

type TabKey = "all" | "available" | "on_job" | "needs_attention" | "unavailable" | "inactive";

const TABS = (t: (key: string) => string): { key: TabKey; label: string }[] => [
  { key: "all", label: t("tabAllWorkers") },
  { key: "available", label: t("tabAvailable") },
  { key: "on_job", label: t("tabOnJob") },
  { key: "needs_attention", label: t("tabNeedsAttention") },
  { key: "unavailable", label: t("tabUnavailable") },
  { key: "inactive", label: t("tabInactive") },
];

const STATUS_PILL = (t: (key: string) => string): Record<WorkerStatus, { label: string; tone: "green" | "amber" | "gray" }> => ({
  ON_JOB: { label: t("statusOnJob"), tone: "green" },
  AVAILABLE: { label: t("statusAvailable"), tone: "green" },
  UNAVAILABLE: { label: t("statusUnavailable"), tone: "amber" },
  INACTIVE: { label: t("statusInactive"), tone: "gray" },
});

function fullName(w: AgencyWorker, t: (key: string) => string) {
  return `${w.firstName ?? ""} ${w.lastName ?? ""}`.trim() || t("unnamedWorker");
}

function formatSince(iso: string, t: (key: string, values?: Record<string, number>) => string) {
  const date = new Date(iso);
  const dateStr = date.toLocaleDateString("en-RW", { day: "2-digit", month: "short", year: "numeric" });
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  let rel: string;
  if (days < 7) rel = t("sinceDays", { days: days || 1 });
  else if (days < 30) rel = t("sinceWeeks", { weeks: Math.floor(days / 7) });
  else if (days < 365) rel = t("sinceMonths", { months: Math.floor(days / 30) });
  else rel = t("sinceYears", { years: Math.floor(days / 365) });
  return { dateStr, rel };
}

export default function AgencyWorkersPage() {
  const t = useTranslations("agencyWorkers");
  const router = useRouter();
  const [workers, setWorkers] = useState<AgencyWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/agency/workers");
        setWorkers(Array.isArray(res.data?.data) ? res.data.data : res.data ?? []);
      } catch {
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const counts = useMemo(() => {
    return {
      all: workers.length,
      available: workers.filter((w) => w.status === "AVAILABLE").length,
      on_job: workers.filter((w) => w.status === "ON_JOB").length,
      needs_attention: workers.filter((w) => w.needsAttention).length,
      unavailable: workers.filter((w) => w.status === "UNAVAILABLE").length,
      inactive: workers.filter((w) => w.status === "INACTIVE").length,
    } as Record<TabKey, number>;
  }, [workers]);

  const filtered = useMemo(() => {
    let list = workers;
    if (tab === "available") list = list.filter((w) => w.status === "AVAILABLE");
    else if (tab === "on_job") list = list.filter((w) => w.status === "ON_JOB");
    else if (tab === "needs_attention") list = list.filter((w) => w.needsAttention);
    else if (tab === "unavailable") list = list.filter((w) => w.status === "UNAVAILABLE");
    else if (tab === "inactive") list = list.filter((w) => w.status === "INACTIVE");

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (w) => fullName(w, t).toLowerCase().includes(q) || (w.skill ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [workers, tab, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Reset to page 1 whenever filters change
  useEffect(() => setPage(1), [tab, query, perPage]);

  function exportCsv() {
    const rows = [
      ["Name", "Phone", "Skill", "Status", "Current Employer", "Since"],
      ...filtered.map((w) => [
        fullName(w, t),
        w.phoneNumber ?? "",
        w.skill ?? "",
        STATUS_PILL(t)[w.status].label,
        w.currentPlacement ? `${w.currentPlacement.employer.firstName ?? ""} ${w.currentPlacement.employer.lastName ?? ""}`.trim() : "",
        w.currentPlacement ? formatSince(w.currentPlacement.placedAt, t).dateStr : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <AgencyLoading />;

  return (
    <div className="pb-24 lg:pb-0">
      <AgencyPageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        actions={
          <>
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-10 w-64 rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-[13px] outline-none focus:border-brand"
              />
            </div>
            <button className="hidden h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-semibold text-ink hover:bg-gray-50 md:flex">
              <Filter className="h-4 w-4" /> {t("filters")}
            </button>
            <button
              onClick={exportCsv}
              className="flex h-10 items-center gap-2 rounded-xl bg-brand px-3 text-[13px] font-semibold text-white hover:bg-brand-dark"
            >
              <Download className="h-4 w-4" /> {t("export")}
            </button>
          </>
        }
      />

      {/* Mobile search */}
      <div className="mb-3 flex items-center gap-2 md:hidden">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-[13px] outline-none focus:border-brand"
          />
        </div>
        <button className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-semibold text-ink">
          <Filter className="h-4 w-4" /> {t("filters")}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-white p-1 scrollbar-hide">
        {TABS(t).map((tabItem) => {
          const active = tab === tabItem.key;
          const count = counts[tabItem.key];
          return (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors",
                active ? "bg-brand text-white" : "text-ink-muted hover:bg-gray-50",
              )}
            >
              {tabItem.key === "needs_attention" && <AlertTriangle className={cn("h-3.5 w-3.5", active ? "text-white" : "text-[#DC2626]")} />}
              {tabItem.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-bold",
                  active ? "bg-white/20 text-white" : tabItem.key === "needs_attention" ? "bg-[#FEECEC] text-[#DC2626]" : "bg-gray-100 text-ink-muted",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop table */}
      <AgencyCard className="hidden overflow-hidden lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-5 py-3.5">{t("tableName")}</th>
              <th className="px-5 py-3.5">{t("tableSkill")}</th>
              <th className="px-5 py-3.5">{t("tableStatus")}</th>
              <th className="px-5 py-3.5">{t("tableCurrentEmployer")}</th>
              <th className="px-5 py-3.5">{t("tableSince")}</th>
              <th className="px-5 py-3.5 text-right">{t("tableActions")}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((w) => {
              const since = w.currentPlacement ? formatSince(w.currentPlacement.placedAt, t) : null;
              const pill = STATUS_PILL(t)[w.status];
              return (
                <tr key={w.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={w.profilePicture} name={fullName(w, t)} size={40} />
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-ink">{fullName(w, t)}</p>
                        <p className="text-[12px] text-ink-muted">{w.phoneNumber ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-medium text-ink">{w.skill ?? "—"}</p>
                    {w.skillTitle && <p className="text-[12px] text-ink-muted">{w.skillTitle}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <StatusPill label={pill.label} tone={pill.tone} />
                      {w.needsAttention && <AlertTriangle className="h-4 w-4 text-[#DC2626]" />}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {w.currentPlacement ? (
                      <p className="text-[13px] text-ink">
                        {`${w.currentPlacement.employer.firstName ?? ""} ${w.currentPlacement.employer.lastName ?? ""}`.trim() || "—"}
                      </p>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {since ? (
                      <div>
                        <p className="text-[13px] text-ink">{since.dateStr}</p>
                        <p className="text-[12px] text-ink-muted">{since.rel}</p>
                      </div>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => router.push(`/agency/workers/${w.id}`)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-gray-50"
                      >
                        <Eye className="h-3.5 w-3.5" /> {t("view")}
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-[14px] text-ink-muted">
                  {t("noWorkersFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <PaginationBar
          page={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          setPage={setPage}
          setPerPage={setPerPage}
          rangeLabel={t("showingRangeOfWorkers", { from: filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1, to: Math.min(currentPage * perPage, filtered.length), total: filtered.length })}
        />
      </AgencyCard>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {pageItems.map((w) => {
          const since = w.currentPlacement ? formatSince(w.currentPlacement.placedAt, t) : null;
          const pill = STATUS_PILL(t)[w.status];
          const expanded = expandedId === w.id;
          return (
            <AgencyCard key={w.id} className="p-4">
              <button
                className="flex w-full items-start gap-3 text-left"
                onClick={() => setExpandedId(expanded ? null : w.id)}
              >
                <Avatar src={w.profilePicture} name={fullName(w, t)} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-ink">{fullName(w, t)}</p>
                  <p className="text-[12px] text-ink-muted">
                    {w.skill ?? "—"}{w.skillTitle ? ` · ${w.skillTitle}` : ""}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <StatusPill label={pill.label} tone={pill.tone} />
                    {w.needsAttention && <AlertTriangle className="h-4 w-4 text-[#DC2626]" />}
                  </div>
                </div>
                <ChevronDown className={cn("h-5 w-5 shrink-0 text-gray-400 transition-transform", expanded && "rotate-180")} />
              </button>

              {w.currentPlacement && (
                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {`${w.currentPlacement.employer.firstName ?? ""} ${w.currentPlacement.employer.lastName ?? ""}`.trim()}
                    </p>
                  </div>
                  {since && (
                    <div className="text-right">
                      <p className="text-[12px] text-ink">{since.dateStr}</p>
                      <p className="text-[11px] text-ink-muted">{since.rel}</p>
                    </div>
                  )}
                </div>
              )}

              {expanded && (
                <div className="mt-3 grid grid-cols-4 gap-1 border-t border-gray-50 pt-3 text-center">
                  <ActionChip icon={<Eye className="h-4 w-4" />} label={t("actionProfile")} onClick={() => router.push(`/agency/workers/${w.id}`)} />
                  <ActionChip icon={<Eye className="h-4 w-4" />} label={t("actionPlacement")} onClick={() => router.push(`/agency/workers/${w.id}`)} />
                  <ActionChip icon={<AlertTriangle className="h-4 w-4" />} label={t("actionIssues")} badge={w.openIssues} onClick={() => router.push("/agency/issues")} />
                  <ActionChip icon={<MoreHorizontal className="h-4 w-4" />} label={t("actionMore")} />
                </div>
              )}
            </AgencyCard>
          );
        })}
        {pageItems.length === 0 && (
          <AgencyCard className="px-6 py-16 text-center text-[14px] text-ink-muted">{t("noWorkersFound")}</AgencyCard>
        )}

        <PaginationBar
          page={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          setPage={setPage}
          setPerPage={setPerPage}
          rangeLabel={t("showingRange", { from: filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1, to: Math.min(currentPage * perPage, filtered.length), total: filtered.length })}
          compact
        />
      </div>

      {/* Mobile sticky add button */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white p-3 lg:hidden">
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white">
          <UserPlus className="h-5 w-5" /> {t("addOrInviteWorker")}
        </button>
      </div>
    </div>
  );
}

function ActionChip({ icon, label, badge, onClick }: { icon: React.ReactNode; label: string; badge?: number; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="relative flex flex-col items-center gap-1 rounded-lg py-1.5 text-ink-muted hover:bg-gray-50">
      <span className="text-brand">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
      {badge ? (
        <span className="absolute right-2 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function PaginationBar({
  page,
  totalPages,
  perPage,
  setPage,
  setPerPage,
  rangeLabel,
  compact,
}: {
  page: number;
  totalPages: number;
  perPage: number;
  setPage: (n: number) => void;
  setPerPage: (n: number) => void;
  rangeLabel: string;
  compact?: boolean;
}) {
  const t = useTranslations("agencyWorkers");
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 6);
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 px-4 py-3", !compact && "border-t border-gray-100 lg:px-5")}>
      <p className="text-[12px] text-ink-muted">{rangeLabel}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-ink disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={cn(
              "flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-[13px] font-semibold",
              p === page ? "bg-brand text-white" : "border border-gray-200 text-ink hover:bg-gray-50",
            )}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-ink disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-ink-muted">{t("rowsPerPage")}</span>
        <select
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-[13px] outline-none"
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
