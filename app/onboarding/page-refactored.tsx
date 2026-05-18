"use client"

import React, { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { OnboardingProvider, useOnboarding } from "@/context/onboarding-context"
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout"
import { IntroSlide } from "@/components/onboarding/IntroSlide"
import { RoleSelection } from "@/components/onboarding/RoleSelection"
import { PhoneNumberEntry } from "@/components/onboarding/PhoneNumberEntry"
import { OTPVerification } from "@/components/onboarding/OTPVerification"
import { BasicInfoForm } from "@/components/onboarding/BasicInfoForm"
import { DocumentUploadStep } from "@/components/onboarding/DocumentUploadStep"
import { ServiceCategorySelector } from "@/components/onboarding/ServiceCategorySelector"

function OnboardingContent() {
  const {
    currentStep,
    handleNext,
    handleBack,
    isLoading,
    code,
    firstName,
    selectedRoles,
  } = useOnboarding()

  const componentSteps = [5, 6]
  const OTP_LENGTH = 6

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <IntroSlide />
      case 1:
        return <RoleSelection />
      case 2:
        return <PhoneNumberEntry />
      case 3:
        return <OTPVerification />
      case 4:
        return <BasicInfoForm />
      case 5:
        return (
          <DocumentUploadStep
            onUploadSuccess={(doc) => {
              // Document upload handles its own step increment
            }}
            onCancel={handleBack}
            isLoading={isLoading}
          />
        )
      case 6:
        return (
          <ServiceCategorySelector
            onContinue={async (categories) => {
              // Service selector handles completion
            }}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )
      default:
        return null
    }
  }

  const getButtonText = () => {
    if (currentStep === 1) return "Continue"
    if (currentStep === 2) return "Send OTP"
    if (currentStep === 3) return "Verify"
    if (currentStep === 4) return "Continue"
    if (componentSteps.includes(currentStep)) return ""
    return "Next"
  }

  return (
    <OnboardingLayout>
      {componentSteps.includes(currentStep) ? (
        <div className="absolute bottom-32 w-full h-full px-4 sm:px-6 flex flex-col justify-center items-center">
          <div className="flex flex-col absolute bottom-0 space-y-8 sm:space-y-[56px] w-full px-4 sm:px-6">
            {renderStep()}
          </div>
        </div>
      ) : currentStep === 4 ? (
        <div className="absolute bottom-32 w-full h-full px-4 sm:px-6 flex flex-col justify-center items-center">
          <div className="flex flex-col absolute bottom-0 space-y-8 sm:space-y-[56px] w-full px-4 sm:px-6">
            {renderStep()}
            <div className="mt-auto">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleNext()
                }}
                type="button"
                className="w-full bg-[#1B5E20] text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#145B10] transition-colors"
                disabled={isLoading || !firstName.trim()}
              >
                {isLoading ? "Please wait..." : getButtonText()}
              </button>
            </div>
          </div>
        </div>
      ) : (
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
                  onClick={(e) => {
                    e.preventDefault()
                    handleNext()
                  }}
                  type="button"
                  className="w-full bg-[#1B5E20] text-white py-4 sm:py-5 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#145B10] transition-colors"
                  disabled={
                    isLoading ||
                    (currentStep === 3 && code.join("").length < OTP_LENGTH) ||
                    (currentStep === 1 && selectedRoles.length === 0) ||
                    (currentStep === 4 && !firstName.trim())
                  }
                >
                  {isLoading ? "Please wait..." : getButtonText()}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
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
