"use client"

import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { OnboardingProvider, useOnboarding } from "@/context/onboarding-context"
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout"
import { RoleSelection } from "@/components/onboarding/RoleSelection"
import { PhoneNumberEntry } from "@/components/onboarding/PhoneNumberEntry"
import { OTPVerification } from "@/components/onboarding/OTPVerification"
import { BasicInfoForm } from "@/components/onboarding/BasicInfoForm"
import { DocumentUploadStep } from "@/components/onboarding/DocumentUploadStep"
import { ServiceCategorySelector } from "@/components/onboarding/ServiceCategorySelector"

// Steps 4 and 5 render their own full-screen layout (doc upload, category selection)
const FULL_SCREEN_STEPS = [4, 5]
const OTP_LENGTH = 6

function OnboardingContent() {
  const {
    currentStep,
    handleNext,
    handleBack,
    handleDocumentUpload,
    handleCategoriesSelected,
    isLoading,
    code,
    firstName,
    selectedRoles,
  } = useOnboarding()

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <RoleSelection />
      case 1: return <PhoneNumberEntry />
      case 2: return <OTPVerification />
      case 3: return <BasicInfoForm />
      case 4:
        return (
          <DocumentUploadStep
            onUploadSuccess={handleDocumentUpload}
            onCancel={handleBack}
            isLoading={isLoading}
          />
        )
      case 5:
        return (
          <ServiceCategorySelector
            onContinue={handleCategoriesSelected}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )
      default: return null
    }
  }

  const getButtonText = () => {
    if (currentStep === 0) return "Continue"
    if (currentStep === 1) return "Send OTP"
    if (currentStep === 2) return "Verify"
    if (currentStep === 3) return "Continue"
    return ""
  }

  const isNextDisabled = () => {
    if (isLoading) return true
    if (currentStep === 0 && selectedRoles.length === 0) return true
    if (currentStep === 2 && code.join("").length < OTP_LENGTH) return true
    if (currentStep === 3 && !firstName.trim()) return true
    return false
  }

  // Full-screen steps (doc upload, categories) manage their own layout
  if (FULL_SCREEN_STEPS.includes(currentStep)) {
    return (
      <OnboardingLayout>
        <div className="absolute bottom-32 w-full h-full px-4 sm:px-6 flex flex-col justify-center items-center">
          <div className="flex flex-col absolute bottom-0 space-y-8 sm:space-y-[56px] w-full px-4 sm:px-6">
            {renderStep()}
          </div>
        </div>
      </OnboardingLayout>
    )
  }

  // Name step (step 3) shows both Continue and Back buttons
  if (currentStep === 3) {
    return (
      <OnboardingLayout>
        <div className="absolute bottom-32 w-full h-full px-4 sm:px-6 flex flex-col justify-center items-center">
          <div className="flex flex-col absolute bottom-0 space-y-8 sm:space-y-[56px] w-full px-4 sm:px-6">
            {renderStep()}
            <div className="mt-auto space-y-3">
              <button
                onClick={(e) => { e.preventDefault(); handleNext() }}
                type="button"
                className="w-full bg-[#1B5E20] text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#145B10] transition-colors"
                disabled={isNextDisabled()}
              >
                {isLoading ? "Please wait..." : getButtonText()}
              </button>
              <button
                onClick={(e) => { e.preventDefault(); handleBack() }}
                type="button"
                className="w-full bg-white text-[#1B5E20] border-2 border-[#1B5E20] py-4 sm:py-5 rounded-[100px] font-bold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </OnboardingLayout>
    )
  }

  // Steps 0, 1, 2: animated slide-in with single Continue button
  return (
    <OnboardingLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-32 w-full h-full px-4 sm:px-6 flex flex-col justify-center items-center"
        >
          <div className="flex flex-col absolute bottom-0 space-y-8 sm:space-y-[56px] w-full px-4 sm:px-6">
            {renderStep()}
            <div className="mt-auto">
              <button
                onClick={(e) => { e.preventDefault(); handleNext() }}
                type="button"
                className="w-full bg-[#1B5E20] text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#145B10] transition-colors"
                disabled={isNextDisabled()}
              >
                {isLoading ? "Please wait..." : getButtonText()}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  )
}

export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  )
}
