"use client";

import { useTranslations } from "next-intl";
import { ComingSoon } from "@/components/agency/coming-soon";

export default function AgencyReviewsPage() {
  const t = useTranslations("agencyComingSoon");
  return <ComingSoon title={t("reviewsTitle")} description={t("reviewsDescription")} />;
}
