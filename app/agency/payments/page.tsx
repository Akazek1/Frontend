"use client";

import { useTranslations } from "next-intl";
import { ComingSoon } from "@/components/agency/coming-soon";

export default function AgencyPaymentsPage() {
  const t = useTranslations("agencyComingSoon");
  return <ComingSoon title={t("paymentsTitle")} description={t("paymentsDescription")} />;
}
