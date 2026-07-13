"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { colors } from "@/constant/colors";

export default function BusinessForgotPasswordPage() {
  const t = useTranslations("businessForgotPassword");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F4F7F3] px-4 py-10">
      <div className="w-full max-w-[420px] rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.backgroundTertiary }}
        >
          <KeyRound className="h-7 w-7" style={{ color: colors.primary }} />
        </div>
        <h1 className="text-[20px] font-black text-ink">{t("passwordReset")}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          {t("description")}
        </p>
        <Link
          href="/business/login"
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand text-[14px] font-bold text-white hover:bg-brand-dark"
        >
          {t("backToSignIn")}
        </Link>
      </div>
    </div>
  );
}
