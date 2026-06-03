"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { WizardStepIndicator } from "@/components/services/WizardStepIndicator";
import { WizardStep1Basics } from "@/components/services/WizardStep1Basics";
import { WizardStep2DetailsPreview } from "@/components/services/WizardStep2DetailsPreview";
import { useAddServiceForm } from "@/hooks/useAddServiceForm";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { useAuth } from "@/hooks/useAuth";
import type { Service } from "@/types";
import type { AuthResponse } from "@/services/auth-service";
import { getApiErrorMessage } from "@/lib/error-handler";
import { PageHeader, PageShell, appStickyHeaderClass } from "@/components/ui/app-primitives";

interface AddServiceWizardProps {
  /** Provided when editing an existing service. */
  service?: Service;
}

type PreviewUser = AuthResponse["data"]["user"] & {
  isVerified?: boolean;
  addresses?: Array<{
    district?: string;
  }>;
};

export function AddServiceWizard({ service }: AddServiceWizardProps) {
  const router = useRouter();
  const { user } = useAuth();
  // No role gate: per "any individual can register a service", every
  // authenticated user can reach this wizard. The backend silently grants
  // the WORKER role on first POST /services.

  const {
    form,
    setField,
    addImageFiles,
    removeImageAt,
    isStep1Valid,
    isStep2Valid,
    submit,
    isSubmitting,
    maxImages,
  } = useAddServiceForm({ service });

  const { categories, isLoading: categoriesLoading } = useServiceCategories();
  const [step, setStep] = useState<1 | 2>(1);

  const isEdit = !!service;
  const headerTitle = isEdit ? "Edit Service Card" : "Add Service Card";

  const previewUser = user as PreviewUser | null;
  const providerPreview = {
    id: previewUser?.id ?? "preview",
    firstName: previewUser?.firstName,
    lastName: previewUser?.lastName,
    isVerified: previewUser?.isVerified,
    profilePicture: previewUser?.profilePicture,
    district: previewUser?.addresses?.[0]?.district,
  };

  const handleSubmit = async () => {
    try {
      await submit();
      toast.success(isEdit ? "Service updated" : "Service created");
      router.push("/more/services");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the service. Please try again."));
    }
  };

  return (
    <PageShell padded={false} bottomNav={false}>
      <PageHeader
        title={headerTitle}
        compact
        onBack={() => (step === 2 ? setStep(1) : router.back())}
        className={appStickyHeaderClass}
      />

      <div className="px-4 pt-2">
        <WizardStepIndicator step={step} />
      </div>

      <main className="flex flex-col px-4 pt-2">
        {step === 1 ? (
          <WizardStep1Basics
            form={form}
            categories={categories}
            categoriesLoading={categoriesLoading}
            isValid={isStep1Valid}
            onSetField={setField}
            onContinue={() => setStep(2)}
          />
        ) : (
          <WizardStep2DetailsPreview
            form={form}
            categories={categories}
            isValid={isStep2Valid}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
            maxImages={maxImages}
            onSetField={setField}
            onAddImages={addImageFiles}
            onRemoveImageAt={removeImageAt}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
            providerPreview={providerPreview}
          />
        )}
      </main>
    </PageShell>
  );
}
