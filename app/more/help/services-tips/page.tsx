"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Lightbulb } from "lucide-react";

/**
 * Stub help page reached by tapping the "Tip" card on /more/services.
 * Real content arrives in a follow-up PR; this is the landing target so
 * the affordance has somewhere to go today.
 */
export default function ServicesTipsHelpPage() {
  const router = useRouter();
  return (
    <div className="app-bg mx-auto flex min-h-dvh w-full max-w-[428px] flex-col">
      <header className="app-bg sticky top-0 z-10 flex items-center gap-2 px-4 pb-3 pt-6 shadow-sm">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="-ml-1 rounded-full p-1.5 hover:bg-[#F1FCEF]"
        >
          <ArrowLeft className="h-5 w-5 text-[#1B2431]" />
        </button>
        <h1 className="text-[18px] font-black text-[#1B2431]">Tips for great services</h1>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F1FCEF]">
          <Lightbulb className="h-7 w-7 text-[#145B10]" />
        </div>
        <h2 className="text-[16px] font-black text-[#1B2431]">Coming soon</h2>
        <p className="max-w-[280px] text-[13px] text-[#475467]">
          A guide with photo, copy, and pricing tips for getting more hire requests
          is on the way.
        </p>
      </main>
    </div>
  );
}
