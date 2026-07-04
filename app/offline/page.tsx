"use client";

import { useEffect } from "react";
import { AkazekLogo } from "@/components/brand/akazek-logo";

export default function OfflinePage() {
  useEffect(() => {
    const reload = () => window.location.reload();
    window.addEventListener("online", reload);
    return () => window.removeEventListener("online", reload);
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F4F7F3] px-6 pb-24 pt-10">
      <div className="w-full max-w-[360px] text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
          <AkazekLogo variant="mark" markClassName="h-10 w-10" />
        </div>
        <h1 className="text-xl font-bold text-[#111827]">You're offline</h1>
        <p className="mt-2 text-sm leading-6 text-[#4B5563]">
          We'll reload automatically once you're back online. Pages you've
          opened before still work — use the navigation below.
        </p>
        <button
          type="button"
          className="mt-5 rounded-[10px] bg-[#145B10] px-7 py-3 text-sm font-bold text-white active:bg-[#0f4a0c]"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
