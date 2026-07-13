"use client";

import { useTranslations } from "next-intl";
import { ComingSoon } from "@/components/agency/coming-soon";

export default function AgencySettingsPage() {
  const t = useTranslations("agencyComingSoon");
  return <ComingSoon title={t("settingsTitle")} description={t("settingsDescription")} />;
}
