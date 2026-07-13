"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/lib/axios";
import { AgencyCard, AgencyEmpty, AgencyLoading, AgencyPageHeader, Avatar, StatusPill } from "@/components/agency/agency-ui";
import { AgencyInquiry, inquiryStatusMap, inquiryPersonName } from "@/constant/agency-inquiries";

function timeAgo(iso: string, t: ReturnType<typeof useTranslations>) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return t("justNow");
  if (mins < 60) return t("minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("hoursAgo", { count: hrs });
  return t("daysAgo", { count: Math.floor(hrs / 24) });
}

export default function AgencyInquiriesPage() {
  const t = useTranslations("agencyRequests");
  const tShared = useTranslations("inquiryShared");
  const router = useRouter();
  const [inquiries, setInquiries] = useState<AgencyInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/inquiries/agency");
        setInquiries(Array.isArray(res.data?.data) ? res.data.data : res.data ?? []);
      } catch {
        setInquiries([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <AgencyLoading />;

  const pending = inquiries.filter((i) => i.status === "PENDING").length;

  return (
    <div>
      <AgencyPageHeader
        title={t("inquiries")}
        subtitle={t("inquiriesSubtitle")}
        badge={pending > 0 ? <StatusPill label={t("newCount", { count: pending })} tone="amber" /> : undefined}
      />

      {inquiries.length === 0 ? (
        <AgencyEmpty title={t("noInquiriesYet")} hint={t("noInquiriesHint")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          {inquiries.map((inq) => {
            const st = inquiryStatusMap(tShared)[inq.status];
            return (
              <AgencyCard
                key={inq.id}
                className="cursor-pointer p-4 transition-shadow hover:shadow-md lg:p-5"
                onClick={() => router.push(`/agency/requests/${inq.id}`)}
              >
                <div className="mb-3 flex items-center justify-between">
                  <StatusPill label={st.label} tone={st.tone} />
                  <span className="text-[12px] text-ink-muted">{timeAgo(inq.updatedAt, t)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar src={inq.employer.profilePicture} name={inquiryPersonName(inq.employer, tShared)} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-ink">{inquiryPersonName(inq.employer, tShared)}</p>
                    {inq.workerOfInterest && (
                      <p className="truncate text-[12px] text-ink-muted">
                        {t("interestedIn", { name: inquiryPersonName(inq.workerOfInterest, tShared) })}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-gray-300" />
                </div>
                <p className="mt-3 line-clamp-2 flex items-start gap-1.5 border-t border-gray-50 pt-3 text-[12px] text-ink-muted">
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {inq.note}
                </p>
              </AgencyCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
