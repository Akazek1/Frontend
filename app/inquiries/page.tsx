"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Inbox, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { colors } from "@/constant/colors";
import { useAuth } from "@/hooks/useAuth";
import { AgencyInquiry, INQUIRY_STATUS, inquiryPersonName } from "@/constant/agency-inquiries";

export default function InquiriesListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<AgencyInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const isWorker = Boolean(user?.isProvider);

  useEffect(() => {
    async function load() {
      try {
        // Workers see hand-over offers; everyone else sees the inquiries they sent.
        const url = isWorker ? "/inquiries/handovers" : "/inquiries/mine";
        const res = await api.get(url);
        setItems(Array.isArray(res.data?.data) ? res.data.data : res.data ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user, isWorker]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[428px] bg-surface">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <button onClick={() => router.back()} aria-label="Back"><ArrowLeft className="h-5 w-5 text-ink" /></button>
        <p className="text-[16px] font-bold text-ink">{isWorker ? "Placement Offers" : "My Inquiries"}</p>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-24 text-center">
          <Inbox className="h-8 w-8 text-gray-300" />
          <p className="text-[14px] font-semibold text-ink">{isWorker ? "No placement offers" : "No inquiries yet"}</p>
          <p className="text-[12px] text-ink-muted">
            {isWorker ? "When your agency proposes you to an employer, it shows up here." : "Contact an agency from a worker's profile to get started."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-4">
          {items.map((inq) => {
            const st = INQUIRY_STATUS[inq.status];
            const other = isWorker ? inquiryPersonName(inq.employer) : inq.agency?.name ?? "Agency";
            return (
              <button
                key={inq.id}
                onClick={() => router.push(`/inquiries/${inq.id}`)}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-ink">{other}</p>
                  <p className="truncate text-[12px] text-ink-muted">{inq.note}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  st.tone === "green" ? "bg-[#E8F7E5] text-brand"
                  : st.tone === "amber" ? "bg-[#FFF4E0] text-[#B45309]"
                  : st.tone === "blue" ? "bg-[#E6F0FB] text-[#1D4ED8]"
                  : "bg-gray-100 text-gray-600"}`}>
                  {st.label}
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
