"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Building2, Phone, Mail, MapPin, CheckCircle, Users, Edit2 } from "lucide-react"
import { toast } from "react-hot-toast"
import api from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/error-handler"
import {
  AppButton,
  AppSectionHeader,
  Card,
  EmptyState,
  PageHeader,
  PageShell,
  appActionCardClass,
  appStickyHeaderClass,
} from "@/components/ui/app-primitives"
import { cn } from "@/lib/utils"

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

interface OrganizationResponse {
  data?: Organization
  id?: string
  name?: string
  type?: Organization["type"]
  phone?: string | null
  email?: string | null
  address?: string | null
  logoUrl?: string | null
  verified?: boolean
  ownerId?: string
  createdAt?: string
}

const ORG_TYPE_LABEL: Record<string, string> = {
  SERVICE_COMPANY: "Service Company",
  PLACEMENT_AGENCY: "Placement Agency",
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-brand">{icon}</div>
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
        const response = await api.get<OrganizationResponse>(`/organizations/${id}`, {
          withCredentials: true,
        })
        const data = (response.data.data ?? response.data) as Organization
        setOrg(data)

        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setIsOwner(user.id === data.ownerId)
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to load organization"))
      } finally {
        setIsLoading(false)
      }
    }

    if (id) fetchOrg()
  }, [id])

  if (isLoading) {
    return (
      <div className="bg-surface flex min-h-dvh items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!org) {
    return (
      <PageShell className="justify-center">
        <EmptyState
          icon={Building2}
          title="Organization not found"
          description="This organization profile could not be loaded."
          action={
            <AppButton appVariant="secondary" onClick={() => router.back()} className="w-full">
              Go back
            </AppButton>
          }
        />
      </PageShell>
    )
  }

  return (
    <PageShell padded={false} className="gap-0">
      <PageHeader
        title="Organization Profile"
        compact
        onBack={() => router.back()}
        className={appStickyHeaderClass}
        action={
          isOwner ? (
            <button
              onClick={() => router.push(`/organization/${id}/edit`)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:bg-[#E8F7E5] hover:text-brand"
              aria-label="Edit organization"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          ) : null
        }
      />

      <main className="flex flex-col gap-4 px-4 pt-4">
        <Card className="overflow-hidden p-0">
          {/* Hero / logo area */}
          <div className="bg-brand h-32 flex items-center justify-center relative">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt={org.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white absolute -bottom-10"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white border-4 border-white flex items-center justify-center absolute -bottom-10">
                <Building2 className="w-10 h-10 text-brand" />
              </div>
            )}
          </div>

          {/* Org identity */}
          <div className="mt-12 px-5 pb-5 text-center">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{org.name}</h1>
              {org.verified && (
                <CheckCircle className="w-5 h-5 text-brand" />
              )}
            </div>
            <span className="inline-block mt-1 text-xs bg-surface text-brand font-medium px-3 py-1 rounded-full">
              {ORG_TYPE_LABEL[org.type] ?? org.type}
            </span>
            {!org.verified && (
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg inline-block">
                Pending verification — we&apos;ll review your account shortly.
              </p>
            )}
          </div>
        </Card>

        {/* Contact details */}
        <Card className="flex flex-col gap-4">
          <AppSectionHeader title="Contact & Location" />
          <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={org.phone} />
          <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={org.email} />
          <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={org.address} />

          {!org.phone && !org.email && !org.address && (
            <p className="text-sm text-gray-400 italic">No contact details added yet.</p>
          )}
        </Card>

        {org.type === "SERVICE_COMPANY" && (
          <Card>
            <AppSectionHeader title="How it works" />
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Clients book services directly with {org.name}. Your team handles the work —
              Akazek doesn&apos;t track individual staff members for service companies.
            </p>
          </Card>
        )}

        {isOwner && (
          <Card className="space-y-3">
            <AppSectionHeader title="Owner actions" />
            <button
              onClick={() => router.push(`/organization/${id}/edit`)}
              className={cn(appActionCardClass, "flex w-full items-center gap-3 p-3 text-left text-sm text-gray-700 shadow-none hover:text-brand")}
            >
              <Edit2 className="w-4 h-4" />
              Edit organization details
            </button>
            <button
              onClick={() => router.push(`/organization/${id}/workers`)}
              className={cn(appActionCardClass, "flex w-full items-center gap-3 p-3 text-left text-sm text-gray-700 shadow-none hover:text-brand")}
            >
              <Users className="w-4 h-4" />
              Manage workers
            </button>
          </Card>
        )}
      </main>
    </PageShell>
  )
}
