"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { useAddServiceForm } from "@/hooks/useAddServiceForm";
import { useAuth } from "@/hooks/useAuth";
import type { Service } from "@/types";
import { getApiErrorMessage } from "@/lib/error-handler";
import { PageShell } from "@/components/ui/app-primitives";
import { WizardHeader } from "@/components/services/wizard/wizard-ui";
import {
  WizardStep1ChooseCategory,
  type WizardGrouping,
  type WizardJobType,
} from "@/components/services/wizard/WizardStep1ChooseCategory";
import { WizardStep2ChooseService } from "@/components/services/wizard/WizardStep2ChooseService";
import { WizardStep3AddDetails } from "@/components/services/wizard/WizardStep3AddDetails";
import { WizardStep4Confirmation } from "@/components/services/wizard/WizardStep4Confirmation";

const ALL_ID = "all";

interface AddServiceWizardProps {
  /** Provided when editing an existing service — the wizard opens on details. */
  service?: Service;
}

type WizardUser = {
  addresses?: Array<{ district?: string; city?: string }>;
} | null;

export function AddServiceWizard({ service }: AddServiceWizardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isEdit = !!service;

  const {
    form,
    setField,
    addImageFiles,
    removeImageAt,
    totalImageCount,
    isStep2Valid,
    isStep3Valid,
    submit,
    isSubmitting,
    reset,
    maxImages,
    maxDescription,
  } = useAddServiceForm({ service });

  const [step, setStep] = useState<1 | 2 | 3 | 4>(isEdit ? 3 : 1);
  const [tree, setTree] = useState<WizardGrouping[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [createdService, setCreatedService] = useState<Service | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/taxonomy/tree");
        const data = res.data?.data ?? res.data ?? [];
        setTree(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Could not load categories. Please try again.");
      } finally {
        setTreeLoading(false);
      }
    })();
  }, []);

  // "View All Services" mode: one synthetic grouping with every job type.
  const allGrouping: WizardGrouping = useMemo(() => {
    const map = new Map<string, WizardJobType>();
    for (const g of tree) {
      for (const jt of g.jobTypes) if (!map.has(jt.id)) map.set(jt.id, jt);
    }
    return {
      id: ALL_ID,
      name: "All Services",
      icon: null,
      jobTypes: [...map.values()],
    };
  }, [tree]);

  const selectedGrouping: WizardGrouping | undefined =
    form.groupingId === ALL_ID
      ? allGrouping
      : tree.find((g) => g.id === form.groupingId);

  const groupingSummary = useMemo(() => {
    if (!selectedGrouping) return "";
    if (selectedGrouping.id === ALL_ID) return "Every service we support";
    const names = selectedGrouping.jobTypes.map((jt) => jt.name);
    return names.length > 3
      ? `${names.slice(0, 3).join(", ")} and more`
      : names.join(", ");
  }, [selectedGrouping]);

  // The chosen job type — searched across the whole tree so the details
  // banner also works in edit mode (where no grouping was picked).
  const selectedJobType = useMemo(() => {
    for (const g of tree) {
      const hit = g.jobTypes.find((jt) => jt.id === form.categoryId);
      if (hit) return { jobType: hit, grouping: g };
    }
    return undefined;
  }, [tree, form.categoryId]);

  const serviceArea = useMemo(() => {
    const u = user as WizardUser;
    const addr = u?.addresses?.[0];
    if (!addr) return undefined;
    return [addr.city, addr.district].filter(Boolean).join(", ") || undefined;
  }, [user]);

  const handleSubmit = async () => {
    try {
      const result = await submit();
      setCreatedService(result);
      if (isEdit) {
        toast.success("Service updated");
        router.push("/more/services");
      } else {
        setStep(4);
      }
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Could not save the service. Please try again."),
      );
    }
  };

  const handleAddAnother = () => {
    reset();
    setCreatedService(null);
    setStep(1);
  };

  const header = (() => {
    if (step === 1)
      return {
        title: "Choose Category",
        subtitle: "Select the main category that best fits your service.",
        onBack: () => router.back(),
      };
    if (step === 2)
      return {
        title: "Choose Service",
        subtitle: "Select the specific service you offer in this category.",
        onBack: () => setStep(1),
      };
    if (step === 3)
      return {
        title: isEdit ? "Edit Service" : "Service Details",
        subtitle: undefined,
        onBack: isEdit ? () => router.back() : () => setStep(2),
      };
    return null; // success screen has no header
  })();

  return (
    <PageShell padded={false} bottomNav={false}>
      {header && (
        <WizardHeader
          title={header.title}
          subtitle={header.subtitle}
          onBack={header.onBack}
        />
      )}

      <main className="flex flex-col px-4 pt-2">
        {step === 1 && (
          <WizardStep1ChooseCategory
            groupings={tree}
            loading={treeLoading}
            onSelect={(gid) => {
              setField("groupingId", gid);
              setStep(2);
            }}
            onViewAll={() => {
              setField("groupingId", ALL_ID);
              setStep(2);
            }}
          />
        )}

        {step === 2 && selectedGrouping && (
          <WizardStep2ChooseService
            grouping={selectedGrouping}
            groupingSummary={groupingSummary}
            selectedServiceId={form.categoryId}
            onSelect={(cid) => setField("categoryId", cid)}
            onChangeCategory={() => setStep(1)}
            onViewAll={() => setField("groupingId", ALL_ID)}
            isAllMode={form.groupingId === ALL_ID}
            onContinue={() => isStep2Valid && setStep(3)}
            isValid={isStep2Valid}
          />
        )}

        {step === 3 && (
          <WizardStep3AddDetails
            form={form}
            serviceName={selectedJobType?.jobType.name ?? service?.title ?? "Your service"}
            serviceIcon={selectedJobType?.jobType.icon}
            groupingName={selectedJobType?.grouping.name}
            serviceArea={serviceArea}
            totalImageCount={totalImageCount}
            maxImages={maxImages}
            maxDescription={maxDescription}
            onSetField={setField}
            onAddImages={addImageFiles}
            onRemoveImageAt={removeImageAt}
            onChangeService={isEdit ? undefined : () => setStep(2)}
            onSubmit={handleSubmit}
            isValid={isStep3Valid}
            isSubmitting={isSubmitting}
            submitLabel={isEdit ? "Save Changes" : "Save Service"}
          />
        )}

        {step === 4 && createdService && (
          <WizardStep4Confirmation
            service={createdService}
            serviceIcon={selectedJobType?.jobType.icon}
            onAddAnother={handleAddAnother}
            onFinish={() => router.push("/more/services")}
          />
        )}
      </main>
    </PageShell>
  );
}
