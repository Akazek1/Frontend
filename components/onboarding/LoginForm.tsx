"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { LogIn } from "lucide-react"
import Image from "next/image"
import api from "@/lib/axios"
import { useOnboarding } from "@/context/onboarding-context"

const OTP_LENGTH = 6

export function LoginForm() {
  const {
    phoneNumber, handlePhoneChange,
    handleSendOtp, handleVerifyOtp, handleResendOtp,
    code, setCode,
    inputsRef,
    isLoading, resendCooldown,
  } = useOnboarding()

  const [otpSent, setOtpSent] = useState(false)
  const [checking, setChecking] = useState(false)
  const [phoneError, setPhoneError] = useState("")

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
      setPhoneError("Please enter a valid 9-digit phone number")
      return
    }

    const formatted = `250${cleaned}`

    // Check if account exists before sending OTP
    setChecking(true)
    try {
      const res = await api.get(`/auth/check-user/${formatted}`)
      const { exists } = res.data?.data || res.data
      if (!exists) {
        setPhoneError("No account found with this number. Please sign up instead.")
        setChecking(false)
        return
      }
    } catch {
      // In dev, allow continuing even if the check endpoint fails
      if (process.env.NODE_ENV !== "development") {
        setPhoneError("Could not verify number. Please try again.")
        setChecking(false)
        return
      }
    } finally {
      setChecking(false)
    }

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
          <h2 className="font-bold text-2xl sm:text-3xl text-ink mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500">Enter your phone number to log in</p>
        </div>
      </div>

      {/* Phone input */}
      <div>
        <div className={`flex items-center border rounded-xl overflow-hidden w-full transition-all ${
          phoneError ? "border-red-400" : otpSent ? "border-gray-200 opacity-60" : "border-gray-300 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
        }`}>
          <div className="flex items-center gap-2 pl-3 pr-4 py-3 sm:py-4 border-r border-gray-300 shrink-0">
            <Image height={40} width={40} src="https://flagcdn.com/w40/rw.png" alt="Rwanda" className="w-6 h-4 object-cover rounded-sm" />
            <span className="text-gray-700 font-semibold text-sm">+250</span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Phone number"
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
                We sent a code to <span className="font-semibold text-gray-900">+250 {phoneNumber}</span>
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
                  aria-label="Verification code"
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
                  <p className="text-sm text-gray-400">Resend code in {resendCooldown}s</p>
                ) : (
                  <button type="button" onClick={handleResendOtp} className="text-sm text-brand font-medium underline underline-offset-2">
                    Resend code
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action button */}
      {!otpSent ? (
        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoading || checking || !phoneNumber}
          className="w-full bg-brand-strong text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand transition-colors"
        >
          {checking ? "Checking..." : isLoading ? "Sending code..." : "Log In"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            const otp = code.join("")
            if (otp.length === OTP_LENGTH) handleVerifyOtp(otp)
          }}
          disabled={isLoading || code.join("").length < OTP_LENGTH}
          className="w-full bg-brand-strong text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand transition-colors"
        >
          {isLoading ? "Verifying..." : "Log In"}
        </button>
      )}

      {otpSent && (
        <button
          type="button"
          onClick={() => { setOtpSent(false); setCode(Array(OTP_LENGTH).fill("")) }}
          className="w-full text-sm text-gray-500 underline underline-offset-2 text-center"
        >
          Change phone number
        </button>
      )}

      {/* Sign-up escape hatch */}
      {!otpSent && (
        <p className="text-center text-sm text-gray-500 pt-2">
          Don&apos;t have an account?{" "}
          <Link href="/onboarding" className="text-brand font-semibold underline underline-offset-2">
            Sign up
          </Link>
        </p>
      )}
    </div>
  )
}
