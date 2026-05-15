"use client"

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store"
import { updateUser } from "@/store/slices/auth-slice"
import api from "@/lib/axios"
import { toast } from "react-hot-toast"
import type { AuthResponse } from "@/services/auth-service"

const OTP_LENGTH = 6

type UserData = AuthResponse["data"]["user"] | null
interface DocumentData {
  id: string
  url: string
  type: string
  [key: string]: unknown
}

interface OnboardingContextType {
  // Step navigation
  currentStep: number
  setCurrentStep: (step: number) => void
  showSplash: boolean
  setShowSplash: (show: boolean) => void

  // Phone & OTP
  phoneNumber: string
  setPhoneNumber: (phone: string) => void
  code: string[]
  setCode: (code: string[]) => void
  activeInputIndex: number
  setActiveInputIndex: (index: number) => void

  // Form data
  firstName: string
  setFirstName: (name: string) => void
  lastName: string
  setLastName: (name: string) => void
  email: string
  setEmail: (email: string) => void
  selectedRole: "EMPLOYER" | "WORKER" | null
  setSelectedRole: (role: "EMPLOYER" | "WORKER" | null) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void

  // Verified user data
  verifiedUser: UserData
  setVerifiedUser: (user: UserData) => void
  uploadedDocument: DocumentData | null
  setUploadedDocument: (doc: DocumentData | null) => void

  // UI state
  isReturningUser: boolean
  setIsReturningUser: (returning: boolean) => void
  isLoading: boolean

  // Handlers
  handleSendOtp: () => Promise<void>
  handleVerifyOtp: (otpCode: string) => Promise<void>
  handleSaveBasicInfo: () => Promise<void>
  handleDocumentUpload: (document: DocumentData) => void
  handleCategoriesSelected: (categories: string[]) => Promise<void>
  handleNext: () => Promise<void>
  handleBack: () => void
  handleSkipIntro: () => void

  // Refs
  inputsRef: React.MutableRefObject<Array<HTMLInputElement | null>>
  firstNameInputRef: React.MutableRefObject<HTMLInputElement | null>
  lastNameInputRef: React.MutableRefObject<HTMLInputElement | null>
  emailInputRef: React.MutableRefObject<HTMLInputElement | null>

  // Callbacks for form
  handleFirstNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleLastNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleOtpChange: (value: string, index: number) => void
  handleOtpKeyDown: (e: React.KeyboardEvent, index: number) => void
  handleOtpPaste: (e: React.ClipboardEvent) => void
  handlePhoneChange: (value: string) => void
  handleOtpInputFocus: (index: number) => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const [currentStep, setCurrentStep] = useState(-1)
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedRole, setSelectedRole] = useState<"EMPLOYER" | "WORKER" | null>(null)
  const [isReturningUser, setIsReturningUser] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [verifiedUser, setVerifiedUser] = useState<UserData>(null)
  const [uploadedDocument, setUploadedDocument] = useState<DocumentData | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [activeInputIndex, setActiveInputIndex] = useState(0)

  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()
  const { sendOtp, verifyOtp, updateUserProfile, isLoading, user: authUser } = useAuth()

  const inputsRef = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null))
  const firstNameInputRef = useRef<HTMLInputElement | null>(null)
  const lastNameInputRef = useRef<HTMLInputElement | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)

  const rawRedirect = searchParams.get("redirect")
  const redirectUrl = rawRedirect?.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : null

  // Form input handlers
  const handleFirstNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value)
  }, [])

  const handleLastNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value)
  }, [])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handlePhoneChange = useCallback((value: string) => {
    setPhoneNumber(value.replace(/\D/g, ""))
  }, [])

  // OTP handlers
  const handleOtpChange = useCallback((value: string, index: number) => {
    const numericValue = value.replace(/[^0-9]/g, "")
    const newCode = [...code]
    newCode[index] = numericValue.slice(-1)
    setCode(newCode)

    if (numericValue && index < OTP_LENGTH - 1 && !newCode[index + 1]) {
      setTimeout(() => {
        setActiveInputIndex(index + 1)
        inputsRef.current[index + 1]?.focus()
      }, 50)
    }

    const fullCode = newCode.join("")
    const filledDigits = newCode.filter((val) => val.length > 0).length

    if (fullCode.length === OTP_LENGTH && filledDigits === OTP_LENGTH) {
      handleVerifyOtp(fullCode)
    }
  }, [code])

  const handleOtpKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault()
      const newCode = [...code]

      if (code[index]) {
        newCode[index] = ""
        setCode(newCode)
        if (index > 0) {
          setActiveInputIndex(index - 1)
          setTimeout(() => {
            inputsRef.current[index - 1]?.focus()
          }, 0)
        }
      } else if (index > 0) {
        newCode[index - 1] = ""
        setCode(newCode)
        setActiveInputIndex(index - 1)
        inputsRef.current[index - 1]?.focus()
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      setActiveInputIndex(index - 1)
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault()
      setActiveInputIndex(index + 1)
      inputsRef.current[index + 1]?.focus()
    }
  }, [code])

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    const pasteData = e.clipboardData.getData("text").slice(0, OTP_LENGTH).split("")
    const newCode = [...code]

    for (let i = 0; i < OTP_LENGTH; i++) {
      newCode[i] = pasteData[i] || ""
    }
    setCode(newCode)

    const nextIndex = Math.min(pasteData.length - 1, OTP_LENGTH - 1)
    setActiveInputIndex(nextIndex)
    inputsRef.current[nextIndex]?.focus()

    if (pasteData.length === OTP_LENGTH) {
      const finalCode = pasteData.join("")
      handleVerifyOtp(finalCode)
    }

    e.preventDefault()
  }, [code])

  const handleOtpInputFocus = useCallback((index: number) => {
    if (activeInputIndex === index) return
    setActiveInputIndex(index)
  }, [activeInputIndex])

  // Business logic handlers
  const handleSendOtp = useCallback(async () => {
    if (!phoneNumber) {
      toast.error("Please enter a phone number")
      return
    }

    let cleanedPhoneNumber = phoneNumber.replace(/^\+\d{1,4}/, "").replace(/\D/g, "")

    if (cleanedPhoneNumber.startsWith("250")) {
      cleanedPhoneNumber = cleanedPhoneNumber.substring(3)
    }

    if (cleanedPhoneNumber.length === 10 && cleanedPhoneNumber.startsWith("0")) {
      cleanedPhoneNumber = cleanedPhoneNumber.substring(1)
    }

    if (cleanedPhoneNumber.length !== 9) {
      toast.error("Please enter a valid phone number: 9 digits or 10 digits starting with 0")
      return
    }

    const formattedPhoneNumber = `250${cleanedPhoneNumber}`

    const proceedToOtpStep = () => {
      setPhoneNumber(cleanedPhoneNumber)
      setCurrentStep(3)
      setTimeout(() => {
        inputsRef.current[0]?.focus()
      }, 500)
    }

    try {
      const success = await sendOtp({ phoneNumber: formattedPhoneNumber })

      if (success) {
        proceedToOtpStep()
        return
      }

      // sendOtp returned false (auth hook swallowed the error). In dev mode,
      // assume backend is offline and proceed with mock OTP flow.
      if (process.env.NODE_ENV === "development") {
        toast.success("Backend offline — use 111111 to verify (dev mode)")
        proceedToOtpStep()
        return
      }

      toast.error("Failed to send OTP. Please try again.")
    } catch (error) {
      const err = error as Error & { code?: string; response?: { data?: { message?: string } } }
      const isNetworkError = err.code === "ERR_NETWORK" || err.message?.includes("Network Error")

      if (isNetworkError && process.env.NODE_ENV === "development") {
        toast.success("Backend offline — use 111111 to verify (dev mode)")
        proceedToOtpStep()
        return
      }

      if (isNetworkError) {
        toast.error("Cannot connect to server. Is the backend running on port 3001?")
      } else {
        toast.error(err.response?.data?.message || "Failed to send OTP")
      }
    }
  }, [phoneNumber, sendOtp])

  const handleVerifyOtp = useCallback(async (otpCode: string) => {
    try {
      let cleanedPhone = phoneNumber.replace(/^\+\d{1,4}/, "").replace(/\D/g, "")

      if (cleanedPhone.startsWith("250")) {
        cleanedPhone = cleanedPhone.substring(3)
      }

      const formattedPhone = cleanedPhone.length === 9 ? `250${cleanedPhone}` : cleanedPhone

      const user = await verifyOtp({ phoneNumber: formattedPhone, otp: otpCode })

      if (!user) {
        // verifyOtp returned false. In dev mode, accept "111111" as a test OTP
        // so the rest of the flow can be tested without a backend.
        if (process.env.NODE_ENV === "development" && otpCode === "111111") {
          toast.success("OTP verified (dev mode)")
          // Create mock verified user for dev mode testing
          const mockVerifiedUser = {
            id: "dev-user-id",
            phoneNumber: formattedPhone,
            firstName: "",
            lastName: "",
            email: "",
            username: `devuser${Date.now()}`,
            isMobileVerified: true,
            isEmailVerified: false,
            roles: [],
            profilePicture: null,
          }
          setVerifiedUser(mockVerifiedUser)
          setCurrentStep(4)
          return
        }
        setCode(Array(OTP_LENGTH).fill(""))
        setActiveInputIndex(0)
        setTimeout(() => inputsRef.current[0]?.focus(), 50)
        return
      }

      setVerifiedUser(user)

      if (user.firstName && user.firstName.trim() !== "") {
        document.cookie = "profileComplete=true; path=/; max-age=31536000"
        if (redirectUrl) {
          window.location.href = redirectUrl
        } else {
          const isFirstLogin = !localStorage.getItem("hasSeenTutorial")
          if (isFirstLogin) {
            localStorage.setItem("hasSeenTutorial", "true")
            window.location.href = "/?tutorial=true"
          } else {
            window.location.href = "/"
          }
        }
      } else {
        setCurrentStep(4)
      }
    } catch (error: any) {
      const isNetworkError =
        error?.code === "ERR_NETWORK" || error?.message?.includes("Network Error")

      if (isNetworkError && process.env.NODE_ENV === "development" && otpCode === "111111") {
        toast.success("OTP verified (dev mode)")
        // Create mock verified user for dev mode testing
        const mockVerifiedUser = {
          id: "dev-user-id",
          phoneNumber,
          firstName: "",
          lastName: "",
          email: "",
          username: `devuser${Date.now()}`,
          isMobileVerified: true,
          isEmailVerified: false,
          roles: [],
          profilePicture: null,
        }
        setVerifiedUser(mockVerifiedUser)
        setCurrentStep(4)
        return
      }

      const raw = error?.response?.data?.message
      const msg = Array.isArray(raw) ? raw[0] : raw
      toast.error(msg || "Invalid OTP. Please try again.")
      setCode(Array(OTP_LENGTH).fill(""))
      setActiveInputIndex(0)
      setTimeout(() => inputsRef.current[0]?.focus(), 50)
    }
  }, [phoneNumber, verifyOtp, redirectUrl, router])

  const handleSaveBasicInfo = useCallback(async () => {
    if (!firstName.trim()) {
      toast.error("Please enter your name")
      return
    }

    if (!selectedRole) {
      toast.error("Role not selected. Please go back and select a role.")
      return
    }

    // Check verification status from context or Redux
    const isVerified = verifiedUser?.isMobileVerified || authUser?.isMobileVerified

    if (!isVerified) {
      toast.error("Phone verification required. Please complete OTP verification.")
      return
    }

    try {
      interface UpdateProfilePayload {
        firstName: string
        lastName?: string
        email?: string
      }

      const updatePayload: UpdateProfilePayload = {
        firstName: firstName.trim(),
      }

      if (lastName.trim()) {
        updatePayload.lastName = lastName.trim()
      }

      if (email.trim() && /\S+@\S+\.\S+/.test(email.trim())) {
        updatePayload.email = email.trim()
      }

      interface ProfileResponse {
        data: {
          lastName?: string
          username?: string
          email?: string
        }
      }

      const profileResponse = await api.patch<ProfileResponse>("/users/profile", updatePayload, {
        withCredentials: true,
      })

      if (profileResponse.data) {
        const updatedUserData = profileResponse.data.data || profileResponse.data

        await api.post(
          "/users/role-selection",
          { role: selectedRole },
          { withCredentials: true }
        )

        const updatedUser = {
          ...verifiedUser,
          firstName: firstName.trim(),
          lastName: lastName.trim() || updatedUserData.lastName || verifiedUser.lastName,
          username: updatedUserData.username || verifiedUser.username,
          email: email.trim() || verifiedUser.email || updatedUserData.email,
          phoneNumber: verifiedUser.phoneNumber,
          roles: [selectedRole],
        }

        dispatch(updateUser(updatedUser))

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(updatedUser))
        }

        if (selectedRole === "EMPLOYER") {
          await api.patch(
            "/users/complete-onboarding",
            { role: "EMPLOYER" },
            { withCredentials: true }
          )

          document.cookie = "profileComplete=true; path=/; max-age=31536000"
          toast.success("Welcome! Let's get started.")

          if (redirectUrl) {
            window.location.href = redirectUrl
          } else {
            const isFirstLogin = !localStorage.getItem("hasSeenTutorial")
            if (isFirstLogin) {
              localStorage.setItem("hasSeenTutorial", "true")
              window.location.href = "/?tutorial=true"
            } else {
              window.location.href = "/"
            }
          }
        } else {
          setCurrentStep(5)
        }
      }
    } catch (error) {
      const err = error as Error & { response?: { status?: number; data?: { message?: string | string[] } } }
      const status = err.response?.status
      const raw = err.response?.data?.message
      const msg = Array.isArray(raw) ? raw[0] : raw

      if (status === 401) {
        toast.error("Session expired. Please verify your phone number again.")
        setCurrentStep(2)
        return
      }

      toast.error(msg || "Failed to save information. Please try again.")
    }
  }, [firstName, lastName, email, selectedRole, verifiedUser, authUser, dispatch, redirectUrl, router])

  const handleDocumentUpload = useCallback((document: DocumentData) => {
    setUploadedDocument(document)
    setCurrentStep(6)
  }, [])

  const handleCategoriesSelected = useCallback(async (categories: string[]) => {
    setSelectedCategories(categories)
    try {
      await api.patch(
        "/users/complete-onboarding",
        { role: "WORKER" },
        { withCredentials: true }
      )

      toast.success("Welcome! You're all set.")

      document.cookie = "profileComplete=true; path=/; max-age=31536000"
      if (typeof window !== "undefined") {
        localStorage.setItem("hasSeenTutorial", "true")
      }

      window.location.href = "/?tutorial=true"
    } catch (error: any) {
      toast.error("Failed to complete setup. Please try again.")
    }
  }, [router])

  const handleNext = useCallback(async () => {
    if (currentStep === 1) {
      if (!selectedRole) {
        toast.error("Please select a role")
        return
      }
      setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      await handleSendOtp()
      return
    }

    if (currentStep === 3) {
      const otpCode = code.join("")
      if (otpCode.length === OTP_LENGTH) {
        await handleVerifyOtp(otpCode)
      } else {
        toast.error(`Please enter the complete ${OTP_LENGTH}-digit verification code`)
      }
      return
    }

    if (currentStep === 4) {
      await handleSaveBasicInfo()
      return
    }

    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1)
    }
  }, [currentStep, selectedRole, code, handleSendOtp, handleVerifyOtp, handleSaveBasicInfo])

  const handleBack = useCallback(() => {
    if (currentStep === 3) {
      setCurrentStep(2)
      setCode(Array(OTP_LENGTH).fill(""))
      setActiveInputIndex(0)
    } else if (currentStep === 4) {
      setCurrentStep(3)
      setCode(Array(OTP_LENGTH).fill(""))
      setActiveInputIndex(0)
    } else if (currentStep === 5) {
      setCurrentStep(4)
    } else if (currentStep === 6) {
      setCurrentStep(5)
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const handleSkipIntro = useCallback(() => {
    setCurrentStep(1)
  }, [])

  const value: OnboardingContextType = {
    currentStep,
    setCurrentStep,
    showSplash,
    setShowSplash,
    phoneNumber,
    setPhoneNumber,
    code,
    setCode,
    activeInputIndex,
    setActiveInputIndex,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    selectedRole,
    setSelectedRole,
    selectedCategories,
    setSelectedCategories,
    verifiedUser,
    setVerifiedUser,
    uploadedDocument,
    setUploadedDocument,
    isReturningUser,
    setIsReturningUser,
    isLoading,
    handleSendOtp,
    handleVerifyOtp,
    handleSaveBasicInfo,
    handleDocumentUpload,
    handleCategoriesSelected,
    handleNext,
    handleBack,
    handleSkipIntro,
    inputsRef,
    firstNameInputRef,
    lastNameInputRef,
    emailInputRef,
    handleFirstNameChange,
    handleLastNameChange,
    handleEmailChange,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handlePhoneChange,
    handleOtpInputFocus,
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider")
  }
  return context
}
