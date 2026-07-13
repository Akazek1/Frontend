"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Building2,
  Loader2,
  Plus,
  Pencil,
  Power,
  PowerOff,
  ShieldAlert,
  LogOut,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/error-handler";
import { colors } from "@/constant/colors";
import authService from "@/services/auth-service";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

interface CompanyService {
  id: string;
  title: string;
  description: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceType: string | null;
  serviceAreas: string[];
  isActive: boolean;
  approvalStatus: ApprovalStatus;
  category?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
}

const STATUS_STYLES = (t: (key: string) => string): Record<ApprovalStatus, { label: string; cls: string }> => ({
  PENDING: { label: t("statusPending"), cls: "bg-[#FFF8EC] text-[#B45309]" },
  APPROVED: { label: t("statusApproved"), cls: "bg-[#ECFDF3] text-[#067647]" },
  REJECTED: { label: t("statusRejected"), cls: "bg-[#FEF3F2] text-[#B42318]" },
});

const emptyForm = {
  title: "",
  categoryId: "",
  description: "",
  priceMin: "",
  priceMax: "",
  priceType: "negotiable",
  serviceAreas: "",
};

export default function CompanyServicesPage() {
  const t = useTranslations("companyServices");
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const org = user as unknown as
    | { orgType?: string; verified?: boolean; name?: string }
    | undefined;
  const isCompany = org?.orgType === "SERVICE_COMPANY";
  const isVerified = Boolean(org?.verified);

  const [services, setServices] = useState<CompanyService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // Guard: only verified-or-not service companies belong here.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/business/login");
      return;
    }
    if (user && !isCompany) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, user, isCompany, router]);

  const load = useCallback(async () => {
    try {
      const [svcRes, catRes] = await Promise.all([
        api.get("/services/company/mine"),
        api.get("/services/categories"),
      ]);
      setServices(svcRes.data?.data ?? svcRes.data ?? []);
      setCategories(catRes.data?.data ?? catRes.data ?? []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotLoadServices")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isCompany) load();
  }, [isCompany, load]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
  }

  function openEdit(s: CompanyService) {
    setEditingId(s.id);
    setForm({
      title: s.title,
      categoryId: s.category?.id ?? "",
      description: s.description ?? "",
      priceMin: s.priceMin?.toString() ?? "",
      priceMax: s.priceMax?.toString() ?? "",
      priceType: s.priceType ?? "negotiable",
      serviceAreas: s.serviceAreas.join(", "),
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error(t("enterServiceTitle"));
    if (!editingId && !form.categoryId) return toast.error(t("chooseCategory"));
    const min = form.priceMin ? Number(form.priceMin) : undefined;
    const max = form.priceMax ? Number(form.priceMax) : undefined;
    if (min !== undefined && max !== undefined && min > max) {
      return toast.error(t("minExceedsMax"));
    }

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priceMin: min,
      priceMax: max,
      priceType: form.priceType,
      serviceAreas: form.serviceAreas
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    };
    if (!editingId) payload.categoryId = form.categoryId;

    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/services/${editingId}`, payload);
        toast.success(t("serviceUpdated"));
      } else {
        await api.post("/services", payload);
        toast.success(t("serviceSubmitted"));
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotSaveService")));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: CompanyService) {
    try {
      if (s.isActive) {
        await api.delete(`/services/${s.id}`);
      } else {
        await api.patch(`/services/${s.id}`, { isActive: true });
      }
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotUpdateService")));
    }
  }

  async function logout() {
    await authService.logout();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0";
    document.cookie = "profileComplete=; path=/; max-age=0";
    window.location.href = "/business/login";
  }

  if (isLoading || !user || !isCompany) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F4F7F3]">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F4F7F3]">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.backgroundTertiary }}
            >
              <Building2 className="h-5 w-5" style={{ color: colors.primary }} />
            </div>
            <div>
              <p className="text-[15px] font-black text-ink">{org?.name || t("yourCompanyFallback")}</p>
              <p className="text-[12px] text-ink-muted">{t("serviceListings")}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-semibold text-ink hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" /> {t("signOut")}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-4 py-6">
        {!isVerified && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#FEDF89] bg-[#FFFAEB] p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309]" />
            <div>
              <p className="text-[14px] font-bold text-[#B45309]">
                {t("awaitingVerification")}
              </p>
              <p className="mt-0.5 text-[13px] text-[#92400E]">
                {t("awaitingVerificationDesc")}
              </p>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-[20px] font-black text-ink">{t("yourServices")}</h1>
          <button
            onClick={openCreate}
            disabled={!isVerified}
            className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-[14px] font-bold text-white hover:bg-brand-dark disabled:opacity-50"
            title={isVerified ? "" : t("availableOnceVerified")}
          >
            <Plus className="h-4 w-4" /> {t("newService")}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="text-[15px] font-bold text-ink">{t("noServicesYet")}</p>
            <p className="mt-1 text-[13px] text-ink-muted">
              {isVerified
                ? t("addFirstServiceVerified")
                : t("addFirstServiceUnverified")}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {services.map((s) => {
              const status = STATUS_STYLES(t)[s.approvalStatus];
              return (
                <li
                  key={s.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[15px] font-bold text-ink">{s.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${status.cls}`}>
                          {status.label}
                        </span>
                        {!s.isActive && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                            {t("inactive")}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-ink-muted">
                        {s.category?.name}
                        {s.serviceAreas.length > 0 && ` · ${s.serviceAreas.join(", ")}`}
                      </p>
                      {(s.priceMin || s.priceMax) && (
                        <p className="mt-1 text-[13px] font-semibold text-ink">
                          {s.priceMin ? `RWF ${s.priceMin.toLocaleString()}` : ""}
                          {s.priceMin && s.priceMax ? " – " : ""}
                          {s.priceMax && !s.priceMin ? `RWF ${s.priceMax.toLocaleString()}` : s.priceMax ? s.priceMax.toLocaleString() : ""}
                          {s.priceType ? ` · ${s.priceType}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => openEdit(s)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-ink hover:bg-gray-50"
                        aria-label={t("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(s)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-ink hover:bg-gray-50"
                        aria-label={s.isActive ? t("deactivate") : t("reactivate")}
                      >
                        {s.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {s.approvalStatus === "REJECTED" && (
                    <p className="mt-2 rounded-lg bg-[#FEF3F2] px-3 py-2 text-[12px] text-[#B42318]">
                      {t("rejectedNotice")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-[480px] rounded-t-3xl bg-white p-5 sm:rounded-3xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[18px] font-black text-ink">
                {editingId ? t("editService") : t("newService")}
              </h2>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("title")}</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={t("titlePlaceholder")}
                  className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("category")}</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[14px] outline-none focus:border-brand"
                  >
                    <option value="">{t("selectCategoryPlaceholder")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("description")}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder={t("descriptionPlaceholder")}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-brand"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("priceMin")}</label>
                  <input
                    type="number"
                    value={form.priceMin}
                    onChange={(e) => setForm({ ...form, priceMin: e.target.value })}
                    className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("priceMax")}</label>
                  <input
                    type="number"
                    value={form.priceMax}
                    onChange={(e) => setForm({ ...form, priceMax: e.target.value })}
                    className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("priceType")}</label>
                  <select
                    value={form.priceType}
                    onChange={(e) => setForm({ ...form, priceType: e.target.value })}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[14px] outline-none focus:border-brand"
                  >
                    <option value="negotiable">{t("priceTypeNegotiable")}</option>
                    <option value="hourly">{t("priceTypeHourly")}</option>
                    <option value="daily">{t("priceTypeDaily")}</option>
                    <option value="fixed">{t("priceTypeFixed")}</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("serviceAreas")}</label>
                  <input
                    value={form.serviceAreas}
                    onChange={(e) => setForm({ ...form, serviceAreas: e.target.value })}
                    placeholder="Gasabo, Kicukiro"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : editingId ? (
                  t("saveChanges")
                ) : (
                  t("submitForApproval")
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
