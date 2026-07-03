"use client"

import Link from "next/link"
import { Shield, TrendingUp, Building2, ChevronRight, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useOnboarding } from "@/context/onboarding-context"
import LanguageSwitcher from "@/components/header/language-switcher"
import { AkazekLogo } from "@/components/brand/akazek-logo"
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
    <div className="w-full h-full overflow-y-auto bg-[#F7FCF5]">

      {/* ── Hero header ── */}
      <div className="relative bg-gradient-to-br from-[#E6F4E0] via-[#EFF8EA] to-[#F7FCF5] overflow-hidden">
        {/* Language picker */}
        <div className="absolute top-3 right-4 z-10">
          <LanguageSwitcher />
        </div>

        <div className="flex items-end justify-between pt-10 pl-5">
          {/* Title + tagline */}
          <div className="pb-5 pr-2">
            <p className="text-lg font-semibold text-gray-800">{t("welcome")}</p>
            <AkazekLogo markClassName="h-9 w-9" wordClassName="text-[32px] text-brand-strong" />
            <p className="text-sm text-gray-500 mt-2 max-w-[170px] leading-snug">
              {t("tagline")}
            </p>
          </div>

          {/* Hero illustration — swap src for real asset when available */}
          <div className="relative aspect-[185/160] w-[38vw] min-w-[118px] max-w-[185px] shrink-0 overflow-hidden">
            <svg viewBox="0 0 185 160" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Window background */}
              <rect x="90" y="10" width="85" height="100" rx="8" fill="#D4EDDA" />
              <rect x="110" y="20" width="25" height="30" rx="3" fill="#A8D5B5" />
              <rect x="140" y="20" width="25" height="30" rx="3" fill="#A8D5B5" />
              {/* Curtains */}
              <path d="M90 10 Q105 40 95 100 L90 100Z" fill="#B8DFC5" />
              <path d="M175 10 Q160 40 170 100 L175 100Z" fill="#B8DFC5" />
              {/* Plant */}
              <rect x="30" y="100" width="10" height="30" rx="2" fill="#6D9E72" />
              <ellipse cx="35" cy="95" rx="18" ry="15" fill="#4CAF50" />
              <ellipse cx="22" cy="88" rx="12" ry="10" fill="#66BB6A" />
              <ellipse cx="48" cy="88" rx="12" ry="10" fill="#66BB6A" />
              {/* Worker 1 — green apron */}
              <ellipse cx="95" cy="65" rx="12" ry="13" fill="#5D4037" />
              <rect x="78" y="75" width="34" height="55" rx="6" fill="#2E7D32" />
              <rect x="83" y="78" width="24" height="40" rx="4" fill="#C8E6C9" />
              {/* Arm with glove */}
              <rect x="68" y="85" width="12" height="30" rx="5" fill="#2E7D32" />
              <ellipse cx="72" cy="118" rx="8" ry="6" fill="#FDD835" />
              <rect x="108" y="85" width="12" height="25" rx="5" fill="#2E7D32" />
              {/* Worker 2 — yellow headwrap */}
              <ellipse cx="145" cy="60" rx="12" ry="13" fill="#5D4037" />
              <ellipse cx="145" cy="52" rx="13" ry="8" fill="#FBC02D" />
              <rect x="129" y="70" width="32" height="55" rx="6" fill="#388E3C" />
              <rect x="134" y="73" width="22" height="40" rx="4" fill="#C8E6C9" />
              {/* Cooking pot */}
              <rect x="130" y="100" width="30" height="22" rx="4" fill="#455A64" />
              <rect x="126" y="97" width="38" height="6" rx="3" fill="#546E7A" />
              <ellipse cx="145" cy="98" rx="19" ry="4" fill="#607D8B" />
              {/* Table surface */}
              <rect x="0" y="128" width="185" height="8" rx="2" fill="#A5D6A7" />
              <rect x="0" y="135" width="185" height="25" rx="0" fill="#81C784" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-4 pb-8 space-y-3">

        {/* Section heading */}
        <div className="text-center py-2">
          <h2 className="text-base font-bold text-gray-900">{t("roleHeading")}</h2>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <span className="text-[10px] text-[#4CAF50]">🌿</span>
            <p className="text-xs text-gray-400">{t("changeLater")}</p>
            <span className="text-[10px] text-[#4CAF50]">🌿</span>
          </div>
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

        {/* ── Business card ── */}
        <button
          type="button"
          onClick={() => router.push("/onboarding/organization")}
          className="w-full text-left rounded-2xl border border-gray-200 bg-white p-3.5 flex items-center gap-3 hover:border-gray-300 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800">{t("business.title")}</p>
            <p className="text-xs text-gray-500 leading-snug">{t("business.desc")}</p>
          </div>
          <span className="text-xs font-bold text-[#2E7D32] shrink-0 whitespace-nowrap">
            {t("business.cta")} ›
          </span>
        </button>

        {/* ── Login link ── */}
        <p className="text-center text-sm text-gray-500 pt-1">
          {t("haveAccount")}{" "}
          <Link href="/onboarding?step=login" className="text-brand-strong font-bold underline underline-offset-2">
            {t("logIn")}
          </Link>
        </p>

        {/* ── Security note ── */}
        <div className="text-center space-y-0.5">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> {t("secureNote")}
          </p>
          <p className="text-xs text-gray-400">{t("phoneNote")}</p>
        </div>
      </div>

    </div>
  )
}
