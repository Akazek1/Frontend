"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronRight, LayoutGrid, Loader2, Search } from "lucide-react";
import { IconBadge } from "@/components/services/wizard/wizard-ui";
import { localizedName } from "@/lib/taxonomy-i18n";

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
function summarize(g: WizardGrouping, t: (key: string, values?: Record<string, string>) => string): string {
  const names = g.jobTypes.map((jt) => jt.name);
  if (names.length === 0) return g.nameKn ?? "";
  if (names.length <= 3) return names.join(", ");
  return t("namesAndMore", { names: names.slice(0, 3).join(", ") });
}

interface WizardStep1ChooseCategoryProps {
  groupings: WizardGrouping[];
  loading: boolean;
  /** Single-select navigation mode (wizard). Drills into the grouping. */
  onSelect?: (id: string) => void;
  onViewAll?: () => void;
  /**
   * Multi-select mode (onboarding "what services do you offer"). When provided,
   * cards toggle instead of navigate, show a checkbox, and the "view all"
   * footer is hidden. `onSelect`/`onViewAll` are ignored in this mode.
   */
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
}

export function WizardStep1ChooseCategory({
  groupings,
  loading,
  onSelect,
  onViewAll,
  selectedIds,
  onToggle,
}: WizardStep1ChooseCategoryProps) {
  const locale = useLocale();
  const t = useTranslations("serviceWizard");
  const [search, setSearch] = useState("");
  const multiSelect = !!onToggle;

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
          placeholder={t("searchCategories")}
          className="h-12 w-full rounded-2xl border border-[#DCE8D9] bg-white pl-12 pr-4 text-[14px] text-ink outline-none placeholder:text-ink-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <h2 className="text-[15px] font-black text-ink">{t("allCategories")}</h2>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((g) => {
            const isSelected = !!selectedIds?.has(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => (multiSelect ? onToggle!(g.id) : onSelect?.(g.id))}
                aria-pressed={multiSelect ? isSelected : undefined}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left shadow-[0_8px_24px_rgba(27,36,49,0.05)] transition-colors ${
                  isSelected
                    ? "border-brand bg-surface"
                    : "border-[#DCE8D9] bg-white hover:bg-[#FBFEFA] active:bg-[#E8F7E5]/50"
                }`}
              >
                <IconBadge icon={g.icon} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-ink">
                    {localizedName(g, locale)}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-ink-muted">
                    {summarize(g, t)}
                  </span>
                </span>
                {multiSelect ? (
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected
                        ? "border-brand bg-brand text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted" />
                )}
              </button>
            );
          })}

          {filtered.length === 0 && (
            <p className="py-8 text-center text-[13px] text-ink-muted">
              {t("noCategoriesMatch")}
            </p>
          )}
        </div>
      )}

      {/* "Can't find the right category?" footer — single-select wizard only. */}
      {!loading && !multiSelect && onViewAll && (
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
              {t("cantFindCategory")}
            </span>
            <span className="mt-0.5 block text-[12px] text-ink-muted">
              {t("browseAllServicesDesc")}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[13px] font-bold text-brand">
            {t("viewAllServices")}
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
      )}
    </div>
  );
}
