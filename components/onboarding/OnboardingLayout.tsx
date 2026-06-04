"use client"

import React, { useEffect } from "react"
import { motion } from "framer-motion"
import AppIcon from "@/public/svg/app-icon.svg"
import BubbleLoader from "@/components/loader/Bubble-Loader"
import { useOnboarding } from "@/context/onboarding-context"
import { useSearchParams } from "next/navigation"
import { getAuthToken, getStoredAuthUser } from "@/lib/auth-utils"
import type { AuthResponse } from "@/services/auth-service"

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
    const storedUser = getStoredAuthUser<AuthResponse["data"]["user"]>()
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
      setCurrentStep(2) // LoginForm
      return
    }

    const timer = setTimeout(() => {
      setShowSplash(false)
      setCurrentStep(0) // RoleSelection
    }, 500)

    return () => clearTimeout(timer)
  }, [stepParam, setShowSplash, setCurrentStep, setVerifiedUser, setSelectedRoles])

  if (showSplash) {
    return (
      <div className="relative h-full bg-gradient-to-l from-brand to-[#729D70] flex items-center justify-center">
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

  // Progress dot only for signup form (step 1) — step 0 has its own rich layout
  const showProgress = currentStep === 1

  return (
    <div className="relative h-full overflow-hidden bg-white max-w-md mx-auto">
      <div className="h-full">
        {children}
      </div>

      {showProgress && (
        <div className="absolute w-full bottom-0 flex justify-center space-x-2 pb-8 sm:pb-12">
          {/* Single active dot — shows on signup form only */}
          <div className="h-2 w-6 sm:w-8 rounded-full bg-brand-strong" />
        </div>
      )}
    </div>
  )
}
