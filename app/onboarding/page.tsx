"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import AppIcon from "@/public/svg/app-icon.svg"
import GreenAppIcon from "@/public/svg/green-app-icon.svg"
import RightFlowerIcon from "@/public/svg/flower.svg"
import LeftFlowerIcon from "@/public/svg/left-flower.svg"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "react-hot-toast"
import BubbleLoader from "@/components/loader/Bubble-Loader.tsx"
import { Briefcase, User, X } from "lucide-react"
import api from "@/lib/axios"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store"
import { updateUser } from "@/store/slices/auth-slice"
import { DocumentUploadStep } from "@/components/onboarding/DocumentUploadStep"
import { ServiceCategorySelector } from "@/components/onboarding/ServiceCategorySelector"

const HARDCODED_OTP = "111111"
const OTP_LENGTH = 6

interface OnboardingStep {
  title: string
  subtitle?: string
  image: string
  bgColor: string
  textColor: string
  buttonText: string
  type?: "info" | "dual-mode" | "phone" | "otp" | "user-type" | "basic-info" | "document-upload" | "service-category"
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Quality, Affordable, Best Services.",
    subtitle: "Welcome to HWA",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#145B10]",
    textColor: "text-[#1B5E20]",
    buttonText: "Get Started",
    type: "info",
  },
  {
    title: "Choose Your Role",
    subtitle: "What brings you here today?",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Continue",
    type: "user-type",
  },
  {
    title: "Enter your phone number",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Send OTP",
    type: "phone",
  },
  {
    title: "Enter Verification Code",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Verify",
    type: "otp",
  },
  {
    title: "Tell us about yourself",
    subtitle: "We just need your name to get started",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Continue",
    type: "basic-info",
  },
  {
    title: "Upload Your ID",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Upload",
    type: "document-upload",
  },
  {
    title: "What services do you offer?",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Finish",
    type: "service-category",
  },
]

const OnboardingPage = () => {
  const [showSplash, setShowSplash] = useState(true)
  const [currentStep, setCurrentStep] = useState(-1)
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedRole, setSelectedRole] = useState<"EMPLOYER" | "WORKER" | null>(null)
  const [isReturningUser, setIsReturningUser] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [verifiedUser, setVerifiedUser] = useState<any>(null)
  const [uploadedDocument, setUploadedDocument] = useState<any>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const inputsRef = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null))
  const [activeInputIndex, setActiveInputIndex] = useState(0)
  const firstNameInputRef = useRef<HTMLInputElement | null>(null)
  const lastNameInputRef = useRef<HTMLInputElement | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()
  const { sendOtp, verifyOtp, updateUserProfile, isLoading } = useAuth()
  
  // Get redirect URL from query params — only allow internal paths
  const rawRedirect = searchParams.get("redirect")
  const redirectUrl = rawRedirect?.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : null
  const stepParam = searchParams.get("step")

  useEffect(() => {
    // If redirected back to complete profile, skip splash and go to basic info
    if (stepParam === "complete-profile") {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          setVerifiedUser(JSON.parse(storedUser))
        } catch { /* ignore */ }
      }
      setShowSplash(false)
      setCurrentStep(4)
      return
    }

    const timer = setTimeout(() => {
      setShowSplash(false)
      setCurrentStep(0)
    }, 500)

    return () => clearTimeout(timer)
  }, [stepParam])

  // Track if inputs should maintain focus
  const shouldMaintainFirstNameFocus = useRef(false)
  const shouldMaintainLastNameFocus = useRef(false)
  const shouldMaintainEmailFocus = useRef(false)
  
  // Maintain focus on firstName input when typing
  useEffect(() => {
    if (currentStep === 4 && firstNameInputRef.current) {
      if (shouldMaintainFirstNameFocus.current && document.activeElement !== firstNameInputRef.current) {
        firstNameInputRef.current.focus()
      }
    }
  }, [currentStep, firstName])

  // Maintain focus on lastName input when typing
  useEffect(() => {
    if (currentStep === 4 && lastNameInputRef.current) {
      if (shouldMaintainLastNameFocus.current && document.activeElement !== lastNameInputRef.current) {
        lastNameInputRef.current.focus()
      }
    }
  }, [currentStep, lastName])

  // Maintain focus on email input when typing
  useEffect(() => {
    if (currentStep === 4 && emailInputRef.current) {
      if (shouldMaintainEmailFocus.current && document.activeElement !== emailInputRef.current) {
        emailInputRef.current.focus()
      }
    }
  }, [currentStep, email])

  // Arrow key navigation between onboarding steps (only on screens without text inputs)
  useEffect(() => {
    const handleArrowNavigation = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input/textarea
      const activeEl = document.activeElement
      const isTyping =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        (activeEl as HTMLElement)?.isContentEditable

      if (isTyping) return

      // Only enable on intro slide (0) and role selection (1) - other steps use arrows for cursor/inputs
      if (currentStep < 0 || currentStep > 1) return

      if (e.key === "ArrowRight") {
        e.preventDefault()
        if (currentStep === 1) {
          // Role selection - require a role to be picked before advancing
          if (selectedRole) {
            setCurrentStep(2)
          }
        } else if (currentStep < ONBOARDING_STEPS.length - 1) {
          setCurrentStep((prev) => prev + 1)
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1)
        }
      }
    }

    window.addEventListener("keydown", handleArrowNavigation)
    return () => window.removeEventListener("keydown", handleArrowNavigation)
  }, [currentStep, selectedRole])

  // Check if user exists when phone number is entered
  const checkUserExists = async (phone: string) => {
    try {
      // Clean phone number
      const cleanedPhone = phone.replace(/^\+\d{1,4}/, "").replace(/\D/g, "")
      
      // Try to check if user exists (endpoint might not exist, so handle gracefully)
      try {
        const response = await api.get(`/auth/check-user/${cleanedPhone}`, {
          withCredentials: true,
        })
        
        if (response?.data?.exists) {
          setIsReturningUser(true)
          return true
        }
      } catch {
        // Endpoint doesn't exist or user doesn't exist - both are fine
        // We'll just proceed with normal flow
      }

      setIsReturningUser(false)
      return false
    } catch {
      // User doesn't exist, which is fine for new signups
      setIsReturningUser(false)
      return false
    }
  }

  const handleSkipIntro = () => {
    // Skip intro and go to role selection (step 1)
    setCurrentStep(1)
  }

  // Stable onChange handlers to prevent re-renders that cause focus loss
  const handleFirstNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value)
  }, [])

  const handleLastNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value)
  }, [])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handleChange = (value: string, index: number) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    const newCode = [...code];
    newCode[index] = numericValue.slice(-1);
    setCode(newCode);

    // Only move to next field if current field just got filled AND next field is empty
    if (numericValue && index < OTP_LENGTH - 1 && !newCode[index + 1]) {
      setTimeout(() => {
        setActiveInputIndex(index + 1);
        inputsRef.current[index + 1]?.focus();
      }, 50);
    }

    // Auto-verify if all 6 digits are filled
    const fullCode = newCode.join("")
    const filledDigits = newCode.filter((val) => val.length > 0).length

    // Auto-verify when all 6 digits are entered
    if (fullCode.length === OTP_LENGTH && filledDigits === OTP_LENGTH) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault()

      const newCode = [...code]

      if (code[index]) {
        // If current field has a value, delete it and move focus to previous field
        newCode[index] = ""
        setCode(newCode)
        if (index > 0) {
          setActiveInputIndex(index - 1)
          setTimeout(() => {
            inputsRef.current[index - 1]?.focus()
          }, 0)
        }
      } else if (index > 0) {
        // If current field is empty, delete from previous field and move there
        newCode[index - 1] = ""
        setCode(newCode)
        setActiveInputIndex(index - 1)
        inputsRef.current[index - 1]?.focus()
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      // Move to previous field with arrow left
      e.preventDefault()
      setActiveInputIndex(index - 1)
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      // Move to next field with arrow right
      e.preventDefault()
      setActiveInputIndex(index + 1)
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasteData = e.clipboardData.getData("text").slice(0, OTP_LENGTH).split("")
    const newCode = [...code]

    for (let i = 0; i < OTP_LENGTH; i++) {
      newCode[i] = pasteData[i] || ""
    }
    setCode(newCode)

    const nextIndex = Math.min(pasteData.length - 1, OTP_LENGTH - 1)
    setActiveInputIndex(nextIndex)
    inputsRef.current[nextIndex]?.focus()

    // Auto-verify if we have 6 digits
    if (pasteData.length === OTP_LENGTH) {
      const finalCode = pasteData.join("")
      handleVerifyOtp(finalCode)
    }

    e.preventDefault()
  }

  const handleInputFocus = (index: number) => {
    if (activeInputIndex === index) return;
    setActiveInputIndex(index);
  };

  const handleSendOtp = async () => {
    console.log("handleSendOtp called, phoneNumber:", phoneNumber)
    if (!phoneNumber || phoneNumber.length < 9) {
      console.log("Phone validation failed: length", phoneNumber?.length)
      toast.error("Please enter a valid phone number (at least 9 digits)")
      return
    }

    // Clean phone number - remove any country code and non-digits
    let cleanedPhoneNumber = phoneNumber.replace(/^\+\d{1,4}/, "").replace(/\D/g, "")

    // Remove leading 250 if present (Rwanda country code)
    if (cleanedPhoneNumber.startsWith("250")) {
      cleanedPhoneNumber = cleanedPhoneNumber.substring(3)
    }

    // Validate length (should be 9 digits for Rwanda)
    if (cleanedPhoneNumber.length !== 9) {
      toast.error("Please enter a valid 9-digit phone number")
      return
    }

    // Format phone number with country code for backend (250 + 9 digits = 12 digits)
    const formattedPhoneNumber = `250${cleanedPhoneNumber}`

    // Skip user check during development (endpoint not ready)
    // await checkUserExists(cleanedPhoneNumber)

    try {
      console.log("Sending OTP request for:", formattedPhoneNumber)
      const success = await sendOtp({ phoneNumber: formattedPhoneNumber })

      if (success) {
        // Show toast with hardcoded OTP for all users (development mode)
        toast.success(`OTP sent! Use ${HARDCODED_OTP} for verification`, { duration: 5000 })

        // Store cleaned phone number (without country code) for OTP verification
        setPhoneNumber(cleanedPhoneNumber)
        setCurrentStep(3) // Move to OTP step
        setTimeout(() => {
          inputsRef.current[0]?.focus()
        }, 500)
      }
    } catch (error: any) {
      console.error("OTP send error:", error)
      if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
        toast.error("Cannot connect to server. Is the backend running on port 3001?")
      } else {
        toast.error(error.response?.data?.message || "Failed to send OTP")
      }
    }
  }

  const handleVerifyOtp = async (otpCode: string) => {
    try {
      // Clean phone number and ensure it has country code for backend
      let cleanedPhone = phoneNumber.replace(/^\+\d{1,4}/, "").replace(/\D/g, "")

      // Remove leading 250 if present
      if (cleanedPhone.startsWith("250")) {
        cleanedPhone = cleanedPhone.substring(3)
      }

      // Format with country code for backend (250 + 9 digits)
      const formattedPhone = cleanedPhone.length === 9 ? `250${cleanedPhone}` : cleanedPhone

      // Verify OTP
      const user = await verifyOtp({ phoneNumber: formattedPhone, otp: otpCode });

      if (!user) {
        // Hook already showed a toast — just clear the OTP inputs for retry
        setCode(Array(OTP_LENGTH).fill(""));
        setActiveInputIndex(0);
        setTimeout(() => inputsRef.current[0]?.focus(), 50);
        return;
      }

      if (user) {
        console.log("OTP verification successful, user:", user)
        // Store verified user data
        setVerifiedUser(user);

        // If user has firstName, go to home or redirect URL. Otherwise, collect basic info
        if (user.firstName && user.firstName.trim() !== "") {
          document.cookie = "profileComplete=true; path=/; max-age=31536000";
          // Redirect to intended URL if available, otherwise check for tutorial
          if (redirectUrl) {
            router.push(redirectUrl);
          } else {
            // Check if this is first login to show tutorial
            const isFirstLogin = !localStorage.getItem("hasSeenTutorial");
            if (isFirstLogin) {
              localStorage.setItem("hasSeenTutorial", "true");
              router.push("/?tutorial=true");
            } else {
              router.push("/");
            }
          }
        } else {
          // Move to basic info step
          setCurrentStep(4);
        }
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      const raw = error?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw[0] : raw;
      toast.error(msg || "Invalid OTP. Please try again.");
      // Clear the OTP inputs so the user can retry without manually deleting
      setCode(Array(OTP_LENGTH).fill(""));
      setActiveInputIndex(0);
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    }
  };

  const handleSaveBasicInfo = async () => {
    if (!firstName.trim()) {
      toast.error("Please enter your name")
      return
    }

    if (!selectedRole) {
      toast.error("Role not selected. Please go back and select a role.")
      return
    }

    if (!verifiedUser) {
      toast.error("User verification required. Please go back and verify OTP.")
      return
    }

    try {
      // Prepare profile update payload
      const updatePayload: any = {
        firstName: firstName.trim(),
      }

      // Add lastName if provided
      if (lastName.trim()) {
        updatePayload.lastName = lastName.trim()
      }

      // Add email if provided
      if (email.trim() && /\S+@\S+\.\S+/.test(email.trim())) {
        updatePayload.email = email.trim()
      }

      // Update user profile
      const profileResponse = await api.patch("/users/profile", updatePayload, {
        withCredentials: true,
      })

      if (profileResponse.data) {
        const updatedUserData = profileResponse.data.data || profileResponse.data

        // Select the role (add to user's roles array)
        await api.post(
          "/users/role-selection",
          { role: selectedRole },
          { withCredentials: true }
        )

        // Update local user state
        const updatedUser = {
          ...verifiedUser,
          firstName: firstName.trim(),
          lastName: lastName.trim() || updatedUserData.lastName || verifiedUser.lastName,
          username: updatedUserData.username || verifiedUser.username,
          email: email.trim() || verifiedUser.email || updatedUserData.email,
          phoneNumber: verifiedUser.phoneNumber,
          roles: [selectedRole],
        }

        // Update Redux store
        dispatch(updateUser(updatedUser))

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(updatedUser))
        }

        // Branch based on role
        if (selectedRole === "EMPLOYER") {
          // Employers: Complete onboarding and redirect to home
          await api.patch(
            "/users/complete-onboarding",
            { role: "EMPLOYER" },
            { withCredentials: true }
          )

          document.cookie = "profileComplete=true; path=/; max-age=31536000"
          toast.success("Welcome! Let's get started.")

          if (redirectUrl) {
            router.push(redirectUrl)
          } else {
            const isFirstLogin = !localStorage.getItem("hasSeenTutorial")
            if (isFirstLogin) {
              localStorage.setItem("hasSeenTutorial", "true")
              router.push("/?tutorial=true")
            } else {
              router.push("/")
            }
          }
        } else {
          // Workers: Continue to document upload step (step 5)
          setCurrentStep(5)
        }
      }
    } catch (error: any) {
      console.error("Error saving basic info:", error)
      toast.error(error.response?.data?.message || "Failed to save information. Please try again.")
    }
  }

  const handleDocumentUpload = (document: any) => {
    setUploadedDocument(document)
    // Move to next step (service categories for workers - step 6)
    setCurrentStep(6)
  }

  const handleCategoriesSelected = async (categories: string[]) => {
    setSelectedCategories(categories)
    try {
      // Call complete-onboarding endpoint
      await api.patch(
        "/users/complete-onboarding",
        { role: "WORKER" },
        { withCredentials: true }
      )

      toast.success("Welcome! You're all set.")

      // Set profile complete and redirect
      document.cookie = "profileComplete=true; path=/; max-age=31536000"
      if (typeof window !== "undefined") {
        localStorage.setItem("hasSeenTutorial", "true")
      }

      router.push("/?tutorial=true")
    } catch (error: any) {
      console.error("Error completing onboarding:", error)
      toast.error("Failed to complete setup. Please try again.")
    }
  }

  const handleNext = async () => {
    console.log("handleNext called, currentStep:", currentStep, "selectedRole:", selectedRole)
    // User role selection step (step 1)
    if (currentStep === 1) {
      if (!selectedRole) {
        console.log("Role not selected")
        toast.error("Please select a role")
        return
      }
      console.log("Setting currentStep to 2")
      setCurrentStep(2) // Move to phone number entry
      return
    }

    // Phone number entry step (step 2)
    if (currentStep === 2) {
      await handleSendOtp()
      return
    }

    // OTP verification step (step 3)
    if (currentStep === 3) {
      const otpCode = code.join("")
      if (otpCode.length === OTP_LENGTH) {
        await handleVerifyOtp(otpCode)
      } else {
        toast.error(`Please enter the complete ${OTP_LENGTH}-digit verification code`)
      }
      return
    }

    // Basic info step (step 4)
    if (currentStep === 4) {
      await handleSaveBasicInfo()
      return
    }

    // Document upload (step 5) and categories (step 6) are handled by their own components

    // Regular next step
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep === 3) {
      // Going back from OTP step
      setCurrentStep(2)
      setCode(Array(OTP_LENGTH).fill(""))
      setActiveInputIndex(0)
    } else if (currentStep === 4) {
      // Going back from basic info step to OTP
      setCurrentStep(3)
      setCode(Array(OTP_LENGTH).fill(""))
      setActiveInputIndex(0)
    } else if (currentStep === 5) {
      // Going back from document step
      setCurrentStep(4)
    } else if (currentStep === 6) {
      // Going back from categories step
      setCurrentStep(5)
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const getButtonText = () => {
    if (currentStep === 1) return "Continue"
    if (currentStep === 2) return "Send OTP"
    if (currentStep === 3) return "Verify"
    if (currentStep === 4) return "Continue"
    if (currentStep === 5 || currentStep === 6) return "" // These have their own buttons
    return ONBOARDING_STEPS[currentStep]?.buttonText || "Next"
  }

  const renderStep = () => {
    const currentStepData = ONBOARDING_STEPS[currentStep]
    const stepNumber = currentStep
    const imageWrapper = "p-5 bg-[#F1FCEF] rounded-full"
    const imageStyle = "w-[160px] h-[160px] sm:w-[250px] sm:h-[250px] object-cover rounded-full"

    const renderImage = () => (
      <div className={imageWrapper}>
        <Image
          height={400}
          width={400}
          src={currentStepData.image || "/placeholder.svg"}
          alt={`Onboarding step ${stepNumber + 1}`}
          className={imageStyle}
        />
      </div>
    )

    switch (stepNumber) {
      case 0:
        return (
          <div>
            <div className="absolute -right-20 -top-52 sm:-right-[130px] sm:-top-56 flex">
              <LeftFlowerIcon className="w-16 h-auto sm:w-auto sm:h-auto" />
              {renderImage()}
            </div>
            <div className="mb-4 sm:mb-8">
              <div className={`${currentStepData.textColor} text-3xl font-serif`}>
                <GreenAppIcon className="w-12 h-14 sm:w-16 sm:h-20" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-6 sm:mb-8 max-w-[280px]">
              {currentStepData.title}
            </h1>
          </div>
        )
      case 1:
        // Role selection
        return (
          <div className="h-full flex flex-col items-center justify-center gap-6 sm:gap-8">
            <div className="text-center mb-4">
              <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-2">
                {currentStepData.title}
              </h1>
              {currentStepData.subtitle && (
                <p className="text-base sm:text-lg text-gray-600">
                  {currentStepData.subtitle}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md">
              <button
                onClick={() => setSelectedRole("EMPLOYER")}
                className={`flex-1 p-6 rounded-xl border-2 transition-all ${
                  selectedRole === "EMPLOYER"
                    ? "bg-[#145B10] text-white border-[#145B10]"
                    : "bg-white text-gray-700 border-gray-300 hover:border-[#145B10]"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    selectedRole === "EMPLOYER" ? "bg-white/20" : "bg-[#F1FCEF]"
                  }`}>
                    <User className={`w-8 h-8 ${
                      selectedRole === "EMPLOYER" ? "text-white" : "text-[#145B10]"
                    }`} />
                  </div>
                  <h3 className="font-bold text-lg">I want to hire</h3>
                  <p className="text-sm text-center">
                    Find workers
                  </p>
                </div>
              </button>
              <button
                onClick={() => setSelectedRole("WORKER")}
                className={`flex-1 p-6 rounded-xl border-2 transition-all ${
                  selectedRole === "WORKER"
                    ? "bg-[#145B10] text-white border-[#145B10]"
                    : "bg-white text-gray-700 border-gray-300 hover:border-[#145B10]"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    selectedRole === "WORKER" ? "bg-white/20" : "bg-[#F1FCEF]"
                  }`}>
                    <Briefcase className={`w-8 h-8 ${
                      selectedRole === "WORKER" ? "text-white" : "text-[#145B10]"
                    }`} />
                  </div>
                  <h3 className="font-bold text-lg">I want to work</h3>
                  <p className="text-sm text-center">
                    Offer services
                  </p>
                </div>
              </button>
            </div>
          </div>
        )
      case 2:
        // Phone number entry
        return (
          <div>
            <div className="mb-2">
              <div className={`${currentStepData.textColor} flex items-center justify-center text-4xl font-serif`}>
                <GreenAppIcon className="w-12 h-14 sm:w-16 sm:h-20" />
              </div>
            </div>
            <div className={`${imageWrapper} flex items-center justify-between w-max mx-auto mb-6 sm:mb-10`}>
              <Image
                height={400}
                width={400}
                src={currentStepData.image || "/placeholder.svg"}
                alt={`Onboarding step ${stepNumber + 1}`}
                className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] object-cover rounded-full"
              />
            </div>
            <div className="flex items-center border border-black rounded-xl overflow-hidden w-full">
              <div className="flex items-center gap-2 pl-3 pr-5 py-3 sm:py-4 border-r border-black">
                <Image
                  height={40}
                  width={40}
                  src="https://flagcdn.com/w40/rw.png"
                  alt="Rwanda Flag"
                  className="w-6 h-4 object-cover rounded-sm"
                />
                <span className="text-[#212121] font-semibold text-sm">+250</span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => {
                  try {
                    const value = e.target.value.replace(/\D/g, "")
                    setPhoneNumber(value)
                  } catch (error) {
                    console.error("Error handling phone input:", error)
                  }
                }}
                onKeyDown={(e) => {
                  try {
                    if (e.key === "Enter" && phoneNumber.length >= 9) {
                      handleSendOtp()
                    }
                  } catch (error) {
                    console.error("Error on keydown:", error)
                  }
                }}
                className="px-4 py-3 sm:py-4 w-full text-[#212121] font-semibold placeholder:text-[#212121] placeholder:font-semibold placeholder:text-sm 
                    border-none focus:outline-none focus:ring-0 focus:border-transparent 
                    active:outline-none active:ring-0 active:border-transparent shadow-none"
                autoFocus
                maxLength={9}
              />
            </div>
            {isReturningUser && (
              <p className="text-sm text-[#145B10] mt-2 text-center">
                Welcome back! Enter the OTP to continue.
              </p>
            )}
          </div>
        )
      case 3:
        // OTP verification
        return (
          <div className="relative w-full">
            <button
              onClick={handleBack}
              className="absolute -top-60 sm:-top-80 left-0 p-2 text-[#1B5E20] font-semibold flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </button>
            <div className="flex flex-col items-center gap-10 sm:gap-20 pt-12">
              <span className="flex flex-col items-center gap-2 mb-6 sm:mb-8">
                <h2 className="font-bold text-2xl sm:text-3xl text-[#212121]">Enter Verification Code</h2>
                <p className="text-sm font-bold text-center text-[#212121] max-w-[300px]">
                  Enter the {OTP_LENGTH}-digit verification code
                </p>
                <p className="text-xs text-[#145B10] mt-2 font-semibold">
                  Development: Use {HARDCODED_OTP} to verify (SMS service not configured yet)
                </p>
              </span>
              <div className="relative">
                <input
                  ref={(el) => {
                    inputsRef.current[0] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={OTP_LENGTH}
                  value={code.join("")}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH)
                    const newCode = Array(OTP_LENGTH).fill("")
                    for (let i = 0; i < value.length; i++) {
                      newCode[i] = value[i]
                    }
                    setCode(newCode)
                    setActiveInputIndex(Math.min(value.length, OTP_LENGTH - 1))

                    if (value.length === OTP_LENGTH) {
                      handleVerifyOtp(value)
                    }
                  }}
                  autoFocus
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  aria-label="Verification code"
                />
                <div className="flex gap-1 sm:gap-2 pointer-events-none">
                  {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                    const isFilled = !!code[index]
                    const isActive = index === code.findIndex(d => !d) || (index === OTP_LENGTH - 1 && code.every(d => d))
                    return (
                      <div
                        key={index}
                        className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg font-medium border rounded-md ${
                          isActive ? "border-[#145B10] border-2 ring-2 ring-[#145B10]/20" : "border-black"
                        } ${isFilled ? "bg-white" : "bg-white"}`}
                      >
                        {code[index] || ""}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      case 4:
        // Basic info collection
        return (
          <div className="relative w-full">
            <button
              onClick={() => setCurrentStep(3)}
              className="absolute -top-60 sm:-top-80 left-0 p-2 text-[#1B5E20] font-semibold flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </button>
            <div className="flex flex-col items-center gap-6 sm:gap-8 pt-12">
              <div className="text-center mb-4">
                <h2 className="font-bold text-2xl sm:text-3xl text-[#212121] mb-2">
                  {currentStepData.title}
                </h2>
                {currentStepData.subtitle && (
                  <p className="text-sm text-gray-600">
                    {currentStepData.subtitle}
                  </p>
                )}
              </div>
              
              <div className="w-full max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    ref={firstNameInputRef}
                    type="text"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={handleFirstNameChange}
                    onFocus={() => {
                      shouldMaintainFirstNameFocus.current = true
                    }}
                    onBlur={() => {
                      // Don't clear the flag immediately - allow for re-focus
                      setTimeout(() => {
                        if (document.activeElement !== firstNameInputRef.current) {
                          shouldMaintainFirstNameFocus.current = false
                        }
                      }, 100)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && firstName.trim()) {
                        e.preventDefault()
                        shouldMaintainFirstNameFocus.current = false
                        shouldMaintainLastNameFocus.current = true
                        lastNameInputRef.current?.focus()
                      }
                    }}
                    autoFocus={currentStep === 4 && !firstName}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name (Optional)
                  </label>
                  <Input
                    ref={lastNameInputRef}
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={handleLastNameChange}
                    onFocus={() => {
                      shouldMaintainLastNameFocus.current = true
                    }}
                    onBlur={() => {
                      // Don't clear the flag immediately - allow for re-focus
                      setTimeout(() => {
                        if (document.activeElement !== lastNameInputRef.current) {
                          shouldMaintainLastNameFocus.current = false
                        }
                      }, 100)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        shouldMaintainLastNameFocus.current = false
                        shouldMaintainEmailFocus.current = true
                        emailInputRef.current?.focus()
                      }
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <Input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={handleEmailChange}
                    onFocus={() => {
                      shouldMaintainEmailFocus.current = true
                    }}
                    onBlur={() => {
                      // Don't clear the flag immediately - allow for re-focus
                      setTimeout(() => {
                        if (document.activeElement !== emailInputRef.current) {
                          shouldMaintainEmailFocus.current = false
                        }
                      }, 100)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && firstName.trim()) {
                        e.preventDefault()
                        shouldMaintainEmailFocus.current = false
                        handleSaveBasicInfo()
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can add this later in your profile
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      case 5:
        // Document upload - Worker only
        return (
          <div className="w-full flex flex-col items-center">
            <DocumentUploadStep
              onUploadSuccess={handleDocumentUpload}
              onCancel={handleBack}
              isLoading={isLoading}
            />
          </div>
        )
      case 6:
        // Service category selection - Worker only
        return (
          <div className="w-full flex flex-col items-center">
            <ServiceCategorySelector
              onContinue={handleCategoriesSelected}
              onBack={handleBack}
              isLoading={isLoading}
            />
          </div>
        )
      default:
        return null
    }
  }

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

  const introSteps = [0] // Only the first intro slide shows Skip button
  const canSkip = introSteps.includes(currentStep)
  const componentSteps = [5, 6] // Steps with their own components/buttons (document upload and service categories)

  return (
    <div className="relative h-screen overflow-hidden bg-white max-w-md mx-auto">
      {/* Skip button for intro steps */}
      {canSkip && (
        <button
          onClick={handleSkipIntro}
          className="absolute top-6 right-4 sm:top-8 sm:right-8 z-50 flex items-center gap-2 text-[#1B5E20] font-semibold text-sm hover:text-[#145B10] transition-colors"
        >
          <span>Skip</span>
          <X className="w-4 h-4" />
        </button>
      )}

      {componentSteps.includes(currentStep) ? (
        // Steps 8 & 9: Components with their own buttons
        <div className="absolute bottom-32 w-full h-full px-4 sm:px-6 flex flex-col justify-center items-center">
          <div className="flex flex-col absolute bottom-0 space-y-8 sm:space-y-[56px] w-full px-4 sm:px-6">
            {renderStep()}
          </div>
        </div>
      ) : currentStep === 4 ? (
        // Step 4 (basic info): Render without animation
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
                className="w-full bg-[#1B5E20] text-[#ffffff] py-4 sm:py-[20px] rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#145B10] transition-colors"
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
                  className="w-full bg-[#1B5E20] text-[#ffffff] py-4 sm:py-[20px] rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#145B10] transition-colors"
                  disabled={
                    isLoading ||
                    (currentStep === 3 && code.join("").length < OTP_LENGTH) ||
                    (currentStep === 1 && !selectedRole) ||
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
      <div className="absolute w-full bottom-0 flex justify-center space-x-2 pb-8 sm:pb-12">
        {ONBOARDING_STEPS.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full ${index === currentStep ? "bg-[#1B5E20] w-6 sm:w-8 transition-all duration-300" : "bg-[#E0E0E0] w-2"}`}
          />
        ))}
      </div>
    </div>
  )
}

export default OnboardingPage

