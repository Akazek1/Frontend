"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import api from "@/lib/axios";
import ServiceCard from "@/components/service-card";
import { getServiceDetailPath, mapServiceToProviderCard } from "@/lib/service-display";
import type { Service } from "@/types";

/**
 * The agency's enrolled workers, rendered with the SAME ServiceCard used on the
 * home feed and search — no second card design to keep in sync.
 */
export function AgencyWorkerCards({ agencyId }: { agencyId: string }) {
  const t = useTranslations("organizationProfile");
  const locale = useLocale();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    if (!agencyId) return;
    api
      .get(`/services`, { params: { agencyId, limit: 20 } })
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setServices(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => setServices([]));
  }, [agencyId]);

  if (services.length === 0) return null;

  return (
    <section className="mt-4 space-y-3">
      <h2 className="text-[15px] font-bold text-ink">{t("ourWorkers")}</h2>
      <div className="flex flex-col gap-3">
        {services.map((service) => {
          const provider = mapServiceToProviderCard(service, locale);
          return (
            <ServiceCard
              key={provider.id}
              {...provider}
              onClick={() => router.push(getServiceDetailPath(service))}
            />
          );
        })}
      </div>
    </section>
  );
}
