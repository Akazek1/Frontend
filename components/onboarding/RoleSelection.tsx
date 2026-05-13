"use client"

import { User, Briefcase } from "lucide-react"
import { useOnboarding } from "@/context/onboarding-context"

export function RoleSelection() {
  const { selectedRole, setSelectedRole } = useOnboarding()

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 sm:gap-8">
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-2">
          Choose Your Role
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          What brings you here today?
        </p>
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
            <div
              className={`p-3 rounded-lg ${
                selectedRole === "EMPLOYER" ? "bg-white/20" : "bg-[#F1FCEF]"
              }`}
            >
              <User
                className={`w-8 h-8 ${
                  selectedRole === "EMPLOYER" ? "text-white" : "text-[#145B10]"
                }`}
              />
            </div>
            <h3 className="font-bold text-lg">I want to hire</h3>
            <p className="text-sm text-center">Find workers</p>
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
            <div
              className={`p-3 rounded-lg ${
                selectedRole === "WORKER" ? "bg-white/20" : "bg-[#F1FCEF]"
              }`}
            >
              <Briefcase
                className={`w-8 h-8 ${
                  selectedRole === "WORKER" ? "text-white" : "text-[#145B10]"
                }`}
              />
            </div>
            <h3 className="font-bold text-lg">I want to work</h3>
            <p className="text-sm text-center">Offer services</p>
          </div>
        </button>
      </div>
    </div>
  )
}
