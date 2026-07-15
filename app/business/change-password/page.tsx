"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { colors } from "@/constant/colors";

export default function BusinessChangePasswordPage() {
  const t = useTranslations("businessChangePassword");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return toast.error(t("enterCurrentPassword"));
    if (next.length < 8) return toast.error(t("passwordTooShort"));
    if (next !== confirm) return toast.error(t("passwordsDoNotMatch"));

    setLoading(true);
    try {
      await api.post(
        "/auth/org/change-password",
        { currentPassword: current, newPassword: next },
        { withCredentials: true },
      );
      toast.success(t("passwordUpdated"));
      window.location.href = "/agency";
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotUpdatePassword")));
      setLoading(false);
    }
  }

  const pwField = (label: string, value: string, set: (v: string) => void, ac: string) => (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</label>
      <div className="relative">
        <input
          type={showPw ? "text" : "password"}
          value={value}
          onChange={(e) => set(e.target.value)}
          autoComplete={ac}
          className="h-12 w-full rounded-xl border border-gray-200 px-3.5 pr-11 text-[14px] outline-none focus:border-brand"
        />
        <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink">
          {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F4F7F3] px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="text-[22px] font-black tracking-tight text-brand">Huza</span>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.backgroundTertiary }}>
              <KeyRound className="h-7 w-7" style={{ color: colors.primary }} />
            </div>
            <h1 className="text-[22px] font-black text-ink">{t("setNewPassword")}</h1>
            <p className="mt-1 text-[13px] text-ink-muted">{t("chooseNewPasswordDesc")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {pwField(t("currentPasswordLabel"), current, setCurrent, "current-password")}
            {pwField(t("newPasswordLabel"), next, setNext, "new-password")}
            {pwField(t("confirmNewPasswordLabel"), confirm, setConfirm, "new-password")}

            <button type="submit" disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("updatePassword")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
