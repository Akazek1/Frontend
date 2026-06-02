"use client";

import { Calendar, Clock } from "lucide-react";
import type { ChargedPer } from "@/services/services-service";

interface ChargedPerRadioProps {
  value: ChargedPer;
  onChange: (next: ChargedPer) => void;
  /** Optional id used to associate the group with a visible label. */
  groupLabel?: string;
}

const OPTIONS: Array<{
  value: ChargedPer;
  label: string;
  helper: string;
  Icon: typeof Calendar;
}> = [
  { value: "one_time", label: "One-time", helper: "A single payment", Icon: Calendar },
  { value: "daily", label: "Per day", helper: "Charged every day", Icon: Clock },
  { value: "weekly", label: "Per week", helper: "Charged every week", Icon: Calendar },
  { value: "monthly", label: "Per month", helper: "Charged every month", Icon: Calendar },
];

export function ChargedPerRadio({
  value,
  onChange,
  groupLabel = "Charged per",
}: ChargedPerRadioProps) {
  return (
    <div
      role="radiogroup"
      aria-label={groupLabel}
      className="overflow-hidden rounded-2xl border border-[#DCEEDD] bg-white"
    >
      {OPTIONS.map((opt, idx) => {
        const checked = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(opt.value)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
              idx > 0 ? "border-t border-[#F1FCEF]" : ""
            } ${checked ? "bg-[#F1FCEF]" : "bg-white hover:bg-[#F1FCEF]/60"}`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                checked ? "border-[#145B10]" : "border-[#DCEEDD]"
              }`}
              aria-hidden="true"
            >
              {checked && (
                <span className="h-2.5 w-2.5 rounded-full bg-[#145B10]" />
              )}
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1FCEF]">
              <opt.Icon className="h-4 w-4 text-[#145B10]" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[14px] font-black text-[#1B2431]">
                {opt.label}
              </span>
              <span className="text-[12px] text-[#475467]">{opt.helper}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
