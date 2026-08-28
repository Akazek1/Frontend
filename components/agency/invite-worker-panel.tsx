"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Search, X, Loader2, Check } from "lucide-react";
import api from "@/lib/axios";
import { Avatar } from "@/components/agency/agency-ui";
import { cn } from "@/lib/utils";

type EnrollmentStatus = "INVITED" | "ACTIVE" | "DECLINED" | "OPTED_OUT" | "REVOKED";

interface SearchService {
  id: string;
  title: string | null;
  serviceImage: string | null;
  liveEnrollment: { id: string; status: EnrollmentStatus; inThisAgency: boolean } | null;
}

interface SearchWorker {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  phoneNumber: string | null;
  profilePicture: string | null;
  isVerified: boolean;
  services: SearchService[];
}

function personName(p: { firstName: string | null; lastName: string | null }, fallback: string) {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || fallback;
}

// Agency-side "invite a worker's service" panel (service-level enrollment).
// Self-contained; used by the Workers page.
export function InviteWorkerPanel({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const t = useTranslations("agencyEnrollments");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchWorker[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get("/enrollments/worker-search", { params: { q } });
        setResults(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
      } catch {
        toast.error(t("actionError"));
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [q, t]);

  async function invite(workerId: string, serviceId: string) {
    setInvitingId(serviceId);
    try {
      await api.post("/enrollments", { workerId, serviceId });
      toast.success(t("inviteSuccess"));
      onInvited();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t("actionError"));
    } finally {
      setInvitingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="text-[16px] font-black text-ink">{t("inviteBtn")}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-ink-muted hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-ink-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-[14px] outline-none focus:border-brand"
            />
          </div>
          <p className="mt-1.5 text-[12px] text-ink-muted">{t("searchHint")}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {searching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
            </div>
          ) : q.trim().length >= 2 && results.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-ink-muted">{t("noResults")}</p>
          ) : (
            <div className="space-y-3">
              {results.map((w) => (
                <div key={w.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={w.profilePicture} name={personName(w, t("unnamedWorker"))} size={38} />
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-bold text-ink">{personName(w, t("unnamedWorker"))}</p>
                      <p className="truncate text-[12px] text-ink-muted">{w.username ? `@${w.username}` : w.phoneNumber}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{t("servicesLabel")}</p>
                    {w.services.length === 0 ? (
                      <p className="text-[12px] text-ink-muted">—</p>
                    ) : (
                      w.services.map((s) => {
                        const live = s.liveEnrollment;
                        const disabled = Boolean(live) || invitingId === s.id;
                        return (
                          <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                            <span className="truncate text-[13px] text-ink">{s.title ?? "—"}</span>
                            {live ? (
                              <span className="shrink-0 text-[11px] font-semibold text-ink-muted">
                                {live.inThisAgency ? t("alreadyInThisAgency") : t("inAnotherAgency")}
                              </span>
                            ) : (
                              <button
                                onClick={() => invite(w.id, s.id)}
                                disabled={disabled}
                                className={cn(
                                  "inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-bold text-white",
                                  disabled ? "opacity-50" : "hover:opacity-90",
                                )}
                              >
                                {invitingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                {t("inviteAction")}
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
