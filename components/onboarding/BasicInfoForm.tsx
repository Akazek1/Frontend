"use client"

import { Input } from "@/components/ui/input"
import { useOnboarding } from "@/context/onboarding-context"

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

  return (
    <div className="relative w-full">
      <button
        onClick={() => {
          // Go back handled by main page component
        }}
        className="absolute -top-60 sm:-top-80 left-0 p-2 text-[#1B5E20] font-semibold flex items-center gap-1"
        disabled
        style={{ visibility: "hidden" }}
      >
        Back
      </button>
      <div className="flex flex-col items-center gap-6 sm:gap-8 pt-12">
        <div className="text-center mb-4">
          <h2 className="font-bold text-2xl sm:text-3xl text-[#212121] mb-2">
            Tell us about yourself
          </h2>
          <p className="text-sm text-gray-600">We just need your name to get started</p>
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
              Last Name (Optional)
            </label>
            <Input
              ref={lastNameInputRef}
              id="lastName"
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
              Email (Optional)
            </label>
            <Input
              ref={emailInputRef}
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={handleEmailChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10]"
            />
            <p className="text-xs text-gray-500 mt-1">You can add this later in your profile</p>
          </div>
        </div>
      </div>
    </div>
  )
}
