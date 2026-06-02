"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
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
import { appContentClass } from "@/components/ui/app-primitives";

export function ServicesListPage() {
  const router = useRouter();
  const {
    services,
    isLoading,
    error,
    refetch,
    upsertLocal,
  } = useServices();
  const { available, isUpdating, setAvailable } = useAvailability();

  const [sort, setSort] = useState<ServicesSortKey>("recent");
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
        const ai = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
        const bi = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
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
      const message =
        (err as any)?.response?.data?.message ||
        "Could not update the service. Please try again.";
      toast.error(message);
    }
  };

  const isEmpty = !isLoading && services.length === 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[428px] flex-col app-bg pb-24">
      {/* Header */}
      <header className="app-bg sticky top-0 z-10 flex items-center justify-between gap-3 px-4 pb-3 pt-6 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm hover:bg-[#E8F7E5]"
          >
            <ArrowLeft className="h-5 w-5 text-[#1B2431]" />
          </button>
          <h1 className="text-[24px] font-black leading-7 text-[#1B2431]">My Services</h1>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          className="h-10 gap-1 rounded-xl border-[#145B10]/30 px-3 text-[13px] font-semibold text-[#145B10] hover:bg-[var(--app-background)]"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </header>

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
    </div>
  );
}
