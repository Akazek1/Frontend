/**
 * Pure helper functions used by the Work page feature.
 * Extracted from work-page.tsx so they can be unit-tested in isolation.
 */

import type { BookingRecord, Person } from "./types";

export const getBookingId = (booking: BookingRecord): string =>
  booking.bookingId || booking.id || "";

export const getPersonName = (person?: Person | null): string => {
  if (!person) return "Huza user";
  const fullName = `${person.firstName || ""} ${person.lastName || ""}`.trim();
  return fullName || person.username || "Huza user";
};

export const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "A";

export const getProfileHref = (person?: Person | null): string | undefined =>
  person?.username ? `/${person.username}` : undefined;

export const getTimeAgo = (iso?: string): string => {
  if (!iso) return "";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

export const formatDate = (iso?: string | null): string => {
  if (!iso) return "To agree";
  try {
    return new Date(iso).toLocaleDateString("en-RW", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return "To agree";
  }
};

export const getBudgetText = (value?: number | null): string =>
  value ? `${value.toLocaleString()} RWF/day` : "Budget to agree";

export const bookingTitle = (booking: BookingRecord): string =>
  booking.service?.category?.name || booking.job?.title || "Work request";

export const bookingCategory = (booking: BookingRecord): string =>
  booking.service?.category?.name || booking.job?.category?.name || "Work";
