"use client"

import Link from "next/link"
import { Shield, TrendingUp, Building2, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useOnboarding } from "@/context/onboarding-context"
import LanguageSwitcher from "@/components/header/language-switcher"
import { HuzaLogo } from "@/components/brand/huza-logo"
import type { OnboardingRole } from "@/services/auth-service"

export function RoleSelection() {
  const t = useTranslations("onboarding")
  const { selectedRoles, setSelectedRoles, setCurrentStep } = useOnboarding()
  const router = useRouter()

  const isEmployer = selectedRoles.includes("EMPLOYER")
  const isWorker = selectedRoles.includes("WORKER")

  const selectAndContinue = (role: OnboardingRole) => {
    setSelectedRoles([role])
    setCurrentStep(1)
  }

  return (
    <div className="w-full h-full bg-[#F7FCF5] flex flex-col">

      {/* ── Top bar: logo + language picker ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 bg-[#F7FCF5]">
        <HuzaLogo markClassName="h-7 w-7" wordClassName="text-[22px] text-brand-strong" />
        <LanguageSwitcher />
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col justify-center px-4 py-4 space-y-3">

        {/* Section heading */}
        <div className="text-center pb-1">
          <h2 className="text-base font-bold text-gray-900">{t("roleHeading")}</h2>
        </div>

        {/* ── Employer card ── */}
        <button
          type="button"
          onClick={() => selectAndContinue("EMPLOYER")}
          className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 ${
            isEmployer
              ? "border-[#2E7D32] bg-[#F0FAF0] shadow-sm"
              : "border-[#C8E6C9] bg-[#FAFFF9] hover:border-[#81C784]"
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Illustration circle */}
            <div className="w-[62px] h-[62px] rounded-full bg-[#E8F5E3] flex items-center justify-center shrink-0 text-3xl">
              🛋️
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <h3 className="font-bold text-gray-900 text-[15px]">{t("employer.title")}</h3>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isEmployer ? "bg-[#2E7D32]" : "bg-[#E8F5E3]"
                }`}>
                  <ChevronRight className={`w-4 h-4 ${isEmployer ? "text-white" : "text-[#2E7D32]"}`} />
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-snug mb-2">
                {t("employer.desc")}
              </p>

              {/* Trust badge */}
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#2E7D32]" />
                <span className="text-[10px] text-[#2E7D32] font-semibold">{t("employer.badge")}</span>
              </div>
            </div>
          </div>
        </button>

        {/* ── Worker card ── */}
        <button
          type="button"
          onClick={() => selectAndContinue("WORKER")}
          className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 ${
            isWorker
              ? "border-[#F59E0B] bg-[#FFFBEB] shadow-sm"
              : "border-[#FDE68A] bg-[#FFFEF7] hover:border-[#FCD34D]"
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Illustration circle */}
            <div className="w-[62px] h-[62px] rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0 text-3xl">
              💼
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <h3 className="font-bold text-gray-900 text-[15px]">{t("worker.title")}</h3>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isWorker ? "bg-[#F59E0B]" : "bg-[#FEF3C7]"
                }`}>
                  <ChevronRight className={`w-4 h-4 ${isWorker ? "text-white" : "text-[#D97706]"}`} />
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-snug mb-2">
                {t("worker.desc")}
              </p>

              {/* Value prop */}
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-[#D97706]" />
                <span className="text-[10px] text-[#D97706] font-semibold">{t("worker.badge")}</span>
              </div>
            </div>
          </div>
        </button>

        {/* ── Business card ── same visual weight as the other two so agencies
             don't mistake themselves for "Employer" and sign up as individuals */}
        <button
          type="button"
          onClick={() => router.push("/business/register")}
          className="w-full text-left rounded-2xl border-2 border-[#BFDBFE] bg-[#F0F7FF] p-4 transition-all duration-200 hover:border-[#93C5FD]"
        >
          <div className="flex items-start gap-3">
            <div className="w-[62px] h-[62px] rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0 text-3xl">
              🏢
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <h3 className="font-bold text-gray-900 text-[15px]">{t("business.title")}</h3>
                <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
                  <ChevronRight className="w-4 h-4 text-[#2563EB]" />
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-snug mb-2">
                {t("business.desc")}
              </p>

              <div className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#2563EB]" />
                <span className="text-[10px] text-[#2563EB] font-semibold">{t("business.badge")}</span>
              </div>
            </div>
          </div>
        </button>

        {/* ── Login link ── */}
        <p className="text-center text-sm text-gray-500 pt-1">
          {t("haveAccount")}{" "}
          <Link href="/onboarding?step=login" className="text-brand-strong font-bold underline underline-offset-2">
            {t("logIn")}
          </Link>
        </p>

      </div>

    </div>
  )
}
