"use client"

import Image from "next/image"
import { X } from "lucide-react"
import GreenAppIcon from "@/public/svg/green-app-icon.svg"
import LeftFlowerIcon from "@/public/svg/left-flower.svg"
import { useOnboarding } from "@/context/onboarding-context"

export function IntroSlide() {
  const { handleSkipIntro } = useOnboarding()

  const title = "Quality, Affordable, Best Services."
  const imageUrl = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800"

  return (
    <>
      {/* Skip button */}
      <button
        onClick={handleSkipIntro}
        className="absolute top-6 right-4 sm:top-8 sm:right-8 z-50 flex items-center gap-2 text-[#1B5E20] font-semibold text-sm hover:text-[#145B10] transition-colors"
      >
        <span>Skip</span>
        <X className="w-4 h-4" />
      </button>

      {/* Slide content */}
      <div>
        <div className="absolute -right-20 -top-52 sm:-right-[130px] sm:-top-56 flex">
          <LeftFlowerIcon className="w-16 h-auto sm:w-auto sm:h-auto" />
          <div className="p-5 bg-[#F1FCEF] rounded-full">
            <Image
              height={400}
              width={400}
              src={imageUrl}
              alt="Onboarding intro"
              className="w-[160px] h-[160px] sm:w-[250px] sm:h-[250px] object-cover rounded-full"
            />
          </div>
        </div>
        <div className="mb-4 sm:mb-8">
          <div className="text-[#1B5E20] text-3xl font-serif">
            <GreenAppIcon className="w-12 h-14 sm:w-16 sm:h-20" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-6 sm:mb-8 max-w-[280px]">
          {title}
        </h1>
      </div>
    </>
  )
}
