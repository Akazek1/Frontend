"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { AvailabilityToggleCard } from "@/components/services/AvailabilityToggleCard";
import { OwnerServiceCardRow } from "@/components/services/OwnerServiceCardRow";
import { TipCard } from "@/components/services/TipCard";
import { SortDropdown, ServicesSortKey } from "@/components/services/SortDropdown";
import { EmptyServicesState } from "@/components/services/EmptyServicesState";
import { DeactivateServiceDialog } from "@/components/services/DeactivateServiceDialog";
import { useServices } from "@/hooks/useServices";
import { useAvailability } from "@/hooks/useAvailability";
import servicesService from "@/services/services-service";
import type { Service } from "@/types";
import {
  PageHeader,
  PageShell,
  appContentClass,
  appStickyHeaderClass,
} from "@/components/ui/app-primitives";
import { getApiErrorMessage } from "@/lib/error-handler";

type SortableService = Service & {
  createdAt?: string;
};

export function ServicesListPage() {
  const router = useRouter();
  const {
    services,
    isLoading,
    error,
    upsertLocal,
  } = useServices();
  const { available, isUpdating, setAvailable } = useAvailability();

  const [sort, setSort] = useState<ServicesSortKey>("recent");
  // Per-service Activate/Deactivate is a separate concern from the
  // global availability toggle: deactivating a card hides it from the
  // marketplace, the global toggle just flips the badge on cards that
  // remain visible.
  const [pendingToggle, setPendingToggle] = useState<Service | null>(null);

  // Per the business rule "any individual can register a service" the Add
  // CTA, the availability toggle (after first card), and the wizard are
  // open to every authenticated user. Backend silently grants WORKER on
  // first POST /services.
  const hasServices = services.length > 0;

  const sorted = useMemo(() => {
    if (sort !== "recent") return services;
    return services
      .slice()
      .sort((a, b) => {
        const ai = (a as SortableService).createdAt ? new Date((a as SortableService).createdAt as string).getTime() : 0;
        const bi = (b as SortableService).createdAt ? new Date((b as SortableService).createdAt as string).getTime() : 0;
        return bi - ai;
      });
  }, [services, sort]);

  const handleEdit = (service: Service) => {
    router.push(`/more/services/${service.id}/edit`);
  };

  const handleAdd = () => {
    router.push("/more/services/new");
  };

  const handleConfirmToggleActive = async () => {
    if (!pendingToggle) return;
    const nextActive = !(pendingToggle.isActive !== false);
    try {
      const updated = await servicesService.setActive(
        pendingToggle.id,
        nextActive,
      );
      upsertLocal(updated);
      toast.success(nextActive ? "Service activated" : "Service deactivated");
      setPendingToggle(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update the service. Please try again."));
    }
  };

  const isEmpty = !isLoading && services.length === 0;

  return (
    <PageShell padded={false}>
      {/* Header */}
      <PageHeader
        title="My Services"
        onBack={() => router.back()}
        className={appStickyHeaderClass}
        action={
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            className="h-10 gap-1 rounded-xl border-[#145B10]/30 px-3 text-[13px] font-semibold text-[#145B10] hover:bg-[var(--app-background)]"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        }
      />

      <main className={`${appContentClass} px-4 pt-4`}>
        {/* Availability toggle only makes sense once at least one card exists. */}
        {hasServices && (
          <AvailabilityToggleCard
            available={available}
            isUpdating={isUpdating}
            onChange={setAvailable}
          />
        )}

        {/* List header */}
        {!isEmpty && (
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-black text-[#1B2431]">
              Your Service Cards ({services.length})
            </h2>
            <SortDropdown value={sort} onChange={setSort} />
          </div>
        )}

        {/* Body */}
        {isLoading && services.length === 0 && (
          <div className="rounded-2xl border border-[#DCEEDD] bg-white p-6 text-center text-[13px] text-[#475467]">
            Loading your services…
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-[#FF3D00]/30 bg-[#FFF2EE] p-4 text-[13px] text-[#FF3D00]">
            {error}
          </div>
        )}

        {isEmpty && <EmptyServicesState onAdd={handleAdd} />}

        <ul className="flex flex-col gap-4">
          {sorted.map((service) => (
            <li key={service.id}>
              <OwnerServiceCardRow
                service={service}
                onEdit={handleEdit}
                onToggleActive={(s) => setPendingToggle(s)}
                workerAvailable={available}
              />
            </li>
          ))}
        </ul>

        {/* Tip card */}
        {!isEmpty && (
          <TipCard
            title="Tip"
            body="Add clear photos and descriptions to get more views and hire requests."
            persistKey="services_tip"
            href="/more/help/services-tips"
          />
        )}
      </main>

      <DeactivateServiceDialog
        open={!!pendingToggle}
        serviceTitle={pendingToggle?.title}
        isActive={pendingToggle?.isActive !== false}
        onCancel={() => setPendingToggle(null)}
        onConfirm={handleConfirmToggleActive}
      />
    </PageShell>
  );
}
