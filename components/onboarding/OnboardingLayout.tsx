"use client"

import React, { useEffect } from "react"
import { motion } from "framer-motion"
import AppIcon from "@/public/svg/app-icon.svg"
import BubbleLoader from "@/components/loader/Bubble-Loader"
import { useOnboarding } from "@/context/onboarding-context"
import { useSearchParams } from "next/navigation"
import { getAuthToken } from "@/lib/auth-utils"

interface OnboardingLayoutProps {
  children: React.ReactNode
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const {
    showSplash,
    setShowSplash,
    currentStep,
    setCurrentStep,
    setVerifiedUser,
    setSelectedRoles,
  } = useOnboarding()

  const searchParams = useSearchParams()
  const stepParam = searchParams.get("step")

  useEffect(() => {
    const token = getAuthToken()
    const storedUserRaw = typeof window !== "undefined" ? localStorage.getItem("user") : null
    let storedUser: any = null
    if (storedUserRaw && storedUserRaw !== "undefined" && storedUserRaw !== "null") {
      try { storedUser = JSON.parse(storedUserRaw) } catch { /* ignore */ }
    }
    const profileIncomplete = !!token && (!storedUser?.firstName || !storedUser.firstName.trim())

    if (stepParam === "complete-profile" || profileIncomplete) {
      if (storedUser) setVerifiedUser(storedUser)
      setShowSplash(false)
      setCurrentStep(1) // name step (collected before phone now)
      return
    }

    if (stepParam === "login") {
      setSelectedRoles(["EMPLOYER"]) // default role for login mode
      setShowSplash(false)
      setCurrentStep(2) // skip role + name, go straight to phone
      return
    }

    const timer = setTimeout(() => {
      setShowSplash(false)
      setCurrentStep(0) // role selection
    }, 500)

    return () => clearTimeout(timer)
  }, [stepParam, setShowSplash, setCurrentStep, setVerifiedUser, setSelectedRoles])

  if (showSplash) {
    return (
      <div className="relative h-full bg-gradient-to-l from-[#145B10] to-[#729D70] flex items-center justify-center">
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

  // Progress dots for role selection (0) and signup form (1) only
  const showProgress = currentStep === 0 || currentStep === 1

  return (
    <div className="relative h-full overflow-hidden bg-white max-w-md mx-auto">
      <div className="h-full">
        {children}
      </div>

      {showProgress && (
        <div className="absolute w-full bottom-0 flex justify-center space-x-2 pb-8 sm:pb-12">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "bg-[#1B5E20] w-6 sm:w-8"
                  : "bg-[#E0E0E0] w-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
