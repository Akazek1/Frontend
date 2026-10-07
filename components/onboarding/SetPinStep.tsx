"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/store"
import { logout } from "@/store/slices/auth-slice"
import { useOnboarding } from "@/context/onboarding-context"

export function SetPinStep() {
  const t = useTranslations("onboarding.setPin")
  const { handleSubmitPin } = useOnboarding()
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const [pin, setPin] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 5)
  const mismatch = confirm.length === 5 && pin !== confirm
  const valid = pin.length === 5 && pin === confirm

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    try { await handleSubmitPin(pin) } finally { setSubmitting(false) }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await dispatch(logout())
      router.replace("/")
    } finally {
      setLoggingOut(false)
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"

  return (
    <div className="mx-auto w-full max-w-sm px-6 pt-10 pb-16">
      <h1 className="text-2xl font-bold text-ink">{t("heading")}</h1>
      <p className="mt-1 text-sm text-ink-subtle">{t("subheading")}</p>

      <div className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink">{t("pinLabel")}</label>
          <input
            inputMode="numeric"
            type="password"
            autoComplete="one-time-code"
            value={pin}
            onChange={e => setPin(onlyDigits(e.target.value))}
            placeholder="•••••"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink">{t("confirmLabel")}</label>
          <input
            inputMode="numeric"
            type="password"
            value={confirm}
            onChange={e => setConfirm(onlyDigits(e.target.value))}
            placeholder="•••••"
            className={inputClass}
          />
        </div>
        {mismatch && <p className="text-sm text-red-500">{t("mismatch")}</p>}
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!valid || submitting}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("submit")}
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
