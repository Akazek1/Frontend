"use client"

import Image from "next/image"
import GreenAppIcon from "@/public/svg/green-app-icon.svg"
import { useOnboarding } from "@/context/onboarding-context"

export function PhoneNumberEntry() {
  const { phoneNumber, handlePhoneChange, handleSendOtp, isReturningUser } = useOnboarding()

  const imageUrl =
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800"
  const imageWrapper = "p-5 bg-[#F1FCEF] rounded-full"

  return (
    <div>
      <div className="mb-2">
        <div className="text-[#1B5E20] flex items-center justify-center text-4xl font-serif">
          <GreenAppIcon className="w-12 h-14 sm:w-16 sm:h-20" />
        </div>
      </div>
      <div className={`${imageWrapper} flex items-center justify-between w-max mx-auto mb-6 sm:mb-10`}>
        <Image
          height={400}
          width={400}
          src={imageUrl}
          alt="Phone entry"
          className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] object-cover rounded-full"
        />
      </div>
      <div className="flex items-center border border-black rounded-xl overflow-hidden w-full">
        <div className="flex items-center gap-2 pl-3 pr-5 py-3 sm:py-4 border-r border-black">
          <Image
            height={40}
            width={40}
            src="https://flagcdn.com/w40/rw.png"
            alt="Rwanda Flag"
            className="w-6 h-4 object-cover rounded-sm"
          />
          <span className="text-[#212121] font-semibold text-sm">+250</span>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && phoneNumber.length >= 9) {
              handleSendOtp()
            }
          }}
          className="px-4 py-3 sm:py-4 w-full text-[#212121] font-semibold placeholder:text-[#212121] placeholder:font-semibold placeholder:text-sm
              border-none focus:outline-none focus:ring-0 focus:border-transparent
              active:outline-none active:ring-0 active:border-transparent shadow-none"
          autoFocus
          maxLength={10}
        />
      </div>
      {isReturningUser && (
        <p className="text-sm text-[#145B10] mt-2 text-center">
          Welcome back! Enter the OTP to continue.
        </p>
      )}
    </div>
  )
}
