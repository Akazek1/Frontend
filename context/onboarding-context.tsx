"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store"
import { updateUser, setSession } from "@/store/slices/auth-slice"
import api from "@/lib/axios"
import { toast } from "react-hot-toast"
import type { AuthResponse, UserRole } from "@/services/auth-service"

const OTP_LENGTH = 6

type UserData = AuthResponse["data"]["user"] | null
interface DocumentData {
  id: string
  url: string
  type: string
  [key: string]: unknown
}

// Step layout:
// 0 = RoleSelection
// 1 = BasicInfoForm (name + email — collected BEFORE phone)
// 2 = PhoneNumberEntry + T&C checkbox
// 3 = OTPVerification
// 4 = DocumentUploadStep (workers only)
// 5 = ServiceCategorySelector (workers only)

interface OnboardingContextType {
  currentStep: number
  setCurrentStep: (step: number) => void
  showSplash: boolean
  setShowSplash: (show: boolean) => void

  phoneNumber: string
  setPhoneNumber: (phone: string) => void
  code: string[]
  setCode: (code: string[]) => void
  activeInputIndex: number
  setActiveInputIndex: (index: number) => void

  firstName: string
  setFirstName: (name: string) => void
  lastName: string
  setLastName: (name: string) => void
  email: string
  setEmail: (email: string) => void
  selectedRoles: ("EMPLOYER" | "WORKER")[]
  setSelectedRoles: (roles: ("EMPLOYER" | "WORKER")[]) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void

  termsAccepted: boolean
  setTermsAccepted: (v: boolean) => void

  verifiedUser: UserData
  setVerifiedUser: (user: UserData) => void
  uploadedDocument: DocumentData | null
  setUploadedDocument: (doc: DocumentData | null) => void

  isReturningUser: boolean
  setIsReturningUser: (returning: boolean) => void
  isLoading: boolean
  resendCooldown: number

  handleSendOtp: () => Promise<boolean>
  handleVerifyOtp: (otpCode: string) => Promise<void>
  handleSaveBasicInfo: () => Promise<void>
  handleDocumentUpload: (document: DocumentData) => void
  handleCategoriesSelected: (categories: string[]) => Promise<void>
  handleNext: () => Promise<void>
  handleBack: () => void
  handleResendOtp: () => Promise<void>

  inputsRef: React.MutableRefObject<Array<HTMLInputElement | null>>
  firstNameInputRef: React.MutableRefObject<HTMLInputElement | null>
  lastNameInputRef: React.MutableRefObject<HTMLInputElement | null>
  emailInputRef: React.MutableRefObject<HTMLInputElement | null>

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

const isValidEmail = (v: string) => /\S+@\S+\.\S+/.test(v)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const [currentStep, setCurrentStep] = useState(-1)
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedRoles, setSelectedRoles] = useState<("EMPLOYER" | "WORKER")[]>([])
  const [isReturningUser, setIsReturningUser] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [verifiedUser, setVerifiedUser] = useState<UserData>(null)
  const [uploadedDocument, setUploadedDocument] = useState<DocumentData | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [activeInputIndex, setActiveInputIndex] = useState(0)
  const [resendCooldown, setResendCooldown] = useState(0)

  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()
  const { sendOtp, verifyOtp, isLoading } = useAuth()

  const inputsRef = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null))
  const firstNameInputRef = useRef<HTMLInputElement | null>(null)
  const lastNameInputRef = useRef<HTMLInputElement | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)

  const rawRedirect = searchParams.get("redirect")
  const redirectUrl = rawRedirect?.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : null

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setTimeout(() => setResendCooldown(prev => Math.max(0, prev - 1)), 1000)
    return () => clearTimeout(id)
  }, [resendCooldown])

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
    if (fullCode.length === OTP_LENGTH && newCode.every(v => v.length > 0)) {
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
          setTimeout(() => { inputsRef.current[index - 1]?.focus() }, 0)
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
    const newCode = Array(OTP_LENGTH).fill("").map((_, i) => pasteData[i] || "")
    setCode(newCode)
    const nextIndex = Math.min(pasteData.length - 1, OTP_LENGTH - 1)
    setActiveInputIndex(nextIndex)
    inputsRef.current[nextIndex]?.focus()
    if (pasteData.length === OTP_LENGTH) handleVerifyOtp(pasteData.join(""))
    e.preventDefault()
  }, [code])

  const handleOtpInputFocus = useCallback((index: number) => {
    if (activeInputIndex !== index) setActiveInputIndex(index)
  }, [activeInputIndex])

  const handleSendOtp = useCallback(async (): Promise<boolean> => {
    if (!phoneNumber) {
      toast.error("Please enter a phone number")
      return false
    }

    let cleaned = phoneNumber.replace(/^\+\d{1,4}/, "").replace(/\D/g, "")
    if (cleaned.startsWith("250")) cleaned = cleaned.substring(3)
    if (cleaned.length === 10 && cleaned.startsWith("0")) cleaned = cleaned.substring(1)
    if (cleaned.length !== 9) {
      toast.error("Please enter a valid phone number: 9 digits or 10 digits starting with 0")
      return false
    }

    const formatted = `250${cleaned}`
    // Store the cleaned number so verifyOtp can format it correctly
    setPhoneNumber(cleaned)

    try {
      const success = await sendOtp({ phoneNumber: formatted })
      if (success) return true
      if (process.env.NODE_ENV === "development") {
        toast.success("Backend offline — use 111111 to verify (dev mode)")
        return true
      }
      toast.error("Failed to send OTP. Please try again.")
      return false
    } catch (error) {
      const err = error as Error & { code?: string; response?: { data?: { message?: string } } }
      const isNetwork = err.code === "ERR_NETWORK" || err.message?.includes("Network Error")
      if (isNetwork && process.env.NODE_ENV === "development") {
        toast.success("Backend offline — use 111111 to verify (dev mode)")
        return true
      }
      toast.error(isNetwork
        ? "Cannot connect to server. Is the backend running on port 3001?"
        : (err.response?.data?.message || "Failed to send OTP")
      )
      return false
    }
  }, [phoneNumber, sendOtp])

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0) return
    setCode(Array(OTP_LENGTH).fill(""))
    setActiveInputIndex(0)
    setResendCooldown(60)
    await handleSendOtp()
  }, [resendCooldown, handleSendOtp])

  const redirectHome = useCallback((isNew = false) => {
    document.cookie = "profileComplete=true; path=/; max-age=31536000"
    if (redirectUrl) {
      window.location.href = redirectUrl
      return
    }
    if (isNew || !localStorage.getItem("hasSeenTutorial")) {
      localStorage.setItem("hasSeenTutorial", "true")
      window.location.href = "/?tutorial=true"
    } else {
      window.location.href = "/"
    }
  }, [redirectUrl])

  const handleVerifyOtp = useCallback(async (otpCode: string) => {
    const cleanPhone = (() => {
      let c = phoneNumber.replace(/^\+\d{1,4}/, "").replace(/\D/g, "")
      if (c.startsWith("250")) c = c.substring(3)
      return c.length === 9 ? `250${c}` : c
    })()

    const completeSignupForNewUser = async (_user: NonNullable<UserData>) => {
      const roles = selectedRoles.length > 0 ? selectedRoles : ["EMPLOYER" as const]
      const payload: Record<string, unknown> = { firstName: firstName.trim(), roles }
      if (lastName.trim()) payload.lastName = lastName.trim()
      if (email.trim() && isValidEmail(email.trim())) payload.email = email.trim()

      const res = await api.post("/auth/complete-signup", payload, { withCredentials: true })
      const data = res.data?.data || res.data
      const newUser = { ...data.user, roles }
      // setSession atomically marks the user as authenticated with the real JWT
      dispatch(setSession({ user: newUser, token: data.token }))
      return roles
    }

    try {
      const user = await verifyOtp({ phoneNumber: cleanPhone, otp: otpCode })

      if (!user) {
        // Dev mode fallback
        if (process.env.NODE_ENV === "development" && otpCode === "111111") {
          toast.success("OTP verified (dev mode)")
          if (firstName.trim()) {
            setCurrentStep(4)
          } else {
            setCurrentStep(1) // collect name first
          }
          return
        }
        setCode(Array(OTP_LENGTH).fill(""))
        setActiveInputIndex(0)
        setTimeout(() => inputsRef.current[0]?.focus(), 50)
        return
      }

      setVerifiedUser(user)

      if (redirectUrl?.startsWith("/onboarding/organization")) {
        window.location.href = redirectUrl
        return
      }

      if (user.firstName && user.firstName.trim() !== "") {
        // Returning user with complete profile → home
        redirectHome(false)
        return
      }

      if (firstName.trim()) {
        // New user — we already collected their name at step 1
        const roles = await completeSignupForNewUser(user)
        if (roles.includes("WORKER")) {
          setCurrentStep(4) // doc upload
        } else {
          toast.success("Welcome! Let's get started.")
          redirectHome(true)
        }
      } else {
        // Login mode edge case: no name collected → show name step
        setCurrentStep(1)
      }
    } catch (error: any) {
      const isNetwork = error?.code === "ERR_NETWORK" || error?.message?.includes("Network Error")

      if (isNetwork && process.env.NODE_ENV === "development" && otpCode === "111111") {
        toast.success("OTP verified (dev mode)")
        if (firstName.trim()) {
          setCurrentStep(4)
        } else {
          setCurrentStep(1)
        }
        return
      }

      const raw = error?.response?.data?.message
      toast.error((Array.isArray(raw) ? raw[0] : raw) || "Invalid OTP. Please try again.")
      setCode(Array(OTP_LENGTH).fill(""))
      setActiveInputIndex(0)
      setTimeout(() => inputsRef.current[0]?.focus(), 50)
    }
  }, [phoneNumber, verifyOtp, redirectUrl, firstName, lastName, email, selectedRoles, dispatch, redirectHome])

  // Only called when user is already authenticated (login-mode edge case or complete-profile)
  const handleSaveBasicInfo = useCallback(async () => {
    if (!firstName.trim()) {
      toast.error("Please enter your name")
      return
    }
    if (email.trim() && !isValidEmail(email.trim())) {
      toast.error("Please enter a valid email address")
      return
    }

    const roles = selectedRoles.length > 0 ? selectedRoles : ["EMPLOYER" as const]

    try {
      const updatePayload: Record<string, string> = { firstName: firstName.trim() }
      if (lastName.trim()) updatePayload.lastName = lastName.trim()
      if (email.trim() && isValidEmail(email.trim())) updatePayload.email = email.trim()

      const res = await api.patch("/users/profile", updatePayload, { withCredentials: true })
      const updated = (res.data as any)?.data || res.data

      await api.post("/users/role-selection", { roles }, { withCredentials: true })
      await api.patch("/users/complete-onboarding", { role: roles[0] }, { withCredentials: true })

      const updatedUser = {
        ...verifiedUser,
        firstName: firstName.trim(),
        lastName: lastName.trim() || updated.lastName || verifiedUser?.lastName,
        username: updated.username || verifiedUser?.username,
        email: email.trim() || verifiedUser?.email || updated.email,
        phoneNumber: verifiedUser?.phoneNumber,
        roles,
      }

      dispatch(updateUser(updatedUser))
      localStorage.setItem("user", JSON.stringify(updatedUser))
      toast.success("Welcome!")
      redirectHome(false)
    } catch (error) {
      const err = error as Error & { response?: { status?: number; data?: { message?: string | string[] } } }
      if (err.response?.status === 401) {
        toast.error("Session expired. Please verify your phone number again.")
        setCurrentStep(2)
        return
      }
      const raw = err.response?.data?.message
      toast.error((Array.isArray(raw) ? raw[0] : raw) || "Failed to save information. Please try again.")
    }
  }, [firstName, lastName, email, selectedRoles, verifiedUser, dispatch, redirectHome])

  const handleDocumentUpload = useCallback((document: DocumentData) => {
    setUploadedDocument(document)
    setCurrentStep(5) // categories step
  }, [])

  const handleCategoriesSelected = useCallback(async (categories: string[]) => {
    setSelectedCategories(categories)
    try {
      await api.patch("/users/complete-onboarding", { role: "WORKER" }, { withCredentials: true })
      toast.success("Welcome! You're all set.")
      document.cookie = "profileComplete=true; path=/; max-age=31536000"
      localStorage.setItem("hasSeenTutorial", "true")
      window.location.href = "/?tutorial=true"
    } catch {
      toast.error("Failed to complete setup. Please try again.")
    }
  }, [])

  const handleNext = useCallback(async () => {
    if (currentStep === 0) { // role selection → signup form
      if (selectedRoles.length === 0) {
        toast.error("Please select a role to continue")
        return
      }
      setCurrentStep(1)
    }
    // Steps 1 and 2 manage their own buttons/OTP inline
  }, [currentStep, selectedRoles])

  const handleBack = useCallback(() => {
    if (currentStep <= 0) return
    if (currentStep === 3) { // OTP → phone: clear code
      setCode(Array(OTP_LENGTH).fill(""))
      setActiveInputIndex(0)
    }
    setCurrentStep(prev => prev - 1)
  }, [currentStep])

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
    selectedRoles,
    setSelectedRoles,
    selectedCategories,
    setSelectedCategories,
    termsAccepted,
    setTermsAccepted,
    verifiedUser,
    setVerifiedUser,
    uploadedDocument,
    setUploadedDocument,
    isReturningUser,
    setIsReturningUser,
    isLoading,
    resendCooldown,
    handleSendOtp,
    handleVerifyOtp,
    handleSaveBasicInfo,
    handleDocumentUpload,
    handleCategoriesSelected,
    handleNext,
    handleBack,
    handleResendOtp,
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
  if (!context) throw new Error("useOnboarding must be used within OnboardingProvider")
  return context
}
