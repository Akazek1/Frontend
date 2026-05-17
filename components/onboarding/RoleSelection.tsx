"use client"

import { User, Briefcase, CheckCircle } from "lucide-react"
import { useOnboarding } from "@/context/onboarding-context"

type Role = "EMPLOYER" | "WORKER"

export function RoleSelection() {
  const { selectedRoles, setSelectedRoles } = useOnboarding()

  const toggle = (role: Role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role))
    } else {
      setSelectedRoles([...selectedRoles, role])
    }
  }

  const isSelected = (role: Role) => selectedRoles.includes(role)

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 sm:gap-8">
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-2">
          What brings you here?
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Select all that apply — you can do both.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md">
        <button
          onClick={() => toggle("EMPLOYER")}
          className={`relative flex-1 p-6 rounded-xl border-2 transition-all ${
            isSelected("EMPLOYER")
              ? "bg-[#145B10] text-white border-[#145B10]"
              : "bg-white text-gray-700 border-gray-300 hover:border-[#145B10]"
          }`}
        >
          {isSelected("EMPLOYER") && (
            <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-white" />
          )}
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-lg ${isSelected("EMPLOYER") ? "bg-white/20" : "bg-[#F1FCEF]"}`}>
              <User className={`w-8 h-8 ${isSelected("EMPLOYER") ? "text-white" : "text-[#145B10]"}`} />
            </div>
            <h3 className="font-bold text-lg">I want to hire</h3>
            <p className="text-sm text-center opacity-80">Find workers for household tasks</p>
          </div>
        </button>

        <button
          onClick={() => toggle("WORKER")}
          className={`relative flex-1 p-6 rounded-xl border-2 transition-all ${
            isSelected("WORKER")
              ? "bg-[#145B10] text-white border-[#145B10]"
              : "bg-white text-gray-700 border-gray-300 hover:border-[#145B10]"
          }`}
        >
          {isSelected("WORKER") && (
            <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-white" />
          )}
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-lg ${isSelected("WORKER") ? "bg-white/20" : "bg-[#F1FCEF]"}`}>
              <Briefcase className={`w-8 h-8 ${isSelected("WORKER") ? "text-white" : "text-[#145B10]"}`} />
            </div>
            <h3 className="font-bold text-lg">I want to work</h3>
            <p className="text-sm text-center opacity-80">Offer your services to households</p>
          </div>
        </button>
      </div>

      {selectedRoles.length > 0 && (
        <p className="text-sm text-[#145B10] font-medium">
          {selectedRoles.length === 2
            ? "Great — you can do both on one account."
            : selectedRoles.includes("WORKER")
            ? "You'll complete a short verification to list your services."
            : "You'll be ready to browse workers right away."}
        </p>
      )}

      <div className="mt-2 text-center">
        <a
          href="/onboarding/organization"
          className="text-sm text-gray-500 hover:text-[#145B10] underline transition-colors"
        >
          Registering a business instead?
        </a>
      </div>
    </div>
  )
}
