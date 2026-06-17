"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins } from "lucide-react";
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

function name(p: { firstName: string | null; lastName: string | null }) {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unknown";
}

const STATUS: Record<Placement["status"], { label: string; tone: "green" | "red" | "amber" }> = {
  ACTIVE: { label: "Active", tone: "green" },
  TERMINATED: { label: "Terminated", tone: "red" },
  OPTED_OUT: { label: "Opted Out", tone: "amber" },
};

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "TERMINATED", label: "Terminated" },
  { key: "OPTED_OUT", label: "Opted Out" },
] as const;

export default function AgencyPlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("ALL");

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
      <AgencyPageHeader title="Placements" subtitle="All workers currently or previously placed with employers." />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-white p-1 scrollbar-hide">
        {FILTERS.map((f) => (
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
        <AgencyEmpty title="No placements" hint="Approved hiring requests become placements." />
      ) : (
        <>
          {/* Desktop table */}
          <AgencyCard className="hidden overflow-hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3.5">Worker</th>
                  <th className="px-5 py-3.5">Employer</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Placed</th>
                  <th className="px-5 py-3.5">Commission</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={p.worker.profilePicture} name={name(p.worker)} size={38} />
                        <p className="text-[14px] font-bold text-ink">{name(p.worker)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink">{name(p.employer)}</td>
                    <td className="px-5 py-4"><StatusPill label={STATUS[p.status].label} tone={STATUS[p.status].tone} /></td>
                    <td className="px-5 py-4 text-[13px] text-ink-muted">
                      {new Date(p.placedAt).toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">
                          {p.commissionAmount ? `${new Intl.NumberFormat("en-RW").format(p.commissionAmount)} RWF` : "—"}
                        </span>
                        {p.commissionAmount ? (
                          <StatusPill label={p.commissionPaid ? "Paid" : "Unpaid"} tone={p.commissionPaid ? "green" : "amber"} />
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
                  <Avatar src={p.worker.profilePicture} name={name(p.worker)} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-ink">{name(p.worker)}</p>
                    <p className="truncate text-[12px] text-ink-muted">with {name(p.employer)}</p>
                  </div>
                  <StatusPill label={STATUS[p.status].label} tone={STATUS[p.status].tone} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3 text-[12px]">
                  <span className="text-ink-muted">
                    {new Date(p.placedAt).toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {p.commissionAmount ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                      <Coins className="h-3.5 w-3.5 text-brand" />
                      {new Intl.NumberFormat("en-RW").format(p.commissionAmount)} RWF
                      <StatusPill label={p.commissionPaid ? "Paid" : "Unpaid"} tone={p.commissionPaid ? "green" : "amber"} />
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
