"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { WizardStepIndicator } from "@/components/services/WizardStepIndicator";
import { WizardStep1Basics } from "@/components/services/WizardStep1Basics";
import { WizardStep2DetailsPreview } from "@/components/services/WizardStep2DetailsPreview";
import { useAddServiceForm } from "@/hooks/useAddServiceForm";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { useRequireRole } from "@/hooks/useRequireRole";
import { useAuth } from "@/hooks/useAuth";
import type { Service } from "@/types";

interface AddServiceWizardProps {
  /** Provided when editing an existing service. */
  service?: Service;
}

export function AddServiceWizard({ service }: AddServiceWizardProps) {
  const router = useRouter();
  const { user } = useAuth();
  useRequireRole(["WORKER", "COMPANY"], {
    fallbackPath: "/more",
    toastMessage: "Switch to Provider mode to add services.",
  });

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

  const providerPreview = {
    id: (user as any)?.id ?? "preview",
    firstName: (user as any)?.firstName,
    lastName: (user as any)?.lastName,
    isVerified: (user as any)?.isVerified,
    profilePicture: (user as any)?.profilePicture,
    district: (user as any)?.addresses?.[0]?.district,
  };

  const handleSubmit = async () => {
    try {
      await submit();
      toast.success(isEdit ? "Service updated" : "Service created");
      router.push("/more/services");
    } catch (err) {
      const message =
        (err as any)?.response?.data?.message ||
        "Could not save the service. Please try again.";
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-white pb-12">
      <header className="sticky top-0 z-10 flex items-center gap-2 bg-white px-4 pb-3 pt-4">
        <button
          type="button"
          onClick={() => (step === 2 ? setStep(1) : router.back())}
          aria-label="Go back"
          className="-ml-1 rounded-full p-1.5 hover:bg-[#F1FCEF]"
        >
          <ArrowLeft className="h-5 w-5 text-[#1B2431]" />
        </button>
        <h1 className="text-[18px] font-black text-[#1B2431]">{headerTitle}</h1>
      </header>

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
    </div>
  );
}
