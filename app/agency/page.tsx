"use client";

import Link from "next/link";
import {
  Users,
  ClipboardList,
  Inbox,
  AlertCircle,
  Coins,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAgency } from "@/context/agency-context";
import { AgencyCard, AgencyPageHeader, AgencyLoading, StatusPill } from "@/components/agency/agency-ui";

function formatRWF(n: number) {
  return `${new Intl.NumberFormat("en-RW").format(Math.round(n))} RWF`;
}

export default function AgencyDashboardPage() {
  const t = useTranslations("agencyDashboard");
  const { org, stats, loading } = useAgency();

  if (loading) return <AgencyLoading />;

  const cards = [
    { label: t("totalWorkers"), value: stats?.totalWorkers ?? 0, icon: Users, href: "/agency/workers", tone: "text-brand" },
    { label: t("activePlacements"), value: stats?.activePlacements ?? 0, icon: ClipboardList, href: "/agency/placements", tone: "text-brand" },
    { label: t("pendingRequests"), value: stats?.pendingRequests ?? 0, icon: Inbox, href: "/agency/requests", tone: "text-[#B45309]" },
    { label: t("openIssues"), value: stats?.openIssues ?? 0, icon: AlertCircle, href: "/agency/issues", tone: "text-[#DC2626]" },
  ];

  return (
    <div>
      <AgencyPageHeader
        title={org?.name ? t("welcomeWithName", { name: org.name }) : t("welcome")}
        subtitle={t("todaySubtitle")}
        badge={org?.verified ? <StatusPill label={t("verified")} tone="green" /> : <StatusPill label={t("unverified")} tone="amber" />}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href}>
              <AgencyCard className="h-full p-4 transition-shadow hover:shadow-md lg:p-5">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${c.tone}`} />
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                </div>
                <p className="mt-3 text-[28px] font-black leading-none text-ink lg:text-[32px]">{c.value}</p>
                <p className="mt-1.5 text-[12px] font-medium text-ink-muted">{c.label}</p>
              </AgencyCard>
            </Link>
          );
        })}
      </div>

      {/* Commission summary */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <AgencyCard className="p-5">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-brand" />
            <h2 className="text-[14px] font-bold text-ink">{t("commissionEarned")}</h2>
          </div>
          <p className="mt-3 text-[26px] font-black text-ink">{formatRWF(stats?.totalCommissionEarned ?? 0)}</p>
          <p className="mt-1 text-[12px] text-ink-muted">{t("totalAcrossPlacements")}</p>
        </AgencyCard>
        <AgencyCard className="p-5">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-[#B45309]" />
            <h2 className="text-[14px] font-bold text-ink">{t("unpaidCommission")}</h2>
          </div>
          <p className="mt-3 text-[26px] font-black text-ink">{formatRWF(stats?.unpaidCommission ?? 0)}</p>
          <p className="mt-1 text-[12px] text-ink-muted">{t("outstandingOnActive")}</p>
        </AgencyCard>
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        <Link href="/agency/requests">
          <AgencyCard className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF4E0]">
              <Inbox className="h-5 w-5 text-[#B45309]" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-ink">{t("reviewRequests")}</p>
              <p className="text-[12px] text-ink-muted">{t("awaitingYourAction", { count: stats?.pendingRequests ?? 0 })}</p>
            </div>
          </AgencyCard>
        </Link>
        <Link href="/agency/issues">
          <AgencyCard className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEECEC]">
              <AlertCircle className="h-5 w-5 text-[#DC2626]" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-ink">{t("resolveIssues")}</p>
              <p className="text-[12px] text-ink-muted">{t("openEscalations", { count: stats?.openIssues ?? 0 })}</p>
            </div>
          </AgencyCard>
        </Link>
        <Link href="/agency/workers">
          <AgencyCard className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F7E5]">
              <ShieldCheck className="h-5 w-5 text-brand" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-ink">{t("manageWorkers")}</p>
              <p className="text-[12px] text-ink-muted">{t("enrolled", { count: stats?.totalWorkers ?? 0 })}</p>
            </div>
          </AgencyCard>
        </Link>
      </div>
    </div>
  );
}
