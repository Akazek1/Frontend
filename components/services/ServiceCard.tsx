"use client";

import Image from "next/image";
import { MapPin, ShieldCheck, Bookmark, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServiceCardImage, serviceImageFallback } from "@/lib/service-display";
import { fromBackendPriceFields } from "@/services/services-service";
import type { Service } from "@/types";

export type ServiceCardViewer = "owner" | "marketplace";

interface ServiceCardProps {
  service: Service;
  viewer: ServiceCardViewer;
  /** Owner-only: callbacks for the bottom action bar. */
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
  /** Marketplace-only: callbacks for the bookmark + hire actions. */
  onBookmarkToggle?: (service: Service) => void;
  onRequestHire?: (service: Service) => void;
  isBookmarked?: boolean;
  /** Optional pre-rendered preview wrapper (used by the wizard preview). */
  className?: string;
}

const PER_LABEL: Record<string, string> = {
  one_time: "one-time",
  daily: "day",
  weekly: "week",
  monthly: "month",
};

function formatRate(service: Service) {
  const { price, chargedPer } = fromBackendPriceFields(service);
  if (!price) return "Price on request";
  const formatted = price.toLocaleString("en-RW");
  const suffix = PER_LABEL[chargedPer] ?? "day";
  return chargedPer === "one_time"
    ? `${formatted} RWF`
    : `${formatted} RWF/${suffix}`;
}

function getPrimaryArea(service: Service) {
  const areas = Array.isArray(service.serviceAreas) ? service.serviceAreas : [];
  return areas[0] || "Kigali";
}

export function ServiceCard({
  service,
  viewer,
  onEdit,
  onDelete,
  onBookmarkToggle,
  onRequestHire,
  isBookmarked = false,
  className,
}: ServiceCardProps) {
  const heroImage = getServiceCardImage(service) || serviceImageFallback;
  const providerName = `${service.provider?.firstName ?? ""} ${
    service.provider?.lastName ?? ""
  }`.trim();
  const categoryName =
    typeof service.category === "string"
      ? service.category
      : service.category?.name ?? "";
  const isAvailable = service.isActive;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-[#DCEEDD] bg-white ${
        className ?? ""
      }`}
    >
      {/* Top: photo + summary */}
      <div className="flex gap-3 p-3">
        <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-[#F1FCEF]">
          <Image
            src={heroImage}
            alt={service.title}
            fill
            sizes="104px"
            className="object-cover"
          />
          {isAvailable && (
            <span className="absolute left-1.5 top-1.5 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#145B10] shadow-sm">
              Available
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="truncate text-[15px] font-black text-[#1B2431]">
                  {providerName || "Service provider"}
                </h3>
                {service.provider?.isVerified && (
                  <ShieldCheck
                    className="h-4 w-4 shrink-0 text-[#145B10]"
                    aria-label="Verified provider"
                  />
                )}
              </div>
              <p className="truncate text-[12px] text-[#475467]">
                {categoryName || service.title}
              </p>
            </div>

            {viewer === "marketplace" && (
              <button
                type="button"
                onClick={() => onBookmarkToggle?.(service)}
                aria-pressed={isBookmarked}
                aria-label={
                  isBookmarked ? "Remove bookmark" : "Bookmark this service"
                }
                className="rounded-full p-1.5 hover:bg-[#F1FCEF]"
              >
                <Bookmark
                  className="h-5 w-5 text-[#145B10]"
                  fill={isBookmarked ? "#145B10" : "none"}
                />
              </button>
            )}
          </div>

          <p className="mt-1 flex items-center gap-1 text-[12px] text-[#475467]">
            <MapPin className="h-3.5 w-3.5 text-[#667085]" aria-hidden="true" />
            <span className="truncate">{getPrimaryArea(service)}</span>
          </p>

          <p className="mt-1 text-[15px] font-black text-[#145B10]">
            {formatRate(service)}
          </p>

          {viewer === "owner" && (
            <span className="mt-1.5 inline-flex w-fit items-center rounded-md bg-[#F1FCEF] px-2 py-0.5 text-[11px] font-semibold text-[#145B10]">
              Your Service
            </span>
          )}
        </div>
      </div>

      {/* Bottom: action bar */}
      {viewer === "owner" ? (
        <div className="flex gap-2 border-t border-[#F1FCEF] p-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onEdit?.(service)}
            className="flex-1 border-[#145B10]/30 text-[#145B10] hover:bg-[#F1FCEF]"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onDelete?.(service)}
            className="flex-1 border-[#FF3D00]/30 text-[#FF3D00] hover:bg-[#FFF2EE]"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      ) : (
        <div className="border-t border-[#F1FCEF] p-3">
          <Button
            type="button"
            onClick={() => onRequestHire?.(service)}
            className="w-full bg-[#145B10] text-white hover:bg-[#0F4D0C]"
          >
            Request to Hire
          </Button>
        </div>
      )}
    </article>
  );
}
