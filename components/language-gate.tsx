"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { LOCALE_COOKIE } from "@/i18n/config";
import { persistLanguage } from "@/lib/set-language";

// Only the two supported languages. Labels are shown in each language's own
// name so the prompt is understandable before a choice is made.
const OPTIONS = [
  { code: "en", label: "English", native: "English" },
  { code: "rw", label: "Kinyarwanda", native: "Ikinyarwanda" },
];

function hasLocaleCookie(): boolean {
  if (typeof document === "undefined") return true; // never show during SSR
  return document.cookie
    .split("; ")
    .some((c) => c.startsWith(`${LOCALE_COOKIE}=`));
}

/**
 * First-run language chooser. Shows only on a NEW device — i.e. when no `locale`
 * cookie exists yet. A returning device already has the cookie, so this never
 * appears and the previous choice is applied silently. Mounted app-wide in the
 * root layout.
 */
export default function LanguageGate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Runs client-side after hydration; if there's no saved locale, prompt once.
    if (!hasLocaleCookie()) setOpen(true);
  }, []);

  if (!open) return null;

  const choose = (code: string) => {
    persistLanguage(code); // sets cookie (+ syncs to account if signed in)
    setOpen(false);
    router.refresh(); // re-render server components in the chosen language
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose your language"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
            <Globe className="h-6 w-6 text-brand" />
          </span>
          {/* Bilingual, since no language is chosen yet. */}
          <h2 className="text-[17px] font-bold text-ink">Choose your language</h2>
          <p className="text-[13px] text-ink-subtle">Hitamo ururimi ukoresha</p>
        </div>
        <div className="space-y-2">
          {OPTIONS.map((o) => (
            <button
              key={o.code}
              type="button"
              onClick={() => choose(o.code)}
              className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3 text-left transition-colors hover:bg-surface hover:ring-1 hover:ring-brand/20"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[12px] font-bold text-ink uppercase">
                {o.code}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-ink">{o.native}</span>
                <span className="block text-[11px] text-ink-subtle">{o.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
