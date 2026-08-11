"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { LogIn, Users, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import api from "@/lib/axios"
import { useOnboarding } from "@/context/onboarding-context"

const OTP_LENGTH = 6

export function LoginForm() {
  const t = useTranslations("login")
  const {
    phoneNumber, handlePhoneChange,
    handleSendOtp, handleVerifyOtp, handleResendOtp, handleLoginWithPin, setCheckedPin,
    code, setCode,
    inputsRef,
    isLoading, resendCooldown,
  } = useOnboarding()

  const [otpSent, setOtpSent] = useState(false)
  const [checking, setChecking] = useState(false)
  const [phoneError, setPhoneError] = useState("")
  // PIN login (returning users with a PIN): shown instead of the OTP entry.
  const [pinMode, setPinMode] = useState(false)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [pinSubmitting, setPinSubmitting] = useState(false)

  useEffect(() => {
    if (otpSent) {
      setTimeout(() => inputsRef.current[0]?.focus(), 350)
    }
  }, [otpSent, inputsRef])

  const handleLogin = async () => {
    setPhoneError("")

    let cleaned = phoneNumber.replace(/^\+\d{1,4}/, "").replace(/\D/g, "")
    if (cleaned.startsWith("250")) cleaned = cleaned.substring(3)
    if (cleaned.length === 10 && cleaned.startsWith("0")) cleaned = cleaned.substring(1)
    if (cleaned.length !== 9) {
      setPhoneError(t("invalidPhoneNumber"))
      return
    }

    const formatted = `250${cleaned}`

    // Check if the account exists (and whether it has a PIN) before sending OTP.
    let usePin = false
    setChecking(true)
    try {
      const res = await api.get(`/auth/check-user/${formatted}`)
      const { exists, blocked, hasPin, pinIsTemporary } = res.data?.data || res.data
      if (!exists) {
        setPhoneError(t("noAccountFound"))
        setChecking(false)
        return
      }
      if (blocked) {
        setPhoneError(t("accountSuspended"))
        setChecking(false)
        return
      }
      // Remember for post-login routing (set-a-PIN prompt / keep-or-change).
      setCheckedPin({ hasPin: !!hasPin, pinIsTemporary: !!pinIsTemporary })
      usePin = !!hasPin
    } catch {
      // In dev, allow continuing even if the check endpoint fails
      if (process.env.NODE_ENV !== "development") {
        setPhoneError(t("couldNotVerifyNumber"))
        setChecking(false)
        return
      }
    } finally {
      setChecking(false)
    }

    // Has a PIN → log in with it (no SMS). Otherwise fall back to OTP.
    if (usePin) {
      setPinMode(true)
      return
    }

    const sent = await handleSendOtp("login")
    if (sent) setOtpSent(true)
  }

  const submitPin = async (value: string) => {
    if (value.length !== 5 || pinSubmitting) return
    setPinError("")
    setPinSubmitting(true)
    const res = await handleLoginWithPin(value)
    if (!res.ok) {
      // On success the app redirects away; only handle failures here.
      setPinError(res.message || t("couldNotVerifyNumber"))
      setPin("")
      setPinSubmitting(false)
    }
  }

  // "Use a code instead" / forgot PIN → drop back to the OTP flow.
  const useCodeInstead = async () => {
    setPinMode(false)
    setPin("")
    setPinError("")
    const sent = await handleSendOtp("login")
    if (sent) setOtpSent(true)
  }

  return (
    <div className="w-full px-4 sm:px-6 pt-8 pb-10 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-surface rounded-2xl">
          <LogIn className="w-8 h-8 text-brand" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h2 className="font-bold text-2xl sm:text-3xl text-ink mb-1">{t("welcomeBack")}</h2>
          <p className="text-sm text-gray-500">{t("enterPhoneToLogIn")}</p>
        </div>
      </div>

      {/* Phone input */}
      <div>
        <div className={`flex items-center border rounded-xl overflow-hidden w-full transition-all ${
          phoneError ? "border-red-400" : otpSent ? "border-gray-200 opacity-60" : "border-gray-300 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
        }`}>
          <div className="flex items-center gap-2 pl-3 pr-4 py-3 sm:py-4 border-r border-gray-300 shrink-0">
            <Image height={40} width={40} src="https://flagcdn.com/w40/rw.png" alt={t("rwandaFlagAlt")} className="w-6 h-4 object-cover rounded-sm" />
            <span className="text-gray-700 font-semibold text-sm">+250</span>
          </div>
          <input
            type="tel"
            name="phone"
            autoComplete="tel-national"
            inputMode="numeric"
            placeholder={t("phoneNumberPlaceholder")}
            value={phoneNumber}
            onChange={(e) => { setPhoneError(""); handlePhoneChange(e.target.value) }}
            onKeyDown={(e) => { if (e.key === "Enter" && !otpSent) handleLogin() }}
            className="px-4 py-3 sm:py-4 w-full text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal border-none focus:outline-none focus:ring-0 shadow-none bg-transparent"
            maxLength={10}
            disabled={otpSent}
            autoFocus
          />
        </div>
        {phoneError && <p className="text-xs text-red-500 mt-1.5">{phoneError}</p>}
      </div>

      {/* Inline OTP — slides in after Log In */}
      <AnimatePresence>
        {otpSent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-600 text-center">
                {t.rich("otpSentTo", {
                  phone: phoneNumber,
                  b: (chunks) => <span className="font-semibold text-gray-900">{chunks}</span>,
                })}
              </p>

              <div
                className="relative flex gap-2 justify-center"
                onClick={() => inputsRef.current[0]?.focus()}
              >
                <input
                  ref={(el) => { inputsRef.current[0] = el }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={OTP_LENGTH}
                  value={code.join("")}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH)
                    const next = Array(OTP_LENGTH).fill("")
                    for (let i = 0; i < val.length; i++) next[i] = val[i]
                    setCode(next)
                    if (val.length === OTP_LENGTH) handleVerifyOtp(val)
                  }}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  style={{ fontSize: "16px" }}
                  aria-label={t("verificationCode")}
                />
                {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                  const isFilled = !!code[i]
                  const isActive = i === code.findIndex((d) => !d) || (i === OTP_LENGTH - 1 && code.every((d) => d))
                  return (
                    <div
                      key={i}
                      className={`w-11 h-12 flex items-center justify-center text-xl font-bold border-2 rounded-xl transition-all ${
                        isActive ? "border-brand ring-2 ring-brand/20" : isFilled ? "border-brand/50" : "border-gray-200"
                      }`}
                    >
                      {code[i] || ""}
                    </div>
                  )
                })}
              </div>

              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-gray-400">{t("resendCodeIn", { seconds: resendCooldown })}</p>
                ) : (
                  <button type="button" onClick={handleResendOtp} className="text-sm text-brand font-medium underline underline-offset-2">
                    {t("resendCode")}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline PIN — slides in (instead of OTP) when the account has a PIN */}
      <AnimatePresence>
        {pinMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-600 text-center">{t("enterYourPin")}</p>

              <div className="relative flex gap-2 justify-center">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus
                  maxLength={5}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 5)
                    setPin(val)
                    setPinError("")
                    if (val.length === 5) submitPin(val)
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  style={{ fontSize: "16px" }}
                  aria-label={t("enterYourPin")}
                  disabled={pinSubmitting}
                />
                {Array.from({ length: 5 }).map((_, i) => {
                  const isFilled = !!pin[i]
                  const isActive = i === pin.length || (i === 4 && pin.length === 5)
                  return (
                    <div
                      key={i}
                      className={`w-11 h-12 flex items-center justify-center text-xl font-bold border-2 rounded-xl transition-all ${
                        isActive ? "border-brand ring-2 ring-brand/20" : isFilled ? "border-brand/50" : "border-gray-200"
                      }`}
                    >
                      {isFilled ? "•" : ""}
                    </div>
                  )
                })}
              </div>

              {pinError && <p className="text-xs text-red-500 text-center">{pinError}</p>}

              <div className="text-center">
                <button type="button" onClick={useCodeInstead} className="text-sm text-brand font-medium underline underline-offset-2">
                  {t("useACodeInstead")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action button */}
      {otpSent ? (
        <button
          type="button"
          onClick={() => {
            const otp = code.join("")
            if (otp.length === OTP_LENGTH) handleVerifyOtp(otp)
          }}
          disabled={isLoading || code.join("").length < OTP_LENGTH}
          className="w-full bg-brand-strong text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand transition-colors"
        >
          {isLoading ? t("verifying") : t("logIn")}
        </button>
      ) : pinMode ? (
        <button
          type="button"
          onClick={() => submitPin(pin)}
          disabled={pin.length !== 5 || pinSubmitting}
          className="w-full bg-brand-strong text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand transition-colors"
        >
          {pinSubmitting ? t("loggingIn") : t("logIn")}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoading || checking || !phoneNumber}
          className="w-full bg-brand-strong text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand transition-colors"
        >
          {checking ? t("checking") : isLoading ? t("sendingCode") : t("logIn")}
        </button>
      )}

      {(otpSent || pinMode) && (
        <button
          type="button"
          onClick={() => { setOtpSent(false); setPinMode(false); setPin(""); setPinError(""); setCode(Array(OTP_LENGTH).fill("")) }}
          className="w-full text-sm text-gray-500 underline underline-offset-2 text-center"
        >
          {t("changePhoneNumber")}
        </button>
      )}

      {/* Agency / company sign-in (email + password) */}
      {!otpSent && !pinMode && (
        <>
          <div className="flex items-center gap-3 pt-1">
            <span className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">{t("or")}</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>
          <Link
            href="/business/login"
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface">
              <Users className="h-5 w-5 text-brand" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-ink">{t("agencyOrCompany")}</span>
              <span className="block text-xs text-gray-500">{t("signInWithEmailPassword")}</span>
            </span>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
        </>
      )}

      {/* Sign-up escape hatch */}
      {!otpSent && (
        <p className="text-center text-sm text-gray-500 pt-2">
          {t("dontHaveAccount")}{" "}
          <Link href="/onboarding" className="text-brand font-semibold underline underline-offset-2">
            {t("signUp")}
          </Link>
        </p>
      )}
    </div>
  )
}
