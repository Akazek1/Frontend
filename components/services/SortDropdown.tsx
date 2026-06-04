"use client";

import { ChevronDown } from "lucide-react";
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

/**
 * View-counter and request-counter sorts depend on backend metrics that
 * aren't tracked yet (see SERVICES_REDESIGN_PROMPT phase "Out of scope").
 * We expose them as disabled options with a tooltip so the affordance
 * exists in the UI but doesn't surprise the user.
 */
const OPTIONS: Array<{
  key: ServicesSortKey;
  label: string;
  disabled?: boolean;
  hint?: string;
}> = [
  { key: "recent", label: "Recent" },
  { key: "most_viewed", label: "Most viewed", disabled: true, hint: "Coming soon" },
  {
    key: "most_requested",
    label: "Most requested",
    disabled: true,
    hint: "Coming soon",
  },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ServicesSortKey)}>
      <SelectTrigger
        className="h-9 w-auto gap-1 border-[#DCEEDD] bg-white text-[13px] text-brand"
        aria-label="Sort services"
      >
        <SelectValue placeholder="Sort" />
        <ChevronDown className="h-4 w-4 text-brand" />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((opt) => (
          <SelectItem
            key={opt.key}
            value={opt.key}
            disabled={opt.disabled}
            title={opt.hint}
          >
            {opt.label}
            {opt.hint && (
              <span className="ml-2 text-[10px] text-[#667085]">
                ({opt.hint})
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
