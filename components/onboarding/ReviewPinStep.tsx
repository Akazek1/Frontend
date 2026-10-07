"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/store"
import { logout } from "@/store/slices/auth-slice"
import { useOnboarding } from "@/context/onboarding-context"

/**
 * Shown once, right after a user logs in with an admin-assigned (temporary) PIN.
 * They choose to keep it (clears the temporary flag) or set their own — either
 * way they're not asked again. Reuses SetPinStep (step 8) for the "set new" path.
 * Layout and copy mirror PinGate's review mode, which takes over after a refresh.
 */
export function ReviewPinStep() {
  const t = useTranslations("onboarding.setPin")
  const { setCurrentStep, handleAcceptPin } = useOnboarding()
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const keep = async () => {
    if (submitting) return
    setSubmitting(true)
    try { await handleAcceptPin() } finally { setSubmitting(false) }
  }
  const change = () => setCurrentStep(8) // SetPinStep (already in post-login mode)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await dispatch(logout())
      router.replace("/")
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm px-6 pt-10 pb-16">
      <h1 className="text-2xl font-bold text-ink">{t("reviewHeading")}</h1>
      <p className="mt-1 text-sm text-ink-subtle">
        {t("reviewBody")}
      </p>

      <button
        type="button"
        onClick={change}
        disabled={submitting}
        className="mt-8 w-full rounded-2xl bg-brand py-3.5 font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {t("setOwnPin")}
      </button>
      <button
        type="button"
        onClick={keep}
        disabled={submitting}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3.5 font-semibold text-ink disabled:opacity-50"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("keepPin")}
      </button>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm text-ink-subtle transition-colors hover:text-ink disabled:opacity-50"
      >
        {loggingOut && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {t("logOut")}
      </button>
    </div>
  )
}
