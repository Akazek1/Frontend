"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { isValidRwandaPhone, normalizeRwandaPhone } from "@/lib/phone";
import { BusinessAuthShell } from "@/components/business/business-auth-shell";
import { PasswordField } from "@/components/business/password-field";
import { OtpCodeInput, OTP_LENGTH } from "@/components/ui/otp-code-input";

// Matches the backend's OTP resend cooldown (AuthService.OTP_RESEND_COOLDOWN_SECONDS).
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Self-service password reset for a business account.
 *
 * The organization's registered phone is the proof of ownership — the same
 * SMS code mechanism individual users log in with. The email address can't be
 * used for this: it is never verified, so a code sent there would prove nothing.
 */
export default function BusinessForgotPasswordPage() {
  const t = useTranslations("businessForgotPassword");
  const locale = useLocale();
  const router = useRouter();

  const [phase, setPhase] = useState<"phone" | "reset">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  async function sendCode() {
    await api.post("/auth/org/forgot-password", { phone: normalizeRwandaPhone(phone), locale });
    setResendIn(RESEND_COOLDOWN_SECONDS);
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidRwandaPhone(phone)) return toast.error(t("enterValidPhone"));

    setLoading(true);
    try {
      await sendCode();
      // The response is the same whether or not the number is registered, so
      // this page can't be used to discover which businesses have accounts.
      toast.success(t("codeSentIfRegistered"));
      setCode(Array(OTP_LENGTH).fill(""));
      setPhase("reset");
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

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    const otp = code.join("");
    if (otp.length < OTP_LENGTH) return toast.error(t("enterTheCode"));
    if (password.length < 8) return toast.error(t("passwordTooShort"));
    if (password !== confirm) return toast.error(t("passwordsDoNotMatch"));

    setLoading(true);
    try {
      await api.post("/auth/org/reset-password", {
        phone: normalizeRwandaPhone(phone),
        otp,
        password,
        confirmPassword: confirm,
      });
      toast.success(t("passwordUpdated"));
      router.push("/business/login");
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotResetPassword")));
      setLoading(false);
    }
  }

  return (
    <BusinessAuthShell
      icon={KeyRound}
      title={t("passwordReset")}
      subtitle={phase === "phone" ? t("description") : undefined}
      footer={
        <Link href="/business/login" className="font-semibold text-brand hover:underline">
          {t("backToSignIn")}
        </Link>
      }
    >
      {phase === "phone" ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("registeredPhone")}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0788…"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("sendCode")}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-5">
          <p className="text-center text-[13px] text-ink-muted">
            {t.rich("codeSentTo", {
              phone: normalizeRwandaPhone(phone),
              b: (chunks) => <span className="font-semibold text-ink">{chunks}</span>,
            })}
          </p>

          <OtpCodeInput
            value={code}
            onChange={setCode}
            autoFocus
            ariaLabel={t("verificationCode")}
          />

          <div className="text-center">
            {resendIn > 0 ? (
              <p className="text-[13px] text-ink-muted">{t("resendCodeIn", { seconds: resendIn })}</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-[13px] font-semibold text-brand underline underline-offset-2 disabled:opacity-60"
              >
                {t("resendCode")}
              </button>
            )}
          </div>

          <PasswordField label={t("newPassword")} value={password} onChange={setPassword} placeholder={t("atLeast8Characters")} />
          <PasswordField label={t("confirmNewPassword")} value={confirm} onChange={setConfirm} placeholder={t("reEnterPassword")} />

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("setNewPassword")}
          </button>

          <button
            type="button"
            onClick={() => setPhase("phone")}
            disabled={loading}
            className="h-11 w-full rounded-xl border-2 border-gray-200 text-[13px] font-bold text-ink hover:bg-gray-50 disabled:opacity-60"
          >
            {t("useAnotherNumber")}
          </button>
        </form>
      )}
    </BusinessAuthShell>
  );
}
