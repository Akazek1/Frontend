"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Loader2, Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { colors } from "@/constant/colors";
import { useAuth } from "@/hooks/useAuth";

type EnrollmentStatus = "INVITED" | "ACTIVE" | "DECLINED" | "OPTED_OUT" | "REVOKED";

interface WorkerEnrollment {
  id: string;
  status: EnrollmentStatus;
  invitedAt: string;
  agency: { id: string; name: string; logoUrl: string | null; verified: boolean };
  service: { id: string; title: string | null };
}

const STATUS_KEY: Record<EnrollmentStatus, string> = {
  INVITED: "statusInvited",
  ACTIVE: "statusActive",
  DECLINED: "statusDeclined",
  OPTED_OUT: "statusOptedOut",
  REVOKED: "statusRevoked",
};

const STATUS_STYLE: Record<EnrollmentStatus, string> = {
  ACTIVE: "bg-[#E8F7E5] text-[#145B10]",
  INVITED: "bg-[#FFF4E0] text-[#B45309]",
  DECLINED: "bg-gray-100 text-gray-600",
  OPTED_OUT: "bg-gray-100 text-gray-600",
  REVOKED: "bg-[#FEECEC] text-[#DC2626]",
};

export default function WorkerEnrollmentsPage() {
  const t = useTranslations("workerEnrollments");
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<WorkerEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/enrollments/mine");
      setItems(Array.isArray(res.data?.data) ? res.data.data : res.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function act(id: string, action: "accept" | "decline" | "opt-out", successKey: string) {
    setBusyId(id);
    try {
      await api.post(`/enrollments/${id}/${action}`);
      toast.success(t(successKey));
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t("actionError"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[428px] bg-surface">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <button onClick={() => router.back()} aria-label={t("back")}>
          <ArrowLeft className="h-5 w-5 text-ink" />
        </button>
        <p className="text-[16px] font-bold text-ink">{t("title")}</p>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-24 text-center">
          <Building2 className="h-8 w-8 text-gray-300" />
          <p className="text-[14px] font-semibold text-ink">{t("emptyTitle")}</p>
          <p className="text-[12px] text-ink-muted">{t("emptyHint")}</p>
        </div>
      ) : (
        <div className="space-y-3 p-4">
          {items.map((e) => {
            const busy = busyId === e.id;
            return (
              <div key={e.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <Building2 className="h-5 w-5 text-ink-muted" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-ink">{e.agency.name}</p>
                    <p className="truncate text-[12px] text-ink-muted">{e.service.title ?? "—"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[e.status]}`}>
                    {t(STATUS_KEY[e.status])}
                  </span>
                </div>

                {e.status === "INVITED" && (
                  <>
                    <p className="mt-3 text-[13px] text-ink-muted">{t("inviteExplainer", { agency: e.agency.name, service: e.service.title ?? "" })}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => act(e.id, "accept", "acceptSuccess")}
                        disabled={busy}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {t("accept")}
                      </button>
                      <button
                        onClick={() => act(e.id, "decline", "declineSuccess")}
                        disabled={busy}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-[13px] font-bold text-ink-muted disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        {t("decline")}
                      </button>
                    </div>
                  </>
                )}

                {e.status === "ACTIVE" && (
                  <div className="mt-3">
                    <button
                      onClick={() => act(e.id, "opt-out", "leaveSuccess")}
                      disabled={busy}
                      className="w-full rounded-xl border border-gray-200 py-2.5 text-[13px] font-semibold text-ink-muted disabled:opacity-50"
                    >
                      {busy ? t("leaving") : t("leave")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
