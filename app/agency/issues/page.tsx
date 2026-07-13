"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/lib/axios";
import { AgencyCard, AgencyEmpty, AgencyLoading, AgencyPageHeader, Avatar, StatusPill } from "@/components/agency/agency-ui";
import { cn } from "@/lib/utils";
import { issueStatusMap, issueTypeLabelMap } from "@/constant/agency-issues";

interface IssueListItem {
  id: string;
  issueType: string;
  description: string;
  status: string;
  createdAt: string;
  reportedBy: { id: string; firstName: string | null; lastName: string | null; profilePicture: string | null };
  placement: {
    id: string;
    worker: { id: string; firstName: string | null; lastName: string | null; profilePicture: string | null; isVerified: boolean };
  };
}

function name(p: { firstName: string | null; lastName: string | null }, t: (key: string) => string) {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || t("unknownName");
}

type FilterKey = "open" | "all" | "RESOLVED";

export default function AgencyIssuesPage() {
  const t = useTranslations("agencyIssues");
  const tShared = useTranslations("issueShared");
  const FILTERS = [
    { key: "open" as const, label: t("filterOpen") },
    { key: "all" as const, label: t("filterAll") },
    { key: "RESOLVED" as const, label: t("filterResolved") },
  ];
  const router = useRouter();
  const [issues, setIssues] = useState<IssueListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("open");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/agency/issues");
        setIssues(Array.isArray(res.data?.data) ? res.data.data : res.data ?? []);
      } catch {
        setIssues([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return issues;
    if (filter === "RESOLVED") return issues.filter((i) => i.status === "RESOLVED");
    return issues.filter((i) => i.status !== "RESOLVED");
  }, [issues, filter]);

  if (loading) return <AgencyLoading />;

  const openCount = issues.filter((i) => i.status !== "RESOLVED").length;

  return (
    <div>
      <AgencyPageHeader
        title={t("issuesAndEscalations")}
        subtitle={t("issuesSubtitle")}
        badge={openCount > 0 ? <StatusPill label={t("openCount", { count: openCount })} tone="red" /> : undefined}
      />

      <div className="mb-4 flex gap-1 rounded-xl border border-gray-100 bg-white p-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors",
              filter === f.key ? "bg-brand text-white" : "text-ink-muted hover:bg-gray-50",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <AgencyEmpty title={t("noIssuesHere")} hint={t("noIssuesHint")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          {filtered.map((issue) => {
            const st = issueStatusMap(tShared)[issue.status] ?? issueStatusMap(tShared).REPORTED;
            return (
              <AgencyCard
                key={issue.id}
                className="cursor-pointer p-4 transition-shadow hover:shadow-md"
                onClick={() => router.push(`/agency/issues/${issue.id}`)}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEECEC] px-2.5 py-1 text-[12px] font-bold text-[#DC2626]">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {issueTypeLabelMap(tShared)[issue.issueType] ?? issue.issueType}
                  </span>
                  <StatusPill label={st.label} tone={st.tone} />
                </div>
                <p className="line-clamp-2 text-[13px] text-ink-muted">{issue.description}</p>
                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={issue.placement.worker.profilePicture} name={name(issue.placement.worker, tShared)} size={32} />
                    <div>
                      <p className="text-[12px] font-semibold text-ink">{name(issue.placement.worker, tShared)}</p>
                      <p className="text-[11px] text-ink-muted">
                        {t("reportedBy", { name: name(issue.reportedBy, tShared), date: new Date(issue.createdAt).toLocaleDateString("en-RW", { day: "numeric", month: "short" }) })}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                </div>
              </AgencyCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
