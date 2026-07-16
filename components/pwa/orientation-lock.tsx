"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

// Portrait-only UI, no landscape design yet. The manifest's orientation:
// "portrait" only locks rotation for installed (standalone) PWAs on Android —
// it does nothing in a browser tab and iOS Safari ignores it outright. This
// CSS-only overlay (landscape: is a Tailwind orientation media-query variant)
// covers every context without needing JS to detect anything.
//
// Gated on pointer-coarse (touch) as well as landscape via the
// .orientation-lock-overlay rule in globals.css — Tailwind has no built-in
// pointer-coarse variant, and `landscape:` alone matches any viewport wider
// than tall, which is true of almost every desktop browser window.
export function OrientationLock() {
  const t = useTranslations("orientationLock");

  return (
    <div className="orientation-lock-overlay fixed inset-0 z-[100] flex-col items-center justify-center bg-[#F4F7F3] px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
        <RotateCcw className="h-8 w-8 text-[#145B10]" />
      </div>
      <h1 className="text-xl font-bold text-[#111827]">{t("title")}</h1>
      <p className="mt-2 max-w-[320px] text-sm leading-6 text-[#4B5563]">{t("description")}</p>
    </div>
  );
}
