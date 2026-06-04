"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ServiceImageUploader } from "@/components/services/ServiceImageUploader";
import ServiceCard from "@/components/service-card";
import { mapServiceToProviderCard } from "@/lib/service-display";
import type { WizardFormState } from "@/hooks/useAddServiceForm";
import type { Service } from "@/types";
import type { ServiceCategory } from "@/services/services-service";
import {
  AppButton,
  Card,
  FormField,
  appInputClass,
  appTextareaClass,
} from "@/components/ui/app-primitives";

interface WizardStep2Props {
  form: WizardFormState;
  categories: ServiceCategory[];
  isValid: boolean;
  isSubmitting: boolean;
  isEdit: boolean;
  maxImages: number;
  onSetField: <K extends keyof WizardFormState>(key: K, value: WizardFormState[K]) => void;
  onAddImages: (files: File[]) => void;
  onRemoveImageAt: (index: number) => void;
  onBack: () => void;
  onSubmit: () => void;
  /** Provider info used to render the live preview card. */
  providerPreview: {
    id: string;
    firstName?: string;
    lastName?: string;
    isVerified?: boolean;
    profilePicture?: string;
    district?: string;
  };
}

/**
 * Build a Service-shaped object from the form so we can hand it to the
 * existing ServiceCard for the live preview. This never hits the network
 * and never persists — it only mirrors the user's current inputs.
 */
function buildPreviewService(
  form: WizardFormState,
  category: ServiceCategory | undefined,
  provider: WizardStep2Props["providerPreview"],
): Service {
  const priceNum = Number(form.price) || 0;
  const blobImages = form.newImageFiles.map((f) => URL.createObjectURL(f));
  const images = [...form.existingImageUrls, ...blobImages].filter(Boolean);
  return {
    service: {},
    id: "preview",
    title: form.title || "Your service title",
    description: form.description || "",
    priceMin: priceNum,
    priceMax: priceNum,
    priceType: form.chargedPer,
    category: category
      ? { id: category.id, name: category.name }
      : { id: "", name: "Service" },
    serviceImage: images[0] ?? null,
    serviceImages: images,
    isActive: true,
    providerId: provider.id,
    provider: {
      id: provider.id,
      firstName: provider.firstName ?? "",
      lastName: provider.lastName ?? "",
      email: "",
      isVerified: provider.isVerified ?? false,
      profilePicture: provider.profilePicture,
    },
    reviews: { averageRating: 0, totalReviews: 0 },
    serviceAreas: provider.district ? [provider.district] : [],
  } as Service;
}

export function WizardStep2DetailsPreview({
  form,
  categories,
  isValid,
  isSubmitting,
  isEdit,
  maxImages,
  onSetField,
  onAddImages,
  onRemoveImageAt,
  onBack,
  onSubmit,
  providerPreview,
}: WizardStep2Props) {
  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  const previewService = useMemo(
    () => buildPreviewService(form, selectedCategory, providerPreview),
    [form, selectedCategory, providerPreview],
  );

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (isValid && !isSubmitting) onSubmit();
      }}
    >
      <header>
        <p className="text-[12px] font-black uppercase tracking-wide text-brand">
          Step 2 of 2
        </p>
        <h2 className="mt-1 text-[22px] font-black text-ink">
          Details &amp; Preview
        </h2>
        <p className="mt-1 text-[13px] text-[#475467]">
          Add more details to complete your service card.
        </p>
      </header>

      {/* Images */}
      <FormField label={`Service Images (Max ${maxImages})`}>
        <ServiceImageUploader
          existingUrls={form.existingImageUrls}
          pendingFiles={form.newImageFiles}
          maxImages={maxImages}
          onAdd={onAddImages}
          onRemoveAt={onRemoveImageAt}
        />
      </FormField>

      {/* Title */}
      <FormField label="Service Title" hint="This is the headline shown on your card.">
        <Input
          id="service-title"
          placeholder="e.g. Deep home cleaning"
          value={form.title}
          maxLength={120}
          onChange={(e) => onSetField("title", e.target.value)}
          className={appInputClass}
        />
      </FormField>

      {/* Description */}
      <FormField label="Service Description">
        <Textarea
          id="service-description"
          placeholder="Describe what is included, what you bring, and what kind of clients this service is best for."
          rows={5}
          value={form.description}
          maxLength={2000}
          onChange={(e) => onSetField("description", e.target.value)}
          className={appTextareaClass}
        />
      </FormField>

      {/* Live preview */}
      <Card
        variant="status"
        aria-live="polite"
        aria-label="Live preview of your service card"
        className="flex flex-col gap-2 p-3"
      >
        <p className="text-[13px] font-black text-ink">
          Preview of Your Service Card
        </p>
        {(() => {
          const p = mapServiceToProviderCard(previewService);
          return (
            <ServiceCard
              id={p.id}
              image={p.image}
              profileImage={p.profileImage}
              name={p.name}
              handle={p.handle}
              title={p.title}
              experience={p.experience}
              languages={p.languages}
              location={p.location}
              price={p.price}
              rating={p.rating}
              reviews={p.reviews}
              distance={p.distance}
              available={p.available}
              verified={p.verified}
              onClick={() => {}}
              isOwnService
            />
          );
        })()}
        <p className="text-center text-[11px] italic text-[#667085]">
          Stats appear once your card is live
        </p>
      </Card>

      {/* CTA row */}
      <div className="sticky bottom-0 -mx-4 mt-2 flex gap-2 border-t border-[#DCEEDD] bg-white px-4 pb-[env(safe-area-inset-bottom)] pt-3">
        <AppButton
          type="button"
          appVariant="secondary"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 text-[15px] font-black"
        >
          Back
        </AppButton>
        <AppButton
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex-1 text-[15px] font-black disabled:bg-[#DCEEDD] disabled:text-[#667085]"
        >
          <Check className="h-4 w-4" />
          {isSubmitting
            ? "Saving…"
            : isEdit
            ? "Save Changes"
            : "Save Service"}
        </AppButton>
      </div>
    </form>
  );
}
