"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShieldCheck, ChevronRight } from "lucide-react";
import api from "@/lib/axios";
import { AgencyInquiry, inquiryPersonName } from "@/constant/agency-inquiries";

/**
 * Pending placement offers surfaced on the Work page. A worker shouldn't have to
 * find these through a notification — placements are work, so they belong here.
 */
export function PlacementOffersBanner() {
  const t = useTranslations("workPlacementOffers");
  const tShared = useTranslations("inquiryShared");
  const router = useRouter();
  const [offers, setOffers] = useState<AgencyInquiry[]>([]);

  useEffect(() => {
    api
      .get("/inquiries/handovers")
      .then((res) => setOffers(Array.isArray(res.data?.data) ? res.data.data : res.data ?? []))
      .catch(() => setOffers([]));
  }, []);

  if (offers.length === 0) return null;

  return (
    <div className="space-y-2">
      {offers.map((o) => (
        <button
          key={o.id}
          onClick={() => router.push(`/inquiries/${o.id}`)}
          className="flex w-full items-center gap-3 rounded-2xl border border-[#C8E6C4] bg-[#EEF8EA] p-3 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10">
            <ShieldCheck className="h-5 w-5 text-brand" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-ink">{t("title")}</span>
            <span className="block truncate text-[12px] text-ink-muted">
              {t("from", {
                agency: o.agency?.name ?? t("agencyFallback"),
                employer: inquiryPersonName(o.employer, tShared),
              })}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-brand" />
        </button>
      ))}
    </div>
  );
}
