"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ApiLanguage {
  code: string;
  name: string;
  nativeName: string | null;
  hint: string | null;
  isDefault: boolean;
  sortOrder: number;
}

const STORAGE_KEY = "appLanguage";

// Shown until the admin-managed list loads (and as a fallback if the request
// fails). English is the built-in default language.
const FALLBACK: ApiLanguage[] = [
  { code: "EN", name: "English", nativeName: "English", hint: "Default app language", isDefault: true, sortOrder: 0 },
];

async function fetchActiveLanguages(): Promise<ApiLanguage[]> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
  // Public endpoint — returns only the languages an admin has activated.
  const res = await fetch(`${baseURL}/languages`);
  if (!res.ok) throw new Error("Failed to load languages");
  const json = await res.json();
  const list: ApiLanguage[] = json?.data ?? json;
  return Array.isArray(list) && list.length ? list : FALLBACK;
}

interface LanguageSwitcherProps {
  /** Extra classes for the trigger chip (e.g. positioning on auth screens). */
  className?: string;
}

/**
 * Globe language chip used on the home header and the login/registration
 * screens. The list is driven by the admin "Languages" page — users can only
 * pick a language an admin has switched on, so we never offer an untranslated
 * one. Selection is remembered in localStorage.
 */
export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { data } = useQuery({
    queryKey: ["active-languages"],
    queryFn: fetchActiveLanguages,
    staleTime: 5 * 60 * 1000,
    placeholderData: FALLBACK,
  });

  const languages = data && data.length ? data : FALLBACK;
  const [selected, setSelected] = useState<string>("EN");

  // Restore the saved choice once on mount.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) setSelected(saved);
  }, []);

  // If the saved/selected language is no longer active, fall back to the default.
  useEffect(() => {
    if (!languages.some((l) => l.code === selected)) {
      const fallback = languages.find((l) => l.isDefault)?.code ?? languages[0]?.code ?? "EN";
      setSelected(fallback);
    }
  }, [languages, selected]);

  const choose = (code: string) => {
    setSelected(code);
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Change language"
          className={`flex items-center gap-1 bg-white/70 border border-gray-200 rounded-full px-2.5 py-1.5 shadow-sm ${className}`}
        >
          <Globe className="w-3.5 h-3.5 text-brand" />
          <span className="text-[12px] font-semibold text-ink">{selected}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-24px)] max-w-[300px] rounded-2xl border-gray-100 bg-white p-3 shadow-xl">
        <div className="space-y-3">
          <div>
            <p className="text-[14px] font-bold text-ink">Choose language</p>
            <p className="text-[11px] text-ink-subtle">Preview only. Translation is not connected yet.</p>
          </div>
          <div className="space-y-1">
            {languages.map((language) => {
              const active = selected === language.code;
              return (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => choose(language.code)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    active ? "bg-surface ring-1 ring-brand/20" : "hover:bg-gray-50"
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${
                    active ? "bg-brand text-white" : "bg-gray-100 text-ink"
                  }`}>
                    {language.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-ink">{language.name}</span>
                    {(language.hint || language.nativeName) && (
                      <span className="block text-[11px] text-ink-subtle">{language.hint || language.nativeName}</span>
                    )}
                  </span>
                  {active && <Check className="h-4 w-4 text-brand" />}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
