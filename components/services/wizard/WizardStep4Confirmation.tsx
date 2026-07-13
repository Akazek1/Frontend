"use client";

import { Check, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppButton } from "@/components/ui/app-primitives";
import { IconBadge } from "@/components/services/wizard/wizard-ui";
import { chargedPerUnit } from "@/components/services/wizard/WizardStep3AddDetails";
import { fromBackendPriceFields } from "@/services/services-service";
import { getServiceDisplayName } from "@/lib/service-display";
import type { Service } from "@/types";

interface WizardStep4ConfirmationProps {
  service: Service;
  serviceIcon?: string | null;
  onAddAnother: () => void;
  onFinish: () => void;
}

export function WizardStep4Confirmation({
  service,
  serviceIcon,
  onAddAnother,
  onFinish,
}: WizardStep4ConfirmationProps) {
  const t = useTranslations("serviceWizard");
  const image = service.serviceImage ?? service.serviceImages?.[0];
  const { priceMin, priceMax, chargedPer } = fromBackendPriceFields(service);
  const negotiable = Boolean((service as { negotiable?: boolean }).negotiable);
  const priceText =
    priceMin && priceMax && priceMin !== priceMax
      ? `${priceMin.toLocaleString()} – ${priceMax.toLocaleString()} RWF / ${chargedPerUnit(t)[chargedPer]}`
      : priceMax
        ? `${priceMax.toLocaleString()} RWF / ${chargedPerUnit(t)[chargedPer]}`
        : t("priceOnRequest");

  return (
    <div className="flex flex-col items-center gap-6 px-2 pt-8">
      {/* Success mark */}
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand">
        <Check className="h-10 w-10 text-white" strokeWidth={3} />
      </span>

      <div className="text-center">
        <h2 className="text-[24px] font-black text-ink">{t("serviceAdded")}</h2>
        <p className="mx-auto mt-2 max-w-[280px] text-[13.5px] text-ink-muted">
          {t("canNowBeDiscovered")}
        </p>
      </div>

      {/* Service card preview */}
      <div className="w-full overflow-hidden rounded-2xl border border-[#DCE8D9] bg-white shadow-[0_8px_24px_rgba(27,36,49,0.05)]">
        {image && (
          <div className="h-40 w-full bg-[#E8F7E5]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex items-center gap-3 p-4">
          <IconBadge icon={serviceIcon} />
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-ink">
              {getServiceDisplayName(service)}
            </span>
            <span className="mt-0.5 block text-[13px] font-semibold text-brand">
              {priceText}
            </span>
            {service.serviceAreas && service.serviceAreas.length > 0 && (
              <span className="mt-1 flex items-center gap-1 text-[12px] text-ink-muted">
                <MapPin className="h-3.5 w-3.5" />
                {service.serviceAreas.join(", ")}
              </span>
            )}
            <span className="mt-2 flex gap-1.5">
              <span className="inline-flex rounded-full bg-[#E8F7E5] px-2.5 py-0.5 text-[11px] font-bold text-brand">
                {t("active")}
              </span>
              {negotiable && (
                <span className="inline-flex rounded-full bg-[#FFF6E5] px-2.5 py-0.5 text-[11px] font-bold text-[#B8860B]">
                  {t("openToNegotiateBadge")}
                </span>
              )}
            </span>
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5 pt-2">
        <AppButton type="button" className="w-full" onClick={onAddAnother}>
          {t("addAnotherService")}
        </AppButton>
        <AppButton
          type="button"
          appVariant="secondary"
          className="w-full"
          onClick={onFinish}
        >
          {t("goToMyServices")}
        </AppButton>
      </div>
    </div>
  );
}
