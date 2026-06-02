"use client";

import { Check } from "lucide-react";

interface WizardStepIndicatorProps {
  step: 1 | 2;
}

const STEPS: Array<{ index: 1 | 2; label: string }> = [
  { index: 1, label: "Basics" },
  { index: 2, label: "Details & Preview" },
];

export function WizardStepIndicator({ step }: WizardStepIndicatorProps) {
  return (
    <nav
      aria-label="Wizard progress"
      className="flex items-center gap-2 px-2 pb-4"
    >
      {STEPS.map((s, i) => {
        const isDone = s.index < step;
        const isCurrent = s.index === step;
        return (
          <div key={s.index} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-black ${
                isDone || isCurrent
                  ? "bg-[#145B10] text-white"
                  : "border border-[#DCEEDD] bg-white text-[#667085]"
              }`}
              aria-current={isCurrent ? "step" : undefined}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : s.index}
            </div>
            <div className="flex flex-1 flex-col">
              <span
                className={`text-[12px] font-black ${
                  isCurrent || isDone ? "text-[#145B10]" : "text-[#667085]"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="mt-1 h-px w-full bg-[#DCEEDD]" />
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
