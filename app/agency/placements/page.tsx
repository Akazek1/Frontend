"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins } from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/lib/axios";
import { AgencyCard, AgencyEmpty, AgencyLoading, AgencyPageHeader, Avatar, StatusPill } from "@/components/agency/agency-ui";
import { cn } from "@/lib/utils";

interface Placement {
  id: string;
  status: "ACTIVE" | "TERMINATED" | "OPTED_OUT";
  placedAt: string;
  commissionAmount: number | null;
  commissionPaid: boolean;
  worker: { id: string; firstName: string | null; lastName: string | null; profilePicture: string | null; trustScore: number };
  employer: { id: string; firstName: string | null; lastName: string | null; phoneNumber: string | null };
}

function name(p: { firstName: string | null; lastName: string | null }, t: (key: string) => string) {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || t("unknownFallback");
}

const STATUS = (t: (key: string) => string): Record<Placement["status"], { label: string; tone: "green" | "red" | "amber" }> => ({
  ACTIVE: { label: t("statusActive"), tone: "green" },
  TERMINATED: { label: t("statusTerminated"), tone: "red" },
  OPTED_OUT: { label: t("statusOptedOut"), tone: "amber" },
});

const FILTERS = (t: (key: string) => string) => [
  { key: "ALL", label: t("filterAll") },
  { key: "ACTIVE", label: t("statusActive") },
  { key: "TERMINATED", label: t("statusTerminated") },
  { key: "OPTED_OUT", label: t("statusOptedOut") },
] as const;

type FilterKey = "ALL" | Placement["status"];

export default function AgencyPlacementsPage() {
  const t = useTranslations("agencyPlacements");
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("ALL");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/agency/placements");
        setPlacements(Array.isArray(res.data?.data) ? res.data.data : res.data ?? []);
      } catch {
        setPlacements([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(
    () => (filter === "ALL" ? placements : placements.filter((p) => p.status === filter)),
    [placements, filter],
  );

  if (loading) return <AgencyLoading />;

  return (
    <div>
      <AgencyPageHeader title={t("placements")} subtitle={t("placementsSubtitle")} />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-white p-1 scrollbar-hide">
        {FILTERS(t).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors",
              filter === f.key ? "bg-brand text-white" : "text-ink-muted hover:bg-gray-50",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <AgencyEmpty title={t("noPlacements")} hint={t("noPlacementsHint")} />
      ) : (
        <>
          {/* Desktop table */}
          <AgencyCard className="hidden overflow-hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3.5">{t("worker")}</th>
                  <th className="px-5 py-3.5">{t("employer")}</th>
                  <th className="px-5 py-3.5">{t("status")}</th>
                  <th className="px-5 py-3.5">{t("placed")}</th>
                  <th className="px-5 py-3.5">{t("commission")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={p.worker.profilePicture} name={name(p.worker, t)} size={38} />
                        <p className="text-[14px] font-bold text-ink">{name(p.worker, t)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink">{name(p.employer, t)}</td>
                    <td className="px-5 py-4"><StatusPill label={STATUS(t)[p.status].label} tone={STATUS(t)[p.status].tone} /></td>
                    <td className="px-5 py-4 text-[13px] text-ink-muted">
                      {new Date(p.placedAt).toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">
                          {p.commissionAmount ? `${new Intl.NumberFormat("en-RW").format(p.commissionAmount)} RWF` : "—"}
                        </span>
                        {p.commissionAmount ? (
                          <StatusPill label={p.commissionPaid ? t("paid") : t("unpaid")} tone={p.commissionPaid ? "green" : "amber"} />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AgencyCard>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 lg:hidden">
            {filtered.map((p) => (
              <AgencyCard key={p.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={p.worker.profilePicture} name={name(p.worker, t)} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-ink">{name(p.worker, t)}</p>
                    <p className="truncate text-[12px] text-ink-muted">{t("withName", { name: name(p.employer, t) })}</p>
                  </div>
                  <StatusPill label={STATUS(t)[p.status].label} tone={STATUS(t)[p.status].tone} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3 text-[12px]">
                  <span className="text-ink-muted">
                    {new Date(p.placedAt).toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {p.commissionAmount ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                      <Coins className="h-3.5 w-3.5 text-brand" />
                      {new Intl.NumberFormat("en-RW").format(p.commissionAmount)} RWF
                      <StatusPill label={p.commissionPaid ? t("paid") : t("unpaid")} tone={p.commissionPaid ? "green" : "amber"} />
                    </span>
                  ) : null}
                </div>
              </AgencyCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
