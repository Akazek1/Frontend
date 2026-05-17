"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Building2, Phone, Mail, MapPin, CheckCircle, ChevronLeft, Users, Edit2 } from "lucide-react"
import { toast } from "react-hot-toast"
import api from "@/lib/axios"

interface Organization {
  id: string
  name: string
  type: "SERVICE_COMPANY" | "PLACEMENT_AGENCY"
  phone: string | null
  email: string | null
  address: string | null
  logoUrl: string | null
  verified: boolean
  ownerId: string
  createdAt: string
}

const ORG_TYPE_LABEL: Record<string, string> = {
  SERVICE_COMPANY: "Service Company",
  PLACEMENT_AGENCY: "Placement Agency",
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[#145B10]">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  )
}

export default function OrgProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [org, setOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const response = await api.get<{ data: Organization }>(`/organizations/${id}`, {
          withCredentials: true,
        })
        const data = (response.data as any)?.data ?? response.data
        setOrg(data)

        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setIsOwner(user.id === data.ownerId)
        }
      } catch (error: any) {
        const raw = error?.response?.data?.message
        const msg = Array.isArray(raw) ? raw[0] : raw
        toast.error(msg || "Failed to load organization")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) fetchOrg()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#145B10] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
        <Building2 className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500">Organization not found.</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-[#145B10] underline"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-full">
      {/* Header bar */}
      <div className="flex items-center px-4 pt-12 pb-4 border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="flex-1 text-center text-sm font-semibold text-gray-800">
          Organization Profile
        </span>
        {isOwner && (
          <button
            onClick={() => router.push(`/organization/${id}/edit`)}
            className="p-2 -mr-2 text-gray-500 hover:text-[#145B10] transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
        {!isOwner && <div className="w-10" />}
      </div>

      {/* Hero / logo area */}
      <div className="bg-gradient-to-br from-[#145B10] to-[#2E7D32] h-32 flex items-center justify-center relative">
        {org.logoUrl ? (
          <img
            src={org.logoUrl}
            alt={org.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-white absolute -bottom-10"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white border-4 border-white flex items-center justify-center absolute -bottom-10">
            <Building2 className="w-10 h-10 text-[#145B10]" />
          </div>
        )}
      </div>

      {/* Org identity */}
      <div className="mt-12 px-5 pb-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{org.name}</h1>
          {org.verified && (
            <CheckCircle className="w-5 h-5 text-[#145B10]" />
          )}
        </div>
        <span className="inline-block mt-1 text-xs bg-[#F1FCEF] text-[#145B10] font-medium px-3 py-1 rounded-full">
          {ORG_TYPE_LABEL[org.type] ?? org.type}
        </span>
        {!org.verified && (
          <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg inline-block">
            Pending verification — we'll review your account shortly.
          </p>
        )}
      </div>

      <div className="border-t border-gray-100 mx-5" />

      {/* Contact details */}
      <div className="px-5 py-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-700">Contact & Location</h2>
        <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={org.phone} />
        <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={org.email} />
        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={org.address} />

        {!org.phone && !org.email && !org.address && (
          <p className="text-sm text-gray-400 italic">No contact details added yet.</p>
        )}
      </div>

      {org.type === "SERVICE_COMPANY" && (
        <>
          <div className="border-t border-gray-100 mx-5" />
          <div className="px-5 py-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">How it works</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Clients book services directly with {org.name}. Your team handles the work —
              Akazek doesn't track individual staff members for service companies.
            </p>
          </div>
        </>
      )}

      {isOwner && (
        <>
          <div className="border-t border-gray-100 mx-5" />
          <div className="px-5 py-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Owner actions</h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push(`/organization/${id}/edit`)}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-[#145B10] text-sm text-gray-700 hover:text-[#145B10] transition-all"
              >
                <Edit2 className="w-4 h-4" />
                Edit organization details
              </button>
              <button
                onClick={() => router.push(`/organization/${id}/workers`)}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-[#145B10] text-sm text-gray-700 hover:text-[#145B10] transition-all"
              >
                <Users className="w-4 h-4" />
                Manage workers
              </button>
            </div>
          </div>
        </>
      )}

      <div className="h-8" />
    </div>
  )
}
