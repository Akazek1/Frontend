"use client"

import React, { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "react-hot-toast"
import api from "@/lib/axios"
import {
  WizardStep1ChooseCategory,
  type WizardGrouping,
} from "@/components/services/wizard/WizardStep1ChooseCategory"

interface ServiceCategorySelectorProps {
  onContinue: (categories: string[]) => void
  onBack: () => void
  isLoading?: boolean
}

export const ServiceCategorySelector = ({
  onContinue,
  onBack,
  isLoading = false,
}: ServiceCategorySelectorProps) => {
  const t = useTranslations("onboarding.services")
  const tw = useTranslations("serviceWizard")
  const [groupings, setGroupings] = useState<WizardGrouping[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true)
      // Same taxonomy source as the "Add a Service" wizard on the More page.
      const response = await api.get("/taxonomy/tree", { withCredentials: true })
      const data = response.data?.data ?? response.data ?? []
      setGroupings(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading categories:", error)
      toast.error(tw("couldNotLoadCategories"))
      setGroupings([])
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const toggleCategory = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleContinue = () => {
    if (selected.size === 0) {
      toast.error(t("selectAtLeastOne"))
      return
    }
    onContinue(Array.from(selected))
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-2">
          {t("title")}
        </h1>
        <p className="text-base sm:text-lg text-gray-600">{t("subtitle")}</p>
      </div>

      {/* Reuses the exact card list from the More-page Add-a-Service wizard,
          in multi-select mode. */}
      <div className="mb-8">
        <WizardStep1ChooseCategory
          groupings={groupings}
          loading={isLoadingCategories}
          selectedIds={selected}
          onToggle={toggleCategory}
        />
      </div>

      <div className="text-sm text-gray-600 text-center mb-8">
        {selected.size > 0 && <p>{t("selectedCount", { count: selected.size })}</p>}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          {tw("back")}
        </button>
        <button
          onClick={handleContinue}
          disabled={selected.size === 0 || isLoading}
          className="flex-1 px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-[#0f4a0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {tw("continue")}
        </button>
      </div>
    </div>
  )
}
