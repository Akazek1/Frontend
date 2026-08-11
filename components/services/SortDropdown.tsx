"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ServicesSortKey = "recent" | "most_viewed" | "most_requested";

interface SortDropdownProps {
  value: ServicesSortKey;
  onChange: (next: ServicesSortKey) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const t = useTranslations("servicesListPage");

  /**
   * View-counter and request-counter sorts depend on backend metrics that
   * aren't tracked yet (see SERVICES_REDESIGN_PROMPT phase "Out of scope").
   * We expose them as disabled options with a tooltip so the affordance
   * exists in the UI but doesn't surprise the user.
   */
  const options: Array<{
    key: ServicesSortKey;
    label: string;
    disabled?: boolean;
    hint?: string;
  }> = [
    { key: "recent", label: t("sortRecent") },
    { key: "most_viewed", label: t("sortMostViewed"), disabled: true, hint: t("sortComingSoon") },
    {
      key: "most_requested",
      label: t("sortMostRequested"),
      disabled: true,
      hint: t("sortComingSoon"),
    },
  ];

  return (
    <Select value={value} onValueChange={(v) => onChange(v as ServicesSortKey)}>
      <SelectTrigger
        className="h-9 w-auto gap-1 border-[#DCEEDD] bg-white text-[13px] text-brand"
        aria-label={t("sortAria")}
      >
        <SelectValue placeholder={t("sortPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem
            key={opt.key}
            value={opt.key}
            disabled={opt.disabled}
            title={opt.hint}
          >
            {opt.label}
            {opt.hint && (
              <span className="ml-2 text-[10px] text-ink-subtle">
                ({opt.hint})
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
