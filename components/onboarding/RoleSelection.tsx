"use client"

import { User, Briefcase, Building2, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "@/context/onboarding-context"

type Role = "EMPLOYER" | "WORKER"

const ROLES = [
  {
    id: "EMPLOYER" as Role,
    icon: User,
    title: "I need help",
    description: "Find trusted workers for household tasks",
  },
  {
    id: "WORKER" as Role,
    icon: Briefcase,
    title: "I want to work",
    description: "Offer your services and get hired",
  },
]

export function RoleSelection() {
  const { selectedRoles, setSelectedRoles } = useOnboarding()
  const router = useRouter()

  const select = (role: Role) => {
    setSelectedRoles([role]) // single selection — replaces any previous choice
  }

  const isSelected = (role: Role) => selectedRoles.includes(role)

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 sm:gap-8">
      <div className="text-center mb-2">
        <h1 className="text-2xl sm:text-[36px] font-bold leading-tight sm:leading-[44px] text-gray-900 mb-2">
          What brings you here?
        </h1>
        <p className="text-base text-gray-500">Choose one to get started</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-md">
        {ROLES.map(({ id, icon: Icon, title, description }) => (
          <button
            key={id}
            onClick={() => select(id)}
            className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
              isSelected(id)
                ? "bg-[#145B10] text-white border-[#145B10]"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#145B10]"
            }`}
          >
            {isSelected(id) && (
              <CheckCircle className="absolute top-3 right-3 w-4 h-4 text-white" />
            )}
            <div className={`p-3 rounded-xl shrink-0 ${isSelected(id) ? "bg-white/20" : "bg-[#F1FCEF]"}`}>
              <Icon className={`w-6 h-6 ${isSelected(id) ? "text-white" : "text-[#145B10]"}`} />
            </div>
            <div>
              <p className="font-bold text-base">{title}</p>
              <p className={`text-sm mt-0.5 ${isSelected(id) ? "text-white/80" : "text-gray-500"}`}>
                {description}
              </p>
            </div>
          </button>
        ))}

        <button
          onClick={() => router.push("/onboarding/organization")}
          className="flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-[#145B10] bg-white text-gray-700 text-left transition-all"
        >
          <div className="p-3 rounded-xl bg-[#F1FCEF] shrink-0">
            <Building2 className="w-6 h-6 text-[#145B10]" />
          </div>
          <div>
            <p className="font-bold text-base">I represent a business</p>
            <p className="text-sm text-gray-500 mt-0.5">Register your company or agency</p>
          </div>
        </button>
      </div>
    </div>
  )
}
