"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useOnboarding } from "@/context/onboarding-context"

/**
 * Shown right after a new account is created (and to existing PIN-less users
 * after an OTP login): prompts the user to set a 5-digit login PIN so returning
 * logins skip the OTP/SMS. Mandatory — there is no skip; a PIN is required to
 * proceed. Users who later forget it fall back to OTP via "Use a code instead"
 * on the login screen. Calls the onboarding context's handleSubmitPin, which
 * persists the PIN (POST /auth/set-pin) and resumes role-specific steps.
 */
export function SetPinStep() {
  const t = useTranslations("onboarding.setPin")
  const { handleSubmitPin } = useOnboarding()
  const [pin, setPin] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 5)
  const mismatch = confirm.length === 5 && pin !== confirm
  const valid = pin.length === 5 && pin === confirm

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    try { await handleSubmitPin(pin) } finally { setSubmitting(false) }
  }

  const inputClass =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"

  return (
    <div className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-bold text-ink">{t("heading")}</h1>
      <p className="mt-1 text-sm text-ink-subtle">
        {t("subheading")}
      </p>

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
    </div>
  )
}
