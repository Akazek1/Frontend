"use client"

import React from "react"
import { CheckCircle2 } from "lucide-react"

interface AllSetStepProps {
  /** Go to the Add-Service wizard. */
  onAddService: () => void
  /** Skip and go home. */
  onFinish: () => void
}

/**
 * Final onboarding screen for workers. Once their profile picture, ID and
 * service categories are in, offer a direct path to list their first service —
 * the natural next action — or finish and explore.
 */
export const AllSetStep = ({ onAddService, onFinish }: AllSetStepProps) => {
  return (
    <div className="w-full max-w-md text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-surface rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-brand" />
        </div>
      </div>
      <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-2">
        You&apos;re all set!
      </h1>
      <p className="text-base sm:text-lg text-gray-600 mb-8">
        List your first service so employers can find and hire you.
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onAddService}
          className="w-full px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-[#0f4a0b] transition-colors"
        >
          Add a service
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
