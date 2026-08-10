"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useOnboarding } from "@/context/onboarding-context"

/**
 * Shown right after a new account is created: prompts the user to set a 5-digit
 * login PIN so returning logins skip the OTP/SMS. Skippable — OTP still works as
 * the fallback. Calls the onboarding context's handleSubmitPin / handleSkipPin,
 * which persist the PIN (POST /auth/set-pin) and resume role-specific steps.
 */
export function SetPinStep() {
  const { handleSubmitPin, handleSkipPin } = useOnboarding()
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
  const skip = async () => {
    if (submitting) return
    setSubmitting(true)
    try { await handleSkipPin() } finally { setSubmitting(false) }
  }

  const inputClass =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"

  return (
    <div className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-bold text-ink">Create a PIN</h1>
      <p className="mt-1 text-sm text-ink-subtle">
        Set a 5-digit PIN to sign in next time.
      </p>

      <div className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink">PIN</label>
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
          <label className="text-sm font-medium text-ink">Confirm PIN</label>
          <input
            inputMode="numeric"
            type="password"
            value={confirm}
            onChange={e => setConfirm(onlyDigits(e.target.value))}
            placeholder="•••••"
            className={inputClass}
          />
        </div>
        {mismatch && <p className="text-sm text-red-500">PINs don’t match.</p>}
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!valid || submitting}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Set PIN
      </button>
      <button
        type="button"
        onClick={skip}
        disabled={submitting}
        className="mt-3 w-full py-2 text-sm font-medium text-ink-subtle disabled:opacity-50"
      >
        Skip for now
      </button>
    </div>
  )
}
