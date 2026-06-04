"use client";

import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { PageHeader, PageShell, appStickyHeaderClass } from "@/components/ui/app-primitives";

/**
 * Stub help page reached by tapping the "Tip" card on /more/services.
 * Real content arrives in a follow-up PR; this is the landing target so
 * the affordance has somewhere to go today.
 */
export default function ServicesTipsHelpPage() {
  const router = useRouter();
  return (
    <PageShell padded={false} bottomNav={false}>
      <PageHeader
        title="Tips for great services"
        compact
        onBack={() => router.back()}
        className={appStickyHeaderClass}
      />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
          <Lightbulb className="h-7 w-7 text-brand" />
        </div>
        <h2 className="text-[16px] font-black text-ink">Coming soon</h2>
        <p className="max-w-[280px] text-[13px] text-ink-muted">
          A guide with photo, copy, and pricing tips for getting more hire requests
          is on the way.
        </p>
      </div>
    </PageShell>
  );
}
