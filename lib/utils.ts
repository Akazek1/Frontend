import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(priceMin?: number, priceMax?: number, priceType?: string): string {
  if (!priceMin && !priceMax) return "Price on request"
  const type = priceType ?? "fixed"
  const suffix = type === "daily" ? "/day" : type === "monthly" ? "/month" : type === "hourly" ? "/hr" : ""
  const min = priceMin?.toLocaleString() ?? "0"
  const max = priceMax?.toLocaleString()
  if (max && priceMax !== priceMin) return `${min} – ${max} RWF${suffix}`
  return `${min} RWF${suffix}`
}
