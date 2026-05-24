"use client"

import React from "react"
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
    handleBack,
    handleDocumentUpload,
    handleCategoriesSelected,
    isLoading,
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

  // Steps 0, 1, 2: self-contained — manage their own buttons, scroll, and OTP
  return (
    <OnboardingLayout>
      <div className="h-full overflow-y-auto">
        {renderStep()}
      </div>
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
