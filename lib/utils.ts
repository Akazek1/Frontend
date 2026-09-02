import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Per-locale unit suffix for a price. Currency ("RWF") is left as-is; only the
// charged-per unit is localised. `rw` = Kinyarwanda (draft — pending native review).
const PRICE_SUFFIX: Record<string, Record<string, string>> = {
  en: { daily: "/day", monthly: "/month", hourly: "/hr" },
  rw: { daily: "/umunsi", monthly: "/ukwezi", hourly: "/isaha" },
}

export function formatPrice(priceMin?: number, priceMax?: number, priceType?: string, locale?: string): string {
  const lang = locale && PRICE_SUFFIX[locale] ? locale : "en"
  if (!priceMin && !priceMax) return lang === "rw" ? "Igiciro kizamenyekana" : "Price on request"
  const type = priceType ?? "fixed"
  const suffix = PRICE_SUFFIX[lang][type] ?? ""
  const min = priceMin?.toLocaleString() ?? "0"
  const max = priceMax?.toLocaleString()
  if (max && priceMax !== priceMin) return `${min} – ${max} RWF${suffix}`
  return `${min} RWF${suffix}`
}
