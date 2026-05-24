"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { useOnboarding } from "@/context/onboarding-context"

const isValidEmail = (v: string) => /\S+@\S+\.\S+/.test(v)
const OTP_LENGTH = 6

export function SignupForm() {
  const {
    firstName, handleFirstNameChange,
    lastName, handleLastNameChange,
    email, handleEmailChange,
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
  const [otpSent, setOtpSent] = useState(false)

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
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 9) { return }
    if (!termsAccepted) { return }

    const sent = await handleSendOtp()
    if (sent) setOtpSent(true)
  }

  // Auto-focus hidden OTP input once it mounts
  useEffect(() => {
    if (otpSent) {
      setTimeout(() => inputsRef.current[0]?.focus(), 350)
    }
  }, [otpSent, inputsRef])

  const signUpDisabled = isLoading || !firstName.trim() || !termsAccepted ||
    phoneNumber.replace(/\D/g, "").length < 9

  // ── Complete-profile variant (already authenticated, just needs name/email) ──
  if (isCompleteProfile) {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="px-4 sm:px-6 pt-10 pb-32 max-w-md mx-auto space-y-4">
          <div className="text-center mb-6">
            <h2 className="font-bold text-2xl sm:text-3xl text-[#212121] mb-2">Complete your profile</h2>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10]"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10]"
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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10] ${emailError ? "border-red-400" : "border-gray-300"}`}
            />
            {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleSaveBasicInfo}
              disabled={isLoading || !firstName.trim()}
              className="w-full bg-[#1B5E20] text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#145B10] transition-colors"
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
    <div className="w-full h-full overflow-y-auto">
      <div className="px-4 sm:px-6 pt-8 pb-32 max-w-md mx-auto space-y-4">
        <div className="text-center mb-4">
          <h2 className="font-bold text-2xl sm:text-3xl text-[#212121] mb-2">Create your account</h2>
          <p className="text-sm text-gray-500">Fill in your details to get started</p>
        </div>

        {/* First name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            First Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Enter your first name"
            value={firstName}
            onChange={handleFirstNameChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10]"
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
            placeholder="Enter your last name"
            value={lastName}
            onChange={handleLastNameChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10]"
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
            placeholder="your.email@example.com"
            value={email}
            onChange={handleEmailInput}
            onBlur={handleEmailBlur}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10] ${emailError ? "border-red-400" : "border-gray-300"}`}
            disabled={otpSent}
          />
          {emailError
            ? <p className="text-xs text-red-500 mt-1">{emailError}</p>
            : <p className="text-xs text-gray-400 mt-1">You can add this later in your profile</p>
          }
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className={`flex items-center border rounded-xl overflow-hidden w-full transition-all ${otpSent ? "opacity-60" : "focus-within:border-[#145B10] focus-within:ring-2 focus-within:ring-[#145B10]/20 border-gray-300"}`}>
            <div className="flex items-center gap-2 pl-3 pr-4 py-3 sm:py-4 border-r border-gray-300 shrink-0">
              <Image height={40} width={40} src="https://flagcdn.com/w40/rw.png" alt="Rwanda" className="w-6 h-4 object-cover rounded-sm" />
              <span className="text-gray-700 font-semibold text-sm">+250</span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Phone number"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="px-4 py-3 sm:py-4 w-full text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal border-none focus:outline-none focus:ring-0 shadow-none bg-transparent"
              maxLength={10}
              disabled={otpSent}
            />
          </div>
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
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${termsAccepted ? "bg-[#145B10] border-[#145B10]" : "bg-white border-gray-300"}`}>
              {termsAccepted && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-500 leading-relaxed">
            I have read and agree to the{" "}
            <a href="/terms" className="text-[#145B10] underline underline-offset-2" onClick={(e) => e.stopPropagation()}>Terms of Service</a>{" "}
            and{" "}
            <a href="/privacy" className="text-[#145B10] underline underline-offset-2" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>
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
                          isActive ? "border-[#145B10] ring-2 ring-[#145B10]/20" : isFilled ? "border-[#145B10]/50" : "border-gray-200"
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
                    <button type="button" onClick={handleResendOtp} className="text-sm text-[#145B10] font-medium underline underline-offset-2">
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
              disabled={signUpDisabled}
              className="w-full bg-[#1B5E20] text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#145B10] transition-colors"
            >
              {isLoading ? "Please wait..." : "Sign Up"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const otp = code.join("")
                if (otp.length === OTP_LENGTH) handleVerifyOtp(otp)
              }}
              disabled={isLoading || code.join("").length < OTP_LENGTH}
              className="w-full bg-[#1B5E20] text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#145B10] transition-colors"
            >
              {isLoading ? "Verifying..." : "Verify & Create Account"}
            </button>
          )}
          <button
            type="button"
            onClick={() => { if (otpSent) { setOtpSent(false); setCode(Array(OTP_LENGTH).fill("")) } else { handleBack() } }}
            className="w-full bg-white text-[#1B5E20] border-2 border-[#1B5E20] py-4 sm:py-5 rounded-[100px] font-bold hover:bg-gray-50 transition-colors"
          >
            {otpSent ? "Change details" : "Back"}
          </button>
        </div>
      </div>
    </div>
  )
}
