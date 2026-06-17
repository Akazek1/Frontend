"use client";

import { Construction } from "lucide-react";
import { AgencyCard, AgencyPageHeader } from "@/components/agency/agency-ui";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <AgencyPageHeader title={title} subtitle={description} />
      <AgencyCard className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F7E5]">
          <Construction className="h-7 w-7 text-brand" />
        </div>
        <p className="text-[16px] font-bold text-ink">Coming soon</p>
        <p className="max-w-sm text-[13px] text-ink-muted">
          This section is part of the agency console roadmap and will be available shortly.
        </p>
      </AgencyCard>
    </div>
  );
}
