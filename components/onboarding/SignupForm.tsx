"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import api from "@/lib/axios"
import { useOnboarding } from "@/context/onboarding-context"

const isValidEmail = (v: string) => /\S+@\S+\.\S+/.test(v)
const OTP_LENGTH = 6

const isAtLeast18 = (dob: string): boolean => {
  const d = new Date(dob)
  if (isNaN(d.getTime())) return false
  const today = new Date()
  const age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  return age - (m < 0 || (m === 0 && today.getDate() < d.getDate()) ? 1 : 0) >= 18
}
export function SignupForm() {
  const {
    firstName, handleFirstNameChange,
    lastName, handleLastNameChange,
    email, handleEmailChange,
    dateOfBirth, setDateOfBirth,
    phoneNumber, handlePhoneChange,
    termsAccepted, setTermsAccepted,
    verifiedUser,
    handleSendOtp, handleVerifyOtp, handleSaveBasicInfo, handleResendOtp,
    code, setCode,
    inputsRef,
    isLoading, resendCooldown,
    handleBack,
  } = useOnboarding()

  const [emailError, setEmailError] = useState("")
  const [dobError, setDobError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [checking, setChecking] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const handleDobChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8)
    const formatted = [
      digits.slice(0, 4),
      digits.slice(4, 6),
      digits.slice(6, 8),
    ].filter(Boolean).join("-")
    setDateOfBirth(formatted)
    if (dobError && isAtLeast18(formatted)) setDobError("")
  }

  // complete-profile path: user is already authenticated
  const isCompleteProfile = !!verifiedUser?.id

  const handleEmailBlur = () => {
    if (email.trim() && !isValidEmail(email.trim())) {
      setEmailError("Please enter a valid email address")
    } else {
      setEmailError("")
    }
  }

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleEmailChange(e)
    if (emailError && isValidEmail(e.target.value.trim())) setEmailError("")
  }

  const handleSignUp = async () => {
    if (!firstName.trim()) { return }
    if (email.trim() && !isValidEmail(email.trim())) {
      setEmailError("Please enter a valid email address")
      return
    }
    if (!dateOfBirth) {
      setDobError("Date of birth is required")
      return
    }
    if (!isAtLeast18(dateOfBirth)) {
      setDobError("You must be at least 18 years old to register")
      return
    }
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 9) { return }
    if (!termsAccepted) { return }

    // Check if this phone number already has an account
    let cleaned = phoneNumber.replace(/^\+\d{1,4}/, "").replace(/\D/g, "")
    if (cleaned.startsWith("250")) cleaned = cleaned.substring(3)
    if (cleaned.length === 10 && cleaned.startsWith("0")) cleaned = cleaned.substring(1)
    const formatted = `250${cleaned}`

    setPhoneError("")
    setChecking(true)
    try {
      const res = await api.get(`/auth/check-user/${formatted}`)
      const { exists } = res.data?.data || res.data
      if (exists) {
        setPhoneError("exists")
        setChecking(false)
        return
      }
    } catch {
      // In dev mode, allow continuing if the check endpoint is unavailable
      if (process.env.NODE_ENV !== "development") {
        setPhoneError("Could not verify number. Please try again.")
        setChecking(false)
        return
      }
    } finally {
      setChecking(false)
    }

    const sent = await handleSendOtp("signup")
    if (sent) setOtpSent(true)
  }

  // Auto-focus hidden OTP input once it mounts
  useEffect(() => {
    if (otpSent) {
      setTimeout(() => inputsRef.current[0]?.focus(), 350)
    }
  }, [otpSent, inputsRef])

  const signUpDisabled = isLoading || !firstName.trim() || !termsAccepted ||
    !dateOfBirth || phoneNumber.replace(/\D/g, "").length < 9

  // ── Complete-profile variant (already authenticated, just needs name/email) ──
  if (isCompleteProfile) {
    return (
      <div className="h-full w-full overflow-y-auto overflow-x-hidden overscroll-x-none">
        <div className="mx-auto w-full max-w-md min-w-0 px-4 sm:px-6 pt-6 pb-32 space-y-4">
          <div className="text-center mb-6">
            <h2 className="font-bold text-2xl sm:text-3xl text-ink mb-2">Complete your profile</h2>
            <p className="text-sm text-gray-500">Just your name to finish setting up</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              First Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={handleFirstNameChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Last Name <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <Input
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={handleLastNameChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={handleEmailInput}
              onBlur={handleEmailBlur}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand ${emailError ? "border-red-400" : "border-gray-300"}`}
            />
            {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleSaveBasicInfo}
              disabled={isLoading || !firstName.trim()}
              className="w-full bg-brand-strong text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand transition-colors"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── New-user signup variant ──
  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden overscroll-x-none">
      <div className="mx-auto w-full max-w-md min-w-0 px-4 sm:px-6 pt-4 pb-32 space-y-4">
        <div className="text-center mb-4">
          <h2 className="font-bold text-2xl sm:text-3xl text-ink mb-2">Create your account</h2>
          <p className="text-sm text-gray-500">Fill in your details to get started</p>
        </div>

        {/* First name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            First Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="given-name"
            autoComplete="given-name"
            placeholder="Enter your first name"
            value={firstName}
            onChange={handleFirstNameChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            disabled={otpSent}
            autoFocus
          />
        </div>

        {/* Last name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Last Name <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <Input
            type="text"
            name="family-name"
            autoComplete="family-name"
            placeholder="Enter your last name"
            value={lastName}
            onChange={handleLastNameChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            disabled={otpSent}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={handleEmailInput}
            onBlur={handleEmailBlur}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand ${emailError ? "border-red-400" : "border-gray-300"}`}
            disabled={otpSent}
          />
          {emailError
            ? <p className="text-xs text-red-500 mt-1">{emailError}</p>
            : <p className="text-xs text-gray-400 mt-1">You can add this later in your profile</p>
          }
        </div>

        {/* Date of birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="bday"
            placeholder="YYYY-MM-DD"
            value={dateOfBirth}
            maxLength={10}
            onChange={(e) => handleDobChange(e.target.value)}
            onBlur={() => {
              if (dateOfBirth && !isAtLeast18(dateOfBirth)) {
                setDobError("You must be at least 18 years old to register")
              } else {
                setDobError("")
              }
            }}
            className={`block h-14 min-w-0 w-full max-w-full appearance-none rounded-lg border px-4 py-3 text-[16px] leading-none focus:ring-2 focus:ring-brand focus:border-brand ${dobError ? "border-red-400" : "border-gray-300"}`}
            disabled={otpSent}
          />
          {dobError
            ? <p className="text-xs text-red-500 mt-1">{dobError}</p>
            : <p className="text-xs text-gray-400 mt-1">You must be at least 18 years old.</p>
          }
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className={`flex min-w-0 items-center border rounded-xl overflow-hidden w-full transition-all ${
            phoneError ? "border-red-400" :
            otpSent ? "border-gray-200 opacity-60" :
            "border-gray-300 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
          }`}>
            <div className="flex items-center gap-2 pl-3 pr-4 py-3 sm:py-4 border-r border-gray-300 shrink-0">
              <Image height={40} width={40} src="https://flagcdn.com/w40/rw.png" alt="Rwanda" className="w-6 h-4 object-cover rounded-sm" />
              <span className="text-gray-700 font-semibold text-sm">+250</span>
            </div>
            <input
              type="tel"
              name="phone"
              autoComplete="tel-national"
              inputMode="numeric"
              placeholder="Phone number"
              value={phoneNumber}
              onChange={(e) => { setPhoneError(""); handlePhoneChange(e.target.value) }}
              className="min-w-0 px-4 py-3 sm:py-4 w-full text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal border-none focus:outline-none focus:ring-0 shadow-none bg-transparent"
              maxLength={10}
              disabled={otpSent}
            />
          </div>
          {phoneError === "exists" ? (
            <p className="text-xs text-red-500 mt-1.5">
              An account with this number already exists.{" "}
              <Link href="/onboarding?step=login" className="text-brand font-semibold underline underline-offset-2">
                Log in instead
              </Link>
            </p>
          ) : phoneError ? (
            <p className="text-xs text-red-500 mt-1.5">{phoneError}</p>
          ) : null}
        </div>

        {/* T&C */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="sr-only"
              disabled={otpSent}
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${termsAccepted ? "bg-brand border-brand" : "bg-white border-gray-300"}`}>
              {termsAccepted && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-500 leading-relaxed">
            I have read and agree to the{" "}
            <Link href="/terms" className="text-brand underline underline-offset-2" onClick={(e) => e.stopPropagation()}>Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-brand underline underline-offset-2" onClick={(e) => e.stopPropagation()}>Privacy Policy</Link>
          </span>
        </label>

        {/* Inline OTP — slides in after Sign Up */}
        <AnimatePresence>
          {otpSent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  We sent a code to <span className="font-semibold text-gray-900">+250 {phoneNumber}</span>
                </p>

                {/* Hidden input that captures typing, visual boxes overlaid */}
                <div
                  className="relative flex w-full gap-1.5 sm:gap-2 justify-center"
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
                        className={`h-12 min-w-0 flex-1 max-w-11 flex items-center justify-center text-xl font-bold border-2 rounded-xl transition-all ${
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

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          {!otpSent ? (
            <button
              type="button"
              onClick={handleSignUp}
              disabled={signUpDisabled || checking}
              className="w-full bg-brand-strong text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand transition-colors"
            >
              {checking ? "Checking..." : isLoading ? "Please wait..." : "Sign Up"}
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
              {isLoading ? "Verifying..." : "Verify & Create Account"}
            </button>
          )}
          <button
            type="button"
            onClick={() => { if (otpSent) { setOtpSent(false); setCode(Array(OTP_LENGTH).fill("")) } else { handleBack() } }}
            className="w-full bg-white text-brand-strong border-2 border-brand-strong py-4 sm:py-5 rounded-[100px] font-bold hover:bg-gray-50 transition-colors"
          >
            {otpSent ? "Change details" : "Back"}
          </button>
        </div>
      </div>
    </div>
  )
}
