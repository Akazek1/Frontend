"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { AddServiceWizard } from "@/components/services/AddServiceWizard";
import servicesService from "@/services/services-service";
import type { Service } from "@/types";
import { getApiErrorMessage } from "@/lib/error-handler";

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    servicesService
      .getById(id)
      .then((result) => {
        if (cancelled) return;
        setService(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = getApiErrorMessage(err, "We couldn't find that service.");
        toast.error(message);
        router.replace("/more/services");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (isLoading || !service) {
    return (
      <div className="bg-surface mx-auto flex min-h-dvh w-full max-w-[428px] items-center justify-center text-[13px] text-[#475467]">
        Loading service…
      </div>
    );
  }

  return <AddServiceWizard service={service} />;
}
