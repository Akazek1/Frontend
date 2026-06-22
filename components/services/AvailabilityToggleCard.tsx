"use client";

import { ShieldCheck, UserRound } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface AvailabilityToggleCardProps {
  available: boolean;
  isUpdating?: boolean;
  onChange: (next: boolean) => void;
}

export function AvailabilityToggleCard({
  available,
  isUpdating = false,
  onChange,
}: AvailabilityToggleCardProps) {
  return (
    <section
      className="rounded-2xl border border-[#DCEEDD] bg-surface p-4"
      aria-labelledby="availability-card-title"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand">
          <UserRound className="h-5 w-5 text-white" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <h2
            id="availability-card-title"
            className="text-[15px] font-black text-ink"
          >
            Available for work
          </h2>
          <p className="mt-0.5 text-[12px] text-ink-muted">
            When turned off, your service cards won&apos;t appear to employers.
          </p>
        </div>

        <Switch
          checked={available}
          disabled={isUpdating}
          onCheckedChange={onChange}
          aria-label="Toggle availability for work"
          className="data-[state=checked]:bg-brand"
        />
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2">
        <ShieldCheck className="h-4 w-4 text-brand" aria-hidden="true" />
        <p className="text-[12px] text-ink-muted">
          This applies to all your service cards
        </p>
      </div>
    </section>
  );
}
