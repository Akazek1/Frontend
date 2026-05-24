"use client"

import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { OnboardingProvider, useOnboarding } from "@/context/onboarding-context"
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout"
import { RoleSelection } from "@/components/onboarding/RoleSelection"
import { SignupForm } from "@/components/onboarding/SignupForm"
import { LoginForm } from "@/components/onboarding/LoginForm"
import { DocumentUploadStep } from "@/components/onboarding/DocumentUploadStep"
import { ServiceCategorySelector } from "@/components/onboarding/ServiceCategorySelector"

// Steps 4 and 5 manage their own full-screen layout
const FULL_SCREEN_STEPS = [4, 5]

function OnboardingContent() {
  const {
    currentStep,
    handleNext,
    handleBack,
    handleDocumentUpload,
    handleCategoriesSelected,
    isLoading,
    selectedRoles,
  } = useOnboarding()

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <RoleSelection />
      case 1: return <SignupForm />
      case 2: return <LoginForm />
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

  // Steps 4 and 5: full-screen, manage their own layout
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

  // Steps 1 and 2: self-contained forms (manage their own buttons and OTP inline)
  if (currentStep === 1 || currentStep === 2) {
    return (
      <OnboardingLayout>
        <div className="h-full overflow-y-auto pb-8">
          {renderStep()}
        </div>
      </OnboardingLayout>
    )
  }

  // Step 0: role selection with Continue button
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
                disabled={selectedRoles.length === 0}
              >
                Continue
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
