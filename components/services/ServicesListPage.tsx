"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { AvailabilityToggleCard } from "@/components/services/AvailabilityToggleCard";
import { ServiceCard } from "@/components/services/ServiceCard";
import { TipCard } from "@/components/services/TipCard";
import { SortDropdown, ServicesSortKey } from "@/components/services/SortDropdown";
import { EmptyServicesState } from "@/components/services/EmptyServicesState";
import { DeleteServiceDialog } from "@/components/services/DeleteServiceDialog";
import { useServices } from "@/hooks/useServices";
import { useAvailability } from "@/hooks/useAvailability";
import { useAuth } from "@/hooks/useAuth";
import servicesService from "@/services/services-service";
import type { Service } from "@/types";

const PROVIDER_ROLES = ["WORKER", "COMPANY"];

export function ServicesListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    services,
    isLoading,
    error,
    refetch,
    removeLocal,
  } = useServices();
  const { available, isUpdating, setAvailable } = useAvailability();

  const [sort, setSort] = useState<ServicesSortKey>("recent");
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);

  const canAddService = useMemo(() => {
    const roles = (user?.roles as string[] | undefined) ?? [];
    return roles.some((r) => PROVIDER_ROLES.includes(r));
  }, [user?.roles]);

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

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await servicesService.remove(pendingDelete.id);
      removeLocal(pendingDelete.id);
      toast.success("Service deleted");
      setPendingDelete(null);
    } catch (err) {
      const message =
        (err as any)?.response?.data?.message ||
        "Failed to delete service. Please try again.";
      toast.error(message);
    }
  };

  const isEmpty = !isLoading && services.length === 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="-ml-1 rounded-full p-1.5 hover:bg-[#F1FCEF]"
          >
            <ArrowLeft className="h-5 w-5 text-[#1B2431]" />
          </button>
          <h1 className="text-[22px] font-black text-[#1B2431]">My Services</h1>
        </div>

        {canAddService && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            className="h-10 gap-1 rounded-xl border-[#145B10]/30 px-3 text-[13px] font-semibold text-[#145B10] hover:bg-[#F1FCEF]"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        )}
      </header>

      <main className="flex flex-col gap-4 px-4">
        {/* Availability */}
        {canAddService && (
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

        {isEmpty && canAddService && <EmptyServicesState onAdd={handleAdd} />}
        {isEmpty && !canAddService && (
          <div className="rounded-2xl border border-[#DCEEDD] bg-white p-6 text-center text-[13px] text-[#475467]">
            Switch to Provider mode to start offering services.
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {sorted.map((service) => (
            <li key={service.id}>
              <ServiceCard
                service={service}
                viewer="owner"
                onEdit={handleEdit}
                onDelete={(s) => setPendingDelete(s)}
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

      <DeleteServiceDialog
        open={!!pendingDelete}
        serviceTitle={pendingDelete?.title}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
