"use client"

import Image from "next/image"
import Link from "next/link"
import { Phone } from "lucide-react"
import { useOnboarding } from "@/context/onboarding-context"

export function PhoneNumberEntry() {
  const {
    phoneNumber,
    handlePhoneChange,
    handleSendOtp,
    termsAccepted,
    setTermsAccepted,
  } = useOnboarding()

  return (
    <div className="w-full">
      {/* Icon header */}
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-[#F1FCEF] rounded-2xl">
          <Phone className="w-8 h-8 text-[#145B10]" strokeWidth={1.5} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">
        What&apos;s your number?
      </h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        We&apos;ll send a verification code to confirm it&apos;s you
      </p>

      {/* Phone input */}
      <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden w-full mb-4 focus-within:border-[#145B10] focus-within:ring-2 focus-within:ring-[#145B10]/20 transition-all">
        <div className="flex items-center gap-2 pl-3 pr-4 py-3 sm:py-4 border-r border-gray-300 shrink-0">
          <Image
            height={40}
            width={40}
            src="https://flagcdn.com/w40/rw.png"
            alt="Rwanda"
            className="w-6 h-4 object-cover rounded-sm"
          />
          <span className="text-gray-700 font-semibold text-sm">+250</span>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="Phone number"
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && phoneNumber.length >= 9) handleSendOtp()
          }}
          className="px-4 py-3 sm:py-4 w-full text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal
            border-none focus:outline-none focus:ring-0 shadow-none bg-transparent"
          autoFocus
          maxLength={10}
        />
      </div>

      {/* T&C checkbox — required */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <div className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              termsAccepted
                ? "bg-[#145B10] border-[#145B10]"
                : "bg-white border-gray-300"
            }`}
          >
            {termsAccepted && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm text-gray-500 leading-relaxed">
          I have read and agree to the{" "}
          <Link href="/terms" className="text-[#145B10] underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#145B10] underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
            Privacy Policy
          </Link>
        </span>
      </label>
    </div>
  )
}
