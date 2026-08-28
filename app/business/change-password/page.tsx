"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { BusinessAuthShell } from "@/components/business/business-auth-shell";
import { PasswordField } from "@/components/business/password-field";

export default function BusinessChangePasswordPage() {
  const t = useTranslations("businessChangePassword");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
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

  return (
    <BusinessAuthShell icon={KeyRound} title={t("setNewPassword")} subtitle={t("chooseNewPasswordDesc")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField label={t("currentPasswordLabel")} value={current} onChange={setCurrent} autoComplete="current-password" />
        <PasswordField label={t("newPasswordLabel")} value={next} onChange={setNext} />
        <PasswordField label={t("confirmNewPasswordLabel")} value={confirm} onChange={setConfirm} />

        <button type="submit" disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("updatePassword")}
        </button>
      </form>
    </BusinessAuthShell>
  );
}
