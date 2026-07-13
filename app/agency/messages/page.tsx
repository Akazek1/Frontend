"use client";

import { useTranslations } from "next-intl";
import { ComingSoon } from "@/components/agency/coming-soon";

export default function AgencyMessagesPage() {
  const t = useTranslations("agencyComingSoon");
  return <ComingSoon title={t("messagesTitle")} description={t("messagesDescription")} />;
}
