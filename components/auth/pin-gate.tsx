"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/store"
import { updateUser, logout } from "@/store/slices/auth-slice"
import api from "@/lib/axios"
import { toast } from "react-hot-toast"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import LanguageSwitcher from "@/components/header/language-switcher"

/**
 * Full-screen gate shown to authenticated users who need PIN action:
 *   - hasPin === false  → must create a PIN
 *   - pinIsTemporary    → must review/replace their admin-assigned PIN
 * Blocks all app interaction until resolved. No skip or close.
 */
export function PinGate() {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((state: RootState) => state.auth.user)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const pinSetupInProgress = useSelector((state: RootState) => state.auth.pinSetupInProgress)
  const t = useTranslations("onboarding.setPin")

  const router = useRouter()
  // User explicitly clicked "Set my own PIN" on the review screen — switches to create form.
  const [userChoseReplace, setUserChoseReplace] = useState(false)
  const [pin, setPin] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Company accounts sign in with email + password and never have a PIN.
  // `hasPin` is undefined while the session is still loading — don't flash the gate.
  // Steps aside while the onboarding flow is itself showing its PIN step.
  const isCompany = user?.accountType === "COMPANY"
  const needsPinSetup = user?.hasPin === false || user?.pinIsTemporary === true
  if (!isAuthenticated || isCompany || !needsPinSetup || pinSetupInProgress) return null

  // Derived from live user state so it reacts when /auth/me re-hydrates the store.
  const showReview = user?.pinIsTemporary === true && !userChoseReplace

  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 5)
  const mismatch = confirm.length === 5 && pin !== confirm
  const valid = pin.length === 5 && pin === confirm

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await dispatch(logout())
      router.replace("/")
    } finally {
      setLoggingOut(false)
      setUserChoseReplace(false)
      setPin("")
      setConfirm("")
    }
  }

  const handleKeepPin = async () => {
    setSubmitting(true)
    try {
      await api.post("/auth/accept-pin")
      dispatch(updateUser({ pinIsTemporary: false }))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t("couldNotConfirmPin"))
    } finally {
      setSubmitting(false)
    }
  }

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    try {
      await api.post("/auth/set-pin", { pin })
      dispatch(updateUser({ hasPin: true, pinIsTemporary: false }))
      setPin("")
      setConfirm("")
      setUserChoseReplace(false)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t("couldNotSetPin"))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
      <div className="sticky top-0 z-50 flex justify-end bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 max-w-md mx-auto w-full">
        <LanguageSwitcher />
      </div>

      <div className="flex-1 overflow-y-auto">
        {showReview ? (
          /* Review mode: admin-assigned temporary PIN */
          <div className="mx-auto w-full max-w-sm px-6 pt-10 pb-16">
            <h1 className="text-2xl font-bold text-ink">{t("reviewHeading")}</h1>
            <p className="mt-1 text-sm text-ink-subtle">
              {t("reviewBody")}
            </p>

            <button
              type="button"
              onClick={() => setUserChoseReplace(true)}
              disabled={submitting}
              className="mt-8 w-full rounded-2xl bg-brand py-3.5 font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {t("setOwnPin")}
            </button>
            <button
              type="button"
              onClick={handleKeepPin}
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
        ) : (
          /* Create mode: no PIN yet (or user chose to replace temp PIN) */
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
        )}
      </div>
    </div>
  )
}
