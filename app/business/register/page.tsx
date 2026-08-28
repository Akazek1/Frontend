"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Briefcase, Loader2, CheckCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { isValidRwandaPhone, normalizeRwandaPhone } from "@/lib/phone";
import { BusinessAuthShell } from "@/components/business/business-auth-shell";
import { PasswordField } from "@/components/business/password-field";
import { OtpCodeInput, OTP_LENGTH } from "@/components/ui/otp-code-input";

type OrgType = "SERVICE_COMPANY" | "STAFFING_AGENCY";

// Matches the backend's OTP resend cooldown (AuthService.OTP_RESEND_COOLDOWN_SECONDS).
const RESEND_COOLDOWN_SECONDS = 60;

export default function BusinessRegisterPage() {
  const t = useTranslations("businessRegister");
  const locale = useLocale();
  const [type, setType] = useState<OrgType | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  // Sign-up is two phases on one page: fill in the details, then prove the
  // phone number with the code we text to it. The account is only created at
  // the end, so an abandoned sign-up leaves nothing behind.
  const [phase, setPhase] = useState<"details" | "verify">("details");
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  async function sendCode() {
    const res = await api.post("/auth/org/request-otp", {
      email: email.trim(),
      phone: normalizeRwandaPhone(phone),
      locale,
    });
    setResendIn(RESEND_COOLDOWN_SECONDS);
    return res;
  }

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) return toast.error(t("chooseBusinessType"));
    if (!name.trim()) return toast.error(t("enterBusinessName"));
    if (!email.trim()) return toast.error(t("enterEmailAddress"));
    // Required: this number receives the sign-up code and every later
    // password-reset code, and is how we reach the owner if the email is wrong.
    if (!isValidRwandaPhone(phone)) return toast.error(t("enterValidPhone"));
    if (password.length < 8) return toast.error(t("passwordTooShort"));
    if (password !== confirm) return toast.error(t("passwordsDoNotMatch"));

    setLoading(true);
    try {
      await sendCode();
      setCode(Array(OTP_LENGTH).fill(""));
      setPhase("verify");
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotSendCode")));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendIn > 0 || loading) return;
    setLoading(true);
    try {
      await sendCode();
      toast.success(t("codeResent"));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotSendCode")));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(otp: string) {
    setLoading(true);
    try {
      const res = await api.post("/auth/org/register", {
        name: name.trim(),
        type,
        email: email.trim(),
        password,
        phone: normalizeRwandaPhone(phone),
        otp,
      });
      const data = res.data?.data || res.data;
      if (!data?.token) throw new Error(t("noTokenReturned"));
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      toast.success(t("accountCreatedPendingVerification"));
      // Hard navigation so auth state re-hydrates from the stored token.
      // A service company is signed in as its own provider account and uses
      // the ordinary app; an agency goes to the agency console.
      window.location.href = type === "SERVICE_COMPANY" ? "/" : "/agency";
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotCreateAccount")));
      setCode(Array(OTP_LENGTH).fill(""));
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
    <BusinessAuthShell
      icon={Building2}
      title={phase === "details" ? t("registerYourBusiness") : t("verifyYourNumber")}
      subtitle={phase === "details" ? t("adminVerifiesAccount") : undefined}
      maxWidthClass="max-w-[460px]"
      footer={
        <>
          {t("alreadyHaveAccount")}{" "}
          <Link href="/business/login" className="font-semibold text-brand hover:underline">{t("signIn")}</Link>
        </>
      }
    >
      {phase === "details" ? (
        <form onSubmit={handleDetailsSubmit} className="space-y-4">
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
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("phone")}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0788…"
                type="tel" inputMode="tel" autoComplete="tel"
                className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand" />
            </div>
          </div>

          <p className="-mt-1 text-[11.5px] leading-relaxed text-ink-muted">{t("phoneHelp")}</p>

          <PasswordField label={t("password")} value={password} onChange={setPassword} placeholder={t("atLeast8Characters")} />
          <PasswordField label={t("confirmPassword")} value={confirm} onChange={setConfirm} placeholder={t("reEnterPassword")} />

          <button type="submit" disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("continue")}
          </button>
        </form>
      ) : (
        <div className="space-y-5">
          <p className="text-center text-[13px] text-ink-muted">
            {t.rich("codeSentTo", {
              phone: normalizeRwandaPhone(phone),
              b: (chunks) => <span className="font-semibold text-ink">{chunks}</span>,
            })}
          </p>

          <OtpCodeInput
            value={code}
            onChange={setCode}
            onComplete={handleVerify}
            autoFocus
            ariaLabel={t("verificationCode")}
          />

          <div className="text-center">
            {resendIn > 0 ? (
              <p className="text-[13px] text-ink-muted">{t("resendCodeIn", { seconds: resendIn })}</p>
            ) : (
              <button type="button" onClick={handleResend} disabled={loading}
                className="text-[13px] font-semibold text-brand underline underline-offset-2 disabled:opacity-60">
                {t("resendCode")}
              </button>
            )}
          </div>

          <button type="button" onClick={() => handleVerify(code.join(""))}
            disabled={loading || code.join("").length < OTP_LENGTH}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("createAccount")}
          </button>

          <button type="button" onClick={() => setPhase("details")} disabled={loading}
            className="h-11 w-full rounded-xl border-2 border-gray-200 text-[13px] font-bold text-ink hover:bg-gray-50 disabled:opacity-60">
            {t("backToDetails")}
          </button>
        </div>
      )}
    </BusinessAuthShell>
  );
}
