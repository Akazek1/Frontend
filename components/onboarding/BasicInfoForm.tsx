"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { useOnboarding } from "@/context/onboarding-context"

const isValidEmail = (v: string) => /\S+@\S+\.\S+/.test(v)

export function BasicInfoForm() {
  const {
    firstName,
    lastName,
    email,
    handleFirstNameChange,
    handleLastNameChange,
    handleEmailChange,
    firstNameInputRef,
    lastNameInputRef,
    emailInputRef,
  } = useOnboarding()

  const [emailError, setEmailError] = useState("")

  const handleEmailBlur = () => {
    if (email.trim() && !isValidEmail(email.trim())) {
      setEmailError("Please enter a valid email address")
    } else {
      setEmailError("")
    }
  }

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleEmailChange(e)
    if (emailError && isValidEmail(e.target.value.trim())) {
      setEmailError("")
    }
  }

  return (
    <div className="relative w-full">
      <div className="flex flex-col items-center gap-6 sm:gap-8 pt-12">
        <div className="text-center mb-2">
          <h2 className="font-bold text-2xl sm:text-3xl text-[#212121] mb-2">
            Tell us about yourself
          </h2>
          <p className="text-sm text-gray-500">We just need your name to get started</p>
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && firstName.trim()) {
                  e.preventDefault()
                  lastNameInputRef.current?.focus()
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <Input
              ref={lastNameInputRef}
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={handleLastNameChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  emailInputRef.current?.focus()
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <Input
              ref={emailInputRef}
              type="email"
              inputMode="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={handleEmailInput}
              onBlur={handleEmailBlur}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10] ${
                emailError ? "border-red-400" : "border-gray-300"
              }`}
            />
            {emailError ? (
              <p className="text-xs text-red-500 mt-1">{emailError}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">You can add this later in your profile</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
