"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { CheckCircle2 } from "lucide-react"

interface AllSetStepProps {
  /** Go to the Add-Service wizard (/more/services/new). */
  onAddService: () => void
  /** Skip and go home. */
  onFinish: () => void
}

/**
 * Final onboarding screen for workers. Onboarding is already complete by this
 * point; we simply ask whether they want to list a service now. "Yes" sends
 * them to the existing Add-Service wizard; "Maybe later" takes them home.
 */
export const AllSetStep = ({ onAddService, onFinish }: AllSetStepProps) => {
  const t = useTranslations("onboarding.allSet")
  return (
    <div className="w-full max-w-md text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-surface rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-brand" />
        </div>
      </div>
      <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-2">
        {t("title")}
      </h1>
      <p className="text-base sm:text-lg text-gray-600 mb-8">
        {t("subtitle")}
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onAddService}
          className="w-full px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-[#0f4a0b] transition-colors"
        >
          {t("createService")}
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-colors"
        >
          {t("maybeLater")}
        </button>
      </div>
    </div>
  )
}
