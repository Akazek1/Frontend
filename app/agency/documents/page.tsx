"use client";

import { useTranslations } from "next-intl";
import { ComingSoon } from "@/components/agency/coming-soon";

export default function AgencyDocumentsPage() {
  const t = useTranslations("agencyComingSoon");
  return <ComingSoon title={t("documentsTitle")} description={t("documentsDescription")} />;
}
