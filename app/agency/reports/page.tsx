"use client";

import { useTranslations } from "next-intl";
import { ComingSoon } from "@/components/agency/coming-soon";

export default function AgencyReportsPage() {
  const t = useTranslations("agencyComingSoon");
  return <ComingSoon title={t("reportsTitle")} description={t("reportsDescription")} />;
}
