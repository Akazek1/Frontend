"use client"

import React from "react"
import { OnboardingProvider, useOnboarding } from "@/context/onboarding-context"
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout"
import { RoleSelection } from "@/components/onboarding/RoleSelection"
import { SignupForm } from "@/components/onboarding/SignupForm"
import { LoginForm } from "@/components/onboarding/LoginForm"
import { DocumentUploadStep } from "@/components/onboarding/DocumentUploadStep"
import { ServiceCategorySelector } from "@/components/onboarding/ServiceCategorySelector"
import { ProfilePictureStep } from "@/components/onboarding/ProfilePictureStep"
import { AllSetStep } from "@/components/onboarding/AllSetStep"
import { LocationStep } from "@/components/onboarding/LocationStep"
import { useRouter } from "next/navigation"

// Steps 3-7 manage their own full-screen layout
const FULL_SCREEN_STEPS = [3, 4, 5, 6, 7]

function OnboardingContent() {
  const router = useRouter()
  const {
    currentStep,
    setCurrentStep,
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
      case 3:
        // Profile picture comes first; advance to location step on continue.
        return <ProfilePictureStep onContinue={() => setCurrentStep(4)} />
      case 4:
        // Location picker — optional, can skip.
        return <LocationStep onContinue={() => setCurrentStep(5)} />
      case 5:
        return (
          <DocumentUploadStep
            onUploadSuccess={handleDocumentUpload}
            onCancel={handleBack}
            isLoading={isLoading}
            showBack={false}
          />
        )
      case 6:
        return (
          <ServiceCategorySelector
            onContinue={handleCategoriesSelected}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )
      case 7:
        return (
          <AllSetStep
            onAddService={() => router.push("/more/services/new")}
            onFinish={() => { window.location.href = "/?tutorial=true" }}
          />
        )
      default: return null
    }
  }

  // Steps 3-7: full-screen, manage their own layout
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
