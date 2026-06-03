"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Briefcase, ChevronLeft, CheckCircle } from "lucide-react"
import { toast } from "react-hot-toast"
import api from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/error-handler"
import { getAuthToken } from "@/lib/auth-utils"

type OrgType = "SERVICE_COMPANY" | "PLACEMENT_AGENCY"
type Step = "type" | "details" | "success"

interface OrgFormData {
  name: string
  phone: string
  email: string
  address: string
}

interface CreateOrganizationResponse {
  id?: string
  data?: {
    id?: string
  }
}

function OrgTypeStep({
  selected,
  onSelect,
}: {
  selected: OrgType | null
  onSelect: (t: OrgType) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">What type of business?</h1>
        <p className="text-gray-500 text-sm">Choose the option that best describes your business.</p>
      </div>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => onSelect("SERVICE_COMPANY")}
          className={`relative p-5 rounded-xl border-2 text-left transition-all ${
            selected === "SERVICE_COMPANY"
              ? "bg-[#145B10] text-white border-[#145B10]"
              : "bg-white text-gray-700 border-gray-300 hover:border-[#145B10]"
          }`}
        >
          {selected === "SERVICE_COMPANY" && (
            <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-white" />
          )}
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg flex-shrink-0 ${selected === "SERVICE_COMPANY" ? "bg-white/20" : "bg-[#F1FCEF]"}`}>
              <Building2 className={`w-6 h-6 ${selected === "SERVICE_COMPANY" ? "text-white" : "text-[#145B10]"}`} />
            </div>
            <div>
              <h3 className="font-bold text-base mb-1">Service Company</h3>
              <p className="text-sm opacity-80">
                You offer services directly — pest control, deep cleaning, moving, repairs.
                Your staff are managed internally.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelect("PLACEMENT_AGENCY")}
          className={`relative p-5 rounded-xl border-2 text-left transition-all ${
            selected === "PLACEMENT_AGENCY"
              ? "bg-[#145B10] text-white border-[#145B10]"
              : "bg-white text-gray-700 border-gray-300 hover:border-[#145B10]"
          }`}
        >
          {selected === "PLACEMENT_AGENCY" && (
            <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-white" />
          )}
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg flex-shrink-0 ${selected === "PLACEMENT_AGENCY" ? "bg-white/20" : "bg-[#F1FCEF]"}`}>
              <Briefcase className={`w-6 h-6 ${selected === "PLACEMENT_AGENCY" ? "text-white" : "text-[#145B10]"}`} />
            </div>
            <div>
              <h3 className="font-bold text-base mb-1">Placement Agency</h3>
              <p className="text-sm opacity-80">
                You recruit, train, and place workers with families. Commission paid once at placement.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

function OrgDetailsStep({
  data,
  onChange,
}: {
  data: OrgFormData
  onChange: (field: keyof OrgFormData, value: string) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Business details</h1>
        <p className="text-gray-500 text-sm">Tell clients a bit about your company.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="e.g. CleanPro Rwanda Ltd."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#145B10] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="+250 7XX XXX XXX"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#145B10] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business email</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="contact@yourcompany.rw"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#145B10] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => onChange("address", e.target.value)}
            placeholder="Kigali, Rwanda"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#145B10] focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )
}

function SuccessStep({ orgName }: { orgName: string }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center py-8">
      <div className="w-20 h-20 rounded-full bg-[#F1FCEF] flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-[#145B10]" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all set!</h1>
        <p className="text-gray-500 text-sm">
          <span className="font-semibold text-gray-700">{orgName}</span> has been registered.
          Clients can now discover and book your services.
        </p>
      </div>
    </div>
  )
}

export default function OrgOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("type")
  const [selectedType, setSelectedType] = useState<OrgType | null>(null)
  const [formData, setFormData] = useState<OrgFormData>({ name: "", phone: "", email: "", address: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      router.replace("/onboarding?redirect=/onboarding/organization")
    }
  }, [router])

  const handleFieldChange = (field: keyof OrgFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Company name is required")
      return
    }

    setIsLoading(true)
    try {
      const payload: Record<string, string> = {
        name: formData.name.trim(),
        type: selectedType!,
      }
      if (formData.phone.trim()) payload.phone = formData.phone.trim()
      if (formData.email.trim()) payload.email = formData.email.trim()
      if (formData.address.trim()) payload.address = formData.address.trim()

      const response = await api.post<CreateOrganizationResponse>("/organizations", payload, {
        withCredentials: true,
      })

      const orgId = response.data?.data?.id || response.data?.id || null
      setCreatedOrgId(orgId)
      setStep("success")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to register business. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  const canProceedType = selectedType !== null
  const canProceedDetails = formData.name.trim().length > 0

  const handleNext = async () => {
    if (step === "type") {
      setStep("details")
    } else if (step === "details") {
      await handleSubmit()
    } else if (step === "success") {
      if (createdOrgId) {
        router.push(`/organization/${createdOrgId}`)
      } else {
        router.push("/")
      }
    }
  }

  const handleBack = () => {
    if (step === "details") setStep("type")
    else if (step === "type") router.back()
  }

  const buttonLabel =
    step === "type" ? "Continue" :
    step === "details" ? (isLoading ? "Registering..." : "Register Business") :
    "View your profile"

  const canProceed =
    step === "type" ? canProceedType :
    step === "details" ? canProceedDetails :
    true

  return (
    <div className="relative h-full bg-white max-w-md mx-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-4">
        {step !== "success" && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <div className="flex-1" />
        {step !== "success" && (
          <span className="text-xs text-gray-400 font-medium">
            {step === "type" ? "1 / 2" : "2 / 2"}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {step !== "success" && (
        <div className="px-4 mb-6">
          <div className="h-1.5 bg-gray-100 rounded-full">
            <div
              className="h-1.5 bg-[#145B10] rounded-full transition-all duration-300"
              style={{ width: step === "type" ? "50%" : "100%" }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {step === "type" && (
          <OrgTypeStep selected={selectedType} onSelect={setSelectedType} />
        )}
        {step === "details" && (
          <OrgDetailsStep data={formData} onChange={handleFieldChange} />
        )}
        {step === "success" && (
          <SuccessStep orgName={formData.name} />
        )}
      </div>

      {/* Footer button */}
      <div className="px-4 pb-10 pt-4">
        <button
          onClick={handleNext}
          disabled={!canProceed || isLoading}
          className="w-full bg-[#1B5E20] text-white py-4 rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#145B10] transition-colors"
        >
          {buttonLabel}
        </button>

        {step === "type" && (
          <p className="text-center text-xs text-gray-400 mt-3">
            Looking to hire or offer services personally?{" "}
            <Link href="/onboarding" className="text-[#145B10] underline">
              Sign up as an individual
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
