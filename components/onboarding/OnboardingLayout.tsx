"use client"

import React, { useEffect } from "react"
import { motion } from "framer-motion"
import AppIcon from "@/public/svg/app-icon.svg"
import BubbleLoader from "@/components/loader/Bubble-Loader"
import LanguageSwitcher from "@/components/header/language-switcher"
import { useOnboarding, loadSignupProgress } from "@/context/onboarding-context"
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
    setCurrentStep,
    setVerifiedUser,
    setSelectedRoles,
    setFirstName,
    setLastName,
    setEmail,
    setDateOfBirth,
    setPhoneNumber,
    setTermsAccepted,
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

    // Returning from a Terms/Privacy detour mid-signup — restore the filled form.
    const progress = loadSignupProgress()
    if (progress) {
      setFirstName(progress.firstName || "")
      setLastName(progress.lastName || "")
      setEmail(progress.email || "")
      setDateOfBirth(progress.dateOfBirth || "")
      setPhoneNumber(progress.phoneNumber || "")
      setTermsAccepted(!!progress.termsAccepted)
      setSelectedRoles(progress.selectedRoles?.length ? progress.selectedRoles : ["EMPLOYER"])
      setShowSplash(false)
      setCurrentStep(progress.step ?? 1)
      return
    }

    const timer = setTimeout(() => {
      setShowSplash(false)
      setCurrentStep(0) // RoleSelection
    }, 500)

    return () => clearTimeout(timer)
  }, [stepParam, setShowSplash, setCurrentStep, setVerifiedUser, setSelectedRoles,
      setFirstName, setLastName, setEmail, setDateOfBirth, setPhoneNumber, setTermsAccepted])

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

  return (
    <div className="relative h-full max-w-md mx-auto overflow-hidden bg-white overscroll-x-none">
      <div className="sticky top-0 z-50 flex justify-end bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <LanguageSwitcher />
      </div>
      <div className="h-[calc(100%-56px)] overflow-x-hidden overscroll-x-none">
        {children}
      </div>
    </div>
  )
}
