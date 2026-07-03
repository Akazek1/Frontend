"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ChevronRight, HelpCircle, Pencil, Search } from "lucide-react";
import { AppButton } from "@/components/ui/app-primitives";
import { IconBadge } from "@/components/services/wizard/wizard-ui";
import { localizedName } from "@/lib/taxonomy-i18n";
import type {
  WizardGrouping,
  WizardJobType,
} from "@/components/services/wizard/WizardStep1ChooseCategory";

interface WizardStep2ChooseServiceProps {
  grouping: WizardGrouping;
  /** Short description shown inside the selected-category banner. */
  groupingSummary: string;
  selectedServiceId: string;
  onSelect: (id: string) => void;
  onChangeCategory: () => void;
  onViewAll: () => void;
  isAllMode: boolean;
  onContinue: () => void;
  isValid: boolean;
}

export function WizardStep2ChooseService({
  grouping,
  groupingSummary,
  selectedServiceId,
  onSelect,
  onChangeCategory,
  onViewAll,
  isAllMode,
  onContinue,
  isValid,
}: WizardStep2ChooseServiceProps) {
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const visible: WizardJobType[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grouping.jobTypes;
    return grouping.jobTypes.filter((jt) =>
      `${jt.name} ${jt.nameKn ?? ""}`.toLowerCase().includes(q),
    );
  }, [grouping.jobTypes, search]);

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Selected category banner */}
      <div className="flex items-center gap-3 rounded-2xl bg-[#E8F7E5] p-4">
        <IconBadge icon={grouping.icon} />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-ink">
            {localizedName(grouping, locale)}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-ink-muted">
            {groupingSummary}
          </span>
        </span>
        <button
          type="button"
          onClick={onChangeCategory}
          className="flex shrink-0 items-center gap-1.5 text-[13px] font-bold text-brand"
        >
          Change
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {/* Search within the category */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search services in ${grouping.name}`}
          className="h-12 w-full rounded-2xl border border-[#DCE8D9] bg-white pl-12 pr-4 text-[14px] text-ink outline-none placeholder:text-ink-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-black text-ink">All Services</h2>
        <span className="flex items-center gap-1 text-[13px] font-semibold text-brand">
          Need help?
          <HelpCircle className="h-4 w-4" />
        </span>
      </div>

      {/* Service rows */}
      <div className="flex flex-col gap-3">
        {visible.map((jt) => {
          const isSelected = selectedServiceId === jt.id;
          return (
            <button
              key={jt.id}
              type="button"
              onClick={() => onSelect(jt.id)}
              className={`flex items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-[0_8px_24px_rgba(27,36,49,0.05)] transition-colors ${
                isSelected
                  ? "border-brand ring-1 ring-brand"
                  : "border-[#DCE8D9] hover:bg-[#FBFEFA]"
              }`}
            >
              <IconBadge icon={jt.icon} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-ink">
                  {localizedName(jt, locale)}
                </span>
                {jt.nameKn && (
                  <span className="mt-0.5 block text-[12.5px] text-ink-muted">
                    {jt.nameKn}
                  </span>
                )}
              </span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  isSelected ? "border-brand" : "border-[#C9D8C5]"
                }`}
              >
                {isSelected && <span className="h-3 w-3 rounded-full bg-brand" />}
              </span>
            </button>
          );
        })}

        {visible.length === 0 && (
          <p className="py-8 text-center text-[13px] text-ink-muted">
            No services match your search.
          </p>
        )}
      </div>

      {/* "Can't find your service?" footer */}
      {!isAllMode && (
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-3 rounded-2xl bg-[#E8F7E5] p-4 text-left transition-colors hover:bg-[#DDF2D8]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold text-ink">
              Can&apos;t find your service?
            </span>
            <span className="mt-0.5 block text-[12px] text-ink-muted">
              Browse all services across all categories.
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[13px] font-bold text-brand">
            View All Services
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
      )}

      {/* Sticky Continue */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[428px] border-t border-[#DCE8D9] bg-surface px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <AppButton
          type="button"
          className="w-full"
          disabled={!isValid}
          onClick={onContinue}
        >
          Continue
        </AppButton>
      </div>
    </div>
  );
}
