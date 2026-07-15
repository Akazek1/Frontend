"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Briefcase, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { colors } from "@/constant/colors";
import { HuzaLogo } from "@/components/brand/huza-logo";

type OrgType = "SERVICE_COMPANY" | "STAFFING_AGENCY";

export default function BusinessRegisterPage() {
  const t = useTranslations("businessRegister");
  const [type, setType] = useState<OrgType | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) return toast.error(t("chooseBusinessType"));
    if (!name.trim()) return toast.error(t("enterBusinessName"));
    if (!email.trim()) return toast.error(t("enterEmailAddress"));
    if (password.length < 8) return toast.error(t("passwordTooShort"));
    if (password !== confirm) return toast.error(t("passwordsDoNotMatch"));

    setLoading(true);
    try {
      const res = await api.post("/auth/org/register", {
        name: name.trim(),
        type,
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      const data = res.data?.data || res.data;
      if (!data?.token) throw new Error(t("noTokenReturned"));
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      toast.success(t("accountCreatedPendingVerification"));
      // Hard navigation so auth state re-hydrates from the stored token.
      // Service companies manage service cards; agencies use the agency console.
      window.location.href =
        type === "SERVICE_COMPANY" ? "/business/services" : "/agency";
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotCreateAccount")));
      setLoading(false);
    }
  }

  const typeCard = (orgType: OrgType, title: string, sub: string, Icon: typeof Building2) => (
    <button
      type="button"
      onClick={() => setType(orgType)}
      className={`relative flex min-w-0 flex-1 items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
        type === orgType ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-ink hover:border-brand"
      }`}
    >
      {type === orgType && <CheckCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-white" />}
      <div className={`rounded-lg p-2 ${type === orgType ? "bg-white/20" : "bg-surface"}`}>
        <Icon className={`h-5 w-5 ${type === orgType ? "text-white" : "text-brand"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-bold">{title}</p>
        <p className={`text-[11px] ${type === orgType ? "text-white/80" : "text-ink-muted"}`}>{sub}</p>
      </div>
    </button>
  );

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F4F7F3] px-4 py-10">
      <div className="w-full max-w-[460px]">
        <div className="mb-6 flex items-center justify-center">
          <HuzaLogo markClassName="h-8 w-8" wordClassName="text-[22px]" />
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.backgroundTertiary }}>
              <Building2 className="h-7 w-7" style={{ color: colors.primary }} />
            </div>
            <h1 className="text-[22px] font-black text-ink">{t("registerYourBusiness")}</h1>
            <p className="mt-1 text-[13px] text-ink-muted">{t("adminVerifiesAccount")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              {typeCard("SERVICE_COMPANY", t("serviceCompany"), t("serviceCompanyDesc"), Building2)}
              {typeCard("STAFFING_AGENCY", t("staffingAgency"), t("staffingAgencyDesc"), Briefcase)}
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("businessName")}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CleanPro Kigali Ltd"
                className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("emailYourLogin")}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" autoComplete="email"
                  className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand" />
              </div>
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("phoneOptional")}</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0788…"
                  className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("password")}</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("atLeast8Characters")} autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-gray-200 px-3.5 pr-11 text-[14px] outline-none focus:border-brand" />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink">
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("confirmPassword")}</label>
              <input type={showPw ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("reEnterPassword")} autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand" />
            </div>

            <button type="submit" disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("createAccount")}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-ink-muted">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/business/login" className="font-semibold text-brand hover:underline">{t("signIn")}</Link>
        </p>
      </div>
    </div>
  );
}
