"use client"

import React from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import ProfileImageUploader from "@/components/profile/profile-img-uloader"

interface ProfilePictureStepProps {
  onContinue: () => void
}

/**
 * First post-signup step for workers: add a profile picture using the exact same
 * uploader as the rest of the app (camera/gallery picker → crop → compression),
 * so behaviour and image sizing stay consistent. No "Back" button — the account
 * already exists at this point.
 */
export const ProfilePictureStep = ({ onContinue }: ProfilePictureStepProps) => {
  const { user } = useSelector((state: RootState) => state.auth)
  const hasPhoto = Boolean(user?.profilePicture)

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-2">
          Add a profile picture
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          A clear photo helps employers trust and recognise you.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <ProfileImageUploader />
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-[#0f4a0b] transition-colors"
      >
        {hasPhoto ? "Continue" : "Skip for now"}
      </button>
    </div>
  )
}
