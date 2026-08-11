"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useOnboarding } from "@/context/onboarding-context"

/**
 * Shown once, right after a user logs in with an admin-assigned (temporary) PIN.
 * They choose to keep it (clears the temporary flag) or set their own — either
 * way they're not asked again. Reuses SetPinStep (step 8) for the "set new" path.
 */
export function ReviewPinStep() {
  const { setCurrentStep, handleAcceptPin } = useOnboarding()
  const [submitting, setSubmitting] = useState(false)

  const keep = async () => {
    if (submitting) return
    setSubmitting(true)
    try { await handleAcceptPin() } finally { setSubmitting(false) }
  }
  const change = () => setCurrentStep(8) // SetPinStep (already in post-login mode)

  return (
    <div className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-bold text-ink">Your PIN was set for you</h1>
      <p className="mt-1 text-sm text-ink-subtle">
        Someone set a login PIN for your account. You can keep it, or choose your own now.
      </p>

      <button
        type="button"
        onClick={change}
        disabled={submitting}
        className="mt-8 w-full rounded-2xl bg-brand py-3.5 font-semibold text-white transition-opacity disabled:opacity-50"
      >
        Set my own PIN
      </button>
      <button
        type="button"
        onClick={keep}
        disabled={submitting}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3.5 font-semibold text-ink disabled:opacity-50"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Keep this PIN
      </button>
    </div>
  )
}
