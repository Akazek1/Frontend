"use client"

import React, { useEffect } from "react"
import { motion } from "framer-motion"
import AppIcon from "@/public/svg/app-icon.svg"
import BubbleLoader from "@/components/loader/Bubble-Loader"
import { useOnboarding } from "@/context/onboarding-context"
import { useSearchParams } from "next/navigation"

const ONBOARDING_STEPS_COUNT = 7

interface OnboardingLayoutProps {
  children: React.ReactNode
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const {
    showSplash,
    setShowSplash,
    currentStep,
    setCurrentStep,
    verifiedUser,
    setVerifiedUser,
  } = useOnboarding()

  const searchParams = useSearchParams()
  const stepParam = searchParams.get("step")

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const storedUserRaw = typeof window !== "undefined" ? localStorage.getItem("user") : null
    let storedUser: any = null
    if (storedUserRaw && storedUserRaw !== "undefined" && storedUserRaw !== "null") {
      try {
        storedUser = JSON.parse(storedUserRaw)
      } catch {
        // ignore parse errors
      }
    }
    const profileIncomplete = !!token && (!storedUser?.firstName || !storedUser.firstName.trim())

    if (stepParam === "complete-profile" || profileIncomplete) {
      if (storedUser) setVerifiedUser(storedUser)
      setShowSplash(false)
      setCurrentStep(4)
      return
    }

    const timer = setTimeout(() => {
      setShowSplash(false)
      setCurrentStep(0)
    }, 500)

    return () => clearTimeout(timer)
  }, [stepParam, setShowSplash, setCurrentStep, setVerifiedUser])

  if (showSplash) {
    return (
      <div className="relative h-screen bg-gradient-to-l from-[#145B10] to-[#729D70] flex items-center justify-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1 }}>
          <AppIcon />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-[160px] left-[50%]"
        >
          <BubbleLoader />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-hidden bg-white max-w-md mx-auto">
      {/* Main content */}
      <div className="h-full">
        {children}
      </div>

      {/* Progress indicator at bottom */}
      <div className="absolute w-full bottom-0 flex justify-center space-x-2 pb-8 sm:pb-12">
        {Array.from({ length: ONBOARDING_STEPS_COUNT }).map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full ${
              index === currentStep
                ? "bg-[#1B5E20] w-6 sm:w-8 transition-all duration-300"
                : "bg-[#E0E0E0] w-2"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
