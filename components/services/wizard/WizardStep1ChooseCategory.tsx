"use client";

import { useMemo, useState } from "react";
import { ChevronRight, LayoutGrid, Loader2, Search } from "lucide-react";
import { IconBadge } from "@/components/services/wizard/wizard-ui";

export interface WizardGrouping {
  id: string;
  name: string;
  nameKn?: string | null;
  icon?: string | null;
  jobTypes: WizardJobType[];
}

export interface WizardJobType {
  id: string;
  name: string;
  nameKn?: string | null;
  icon?: string | null;
}

/** "House help, housekeeping, laundry and more" style summary line. */
function summarize(g: WizardGrouping): string {
  const names = g.jobTypes.map((jt) => jt.name);
  if (names.length === 0) return g.nameKn ?? "";
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} and more`;
}

interface WizardStep1ChooseCategoryProps {
  groupings: WizardGrouping[];
  loading: boolean;
  onSelect: (id: string) => void;
  onViewAll: () => void;
}

export function WizardStep1ChooseCategory({
  groupings,
  loading,
  onSelect,
  onViewAll,
}: WizardStep1ChooseCategoryProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groupings;
    return groupings.filter((g) =>
      `${g.name} ${g.nameKn ?? ""} ${g.jobTypes.map((jt) => jt.name).join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  }, [groupings, search]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories"
          className="h-12 w-full rounded-2xl border border-[#DCE8D9] bg-white pl-12 pr-4 text-[14px] text-ink outline-none placeholder:text-ink-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <h2 className="text-[15px] font-black text-ink">All Categories</h2>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelect(g.id)}
              className="flex items-center gap-3 rounded-2xl border border-[#DCE8D9] bg-white p-4 text-left shadow-[0_8px_24px_rgba(27,36,49,0.05)] transition-colors hover:bg-[#FBFEFA] active:bg-[#E8F7E5]/50"
            >
              <IconBadge icon={g.icon} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-ink">
                  {g.name}
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-ink-muted">
                  {summarize(g)}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted" />
            </button>
          ))}

          {filtered.length === 0 && (
            <p className="py-8 text-center text-[13px] text-ink-muted">
              No categories match your search.
            </p>
          )}
        </div>
      )}

      {/* "Can't find the right category?" footer */}
      {!loading && (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-1 flex items-center gap-3 rounded-2xl bg-[#E8F7E5] p-4 text-left transition-colors hover:bg-[#DDF2D8]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand">
            <LayoutGrid className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold text-ink">
              Can&apos;t find the right category?
            </span>
            <span className="mt-0.5 block text-[12px] text-ink-muted">
              Browse all services to see everything available.
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[13px] font-bold text-brand">
            View All Services
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
      )}
    </div>
  );
}
