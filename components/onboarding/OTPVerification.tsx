"use client"

import { useOnboarding } from "@/context/onboarding-context"

const OTP_LENGTH = 6

export function OTPVerification() {
  const {
    code,
    setCode,
    inputsRef,
    handleBack,
    handleVerifyOtp,
  } = useOnboarding()

  return (
    <div className="relative w-full">
      <button
        onClick={handleBack}
        className="absolute -top-60 sm:-top-80 left-0 p-2 text-[#1B5E20] font-semibold flex items-center gap-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Back
      </button>
      <div className="flex flex-col items-center gap-10 sm:gap-20 pt-12">
        <span className="flex flex-col items-center gap-2 mb-6 sm:mb-8">
          <h2 className="font-bold text-2xl sm:text-3xl text-[#212121]">Enter Verification Code</h2>
          <p className="text-sm font-bold text-center text-[#212121] max-w-[300px]">
            Enter the {OTP_LENGTH}-digit verification code sent to your phone
          </p>
        </span>
        <div className="relative" onClick={() => inputsRef.current[0]?.focus()}>
          <input
            ref={(el) => {
              inputsRef.current[0] = el
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={OTP_LENGTH}
            value={code.join("")}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH)
              const newCode: string[] = Array(OTP_LENGTH).fill("")
              for (let i = 0; i < value.length; i++) {
                newCode[i] = value[i]
              }
              setCode(newCode)
              if (value.length === OTP_LENGTH) {
                handleVerifyOtp(value)
              }
            }}
            onFocus={(e) => {
              e.target.scrollIntoView({ behavior: "smooth", block: "center" })
            }}
            autoFocus
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            aria-label="Verification code"
            style={{ fontSize: "16px" }}
          />
          <div className="flex gap-1 sm:gap-2">
            {Array.from({ length: OTP_LENGTH }).map((_, index) => {
              const isFilled = !!code[index]
              const isActive =
                index === code.findIndex((d) => !d) ||
                (index === OTP_LENGTH - 1 && code.every((d) => d))
              return (
                <div
                  key={index}
                  className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg font-medium border rounded-md ${
                    isActive ? "border-[#145B10] border-2 ring-2 ring-[#145B10]/20" : "border-black"
                  } ${isFilled ? "bg-white" : "bg-white"}`}
                >
                  {code[index] || ""}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
