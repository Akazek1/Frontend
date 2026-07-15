"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Loader2, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { colors } from "@/constant/colors";
import { HuzaLogo } from "@/components/brand/huza-logo";

export default function BusinessLoginPage() {
  const t = useTranslations("businessLogin");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error(t("enterEmailAndPassword"));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email: email.trim(), password });
      const data = res.data?.data || res.data;
      if (!data?.token) throw new Error(t("noTokenReturned"));
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      // After an admin reset, force a password change before entering the app.
      if (data.mustChangePassword) {
        toast(t("setNewPasswordToContinue"));
        window.location.href = "/business/change-password";
        return;
      }
      toast.success(t("welcomeBack"));
      // Hard navigation so the auth state re-hydrates from the stored token.
      // Service companies land on their service console; agencies on /agency.
      window.location.href =
        data.user?.orgType === "SERVICE_COMPANY"
          ? "/business/services"
          : "/agency";
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("invalidEmailOrPassword")));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F4F7F3] px-4 py-10">
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-6 flex items-center justify-center">
          <HuzaLogo markClassName="h-8 w-8" wordClassName="text-[22px]" />
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div
              className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: colors.backgroundTertiary }}
            >
              <Building2 className="h-7 w-7" style={{ color: colors.primary }} />
            </div>
            <h1 className="text-[22px] font-black text-ink">{t("agencyPortal")}</h1>
            <p className="mt-1 text-[13px] text-ink-muted">{t("signInToAgencyAccount")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("emailAddress")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                autoComplete="email"
                className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("password")}</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-gray-200 px-3.5 pr-11 text-[14px] outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
                  aria-label={showPw ? t("hidePassword") : t("showPassword")}
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-1.5 text-right">
                <Link href="/business/forgot-password" className="text-[12px] font-semibold text-brand hover:underline">
                  {t("forgotPassword")}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("signIn")}
            </button>
          </form>

          {/* Test creds hint (TEMP) */}
          <p className="mt-3 rounded-lg bg-[#FFF8EC] px-3 py-2 text-center text-[11px] text-[#B45309]">
            {t("testLoginLabel")} <span className="font-bold">agency@akazek.test</span> / <span className="font-bold">agency123</span>
          </p>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-gray-100" />
            <span className="text-[12px] text-ink-muted">{t("or")}</span>
            <span className="h-px flex-1 bg-gray-100" />
          </div>

          <Link
            href="/onboarding"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-[14px] font-semibold text-ink hover:bg-gray-50"
          >
            <Phone className="h-4 w-4" /> {t("backToPhoneLogin")}
          </Link>
        </div>

        <p className="mt-5 text-center text-[13px] text-ink-muted">
          {t("needAgencyAccount")}{" "}
          <Link href="/business/register" className="font-semibold text-brand hover:underline">
            {t("register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
