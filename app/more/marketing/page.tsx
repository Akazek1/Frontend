"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, Loader2, Megaphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import BackButtonHeader from "@/components/header/back-button-header";
import { Switch } from "@/components/ui/switch";
import { Card, PageShell } from "@/components/ui/app-primitives";
import api from "@/lib/axios";

const SHOWCASE_KEY = ["showcase-consent"] as const;

/**
 * Marketing & social media preferences. Currently a single control: the
 * separate, revocable opt-in for Huza to feature the user's identifiable
 * photo / name / profile on Huza's own social media and advertising. This is
 * deliberately NOT bundled into accepting the Terms (Law No. 058/2021 requires
 * marketing consent to be specific and unbundled), so it lives here as its own
 * choice. Running the public marketplace profile does not depend on it.
 */
const MarketingPreferences = () => {
  const t = useTranslations("marketingSettings");
  const queryClient = useQueryClient();
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: SHOWCASE_KEY,
    queryFn: async (): Promise<{ showcaseConsent: boolean }> => {
      const response = await api.get("/users/profile");
      const value = Boolean(response.data?.data?.showcaseConsent);
      return { showcaseConsent: value };
    },
  });

  useEffect(() => {
    if (data) setConsent(data.showcaseConsent);
  }, [data]);

  const handleToggle = async (next: boolean) => {
    const previous = consent;
    setConsent(next);
    setSaving(true);
    try {
      await api.patch("/users/me/showcase-consent", { consent: next });
      queryClient.setQueryData(SHOWCASE_KEY, { showcaseConsent: next });
      toast.success(next ? t("turnedOn") : t("turnedOff"));
    } catch (err) {
      console.error("Error updating showcase consent:", err);
      toast.error(t("failedToUpdate"));
      setConsent(previous);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-6">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <PageShell className="gap-5">
      <BackButtonHeader
        text={t("title")}
        subtitle={t("subtitle")}
        backHref="/more"
      />

      <Card variant="list" className="rounded-2xl">
        <div className="flex min-h-[76px] items-center gap-3 px-4 py-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-brand">
            <Megaphone className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-5 text-ink">
              {t("showcaseTitle")}
            </p>
            <p className="mt-0.5 text-[13px] leading-5 text-[#6B7280]">
              {t("showcaseDesc")}
            </p>
          </div>
          <Switch
            checked={consent}
            disabled={saving}
            onCheckedChange={handleToggle}
            aria-label={t("showcaseToggleAria")}
            className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-[#D1D5DB]"
          />
        </div>
      </Card>

      <Card className="flex gap-3 border-[#BFD8FF] bg-[#EEF6FF] text-[#2F5E9E]">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-[13px] leading-5">{t("notice")}</p>
      </Card>
    </PageShell>
  );
};

export default MarketingPreferences;
