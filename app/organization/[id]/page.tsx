"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Building2, Phone, Mail, MapPin, CheckCircle, Users, Edit2 } from "lucide-react"
import { useTranslations } from "next-intl"
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
  type: "SERVICE_COMPANY" | "STAFFING_AGENCY"
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
  const t = useTranslations("organizationProfile")
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [org, setOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  const ORG_TYPE_LABEL: Record<string, string> = {
    SERVICE_COMPANY: t("serviceCompany"),
    STAFFING_AGENCY: t("staffingAgency"),
  }

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
        toast.error(getApiErrorMessage(error, t("failedToLoad")))
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
          title={t("organizationNotFound")}
          description={t("couldNotBeLoaded")}
          action={
            <AppButton appVariant="secondary" onClick={() => router.back()} className="w-full">
              {t("goBack")}
            </AppButton>
          }
        />
      </PageShell>
    )
  }

  return (
    <PageShell padded={false} className="gap-0">
      <PageHeader
        title={t("organizationProfileTitle")}
        compact
        onBack={() => router.back()}
        className={appStickyHeaderClass}
        action={
          isOwner ? (
            <button
              onClick={() => router.push(`/organization/${id}/edit`)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:bg-[#E8F7E5] hover:text-brand"
              aria-label={t("editOrganization")}
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
                {t("pendingVerification")}
              </p>
            )}
          </div>
        </Card>

        {/* Contact details */}
        <Card className="flex flex-col gap-4">
          <AppSectionHeader title={t("contactAndLocation")} />
          <InfoRow icon={<Phone className="w-4 h-4" />} label={t("phone")} value={org.phone} />
          <InfoRow icon={<Mail className="w-4 h-4" />} label={t("email")} value={org.email} />
          <InfoRow icon={<MapPin className="w-4 h-4" />} label={t("address")} value={org.address} />

          {!org.phone && !org.email && !org.address && (
            <p className="text-sm text-gray-400 italic">{t("noContactDetails")}</p>
          )}
        </Card>

        {org.type === "SERVICE_COMPANY" && (
          <Card>
            <AppSectionHeader title={t("howItWorks")} />
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              {t("howItWorksDesc", { name: org.name })}
            </p>
          </Card>
        )}

        {isOwner && (
          <Card className="space-y-3">
            <AppSectionHeader title={t("ownerActions")} />
            <button
              onClick={() => router.push(`/organization/${id}/edit`)}
              className={cn(appActionCardClass, "flex w-full items-center gap-3 p-3 text-left text-sm text-gray-700 shadow-none hover:text-brand")}
            >
              <Edit2 className="w-4 h-4" />
              {t("editOrganizationDetails")}
            </button>
            <button
              onClick={() => router.push(`/organization/${id}/workers`)}
              className={cn(appActionCardClass, "flex w-full items-center gap-3 p-3 text-left text-sm text-gray-700 shadow-none hover:text-brand")}
            >
              <Users className="w-4 h-4" />
              {t("manageWorkers")}
            </button>
          </Card>
        )}
      </main>
    </PageShell>
  )
}
