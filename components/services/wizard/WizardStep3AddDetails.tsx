"use client";

import { useEffect, useMemo } from "react";
import { ChevronRight, Loader2, MapPin, Pencil, Plus, X } from "lucide-react";
import { AppButton } from "@/components/ui/app-primitives";
import { IconBadge } from "@/components/services/wizard/wizard-ui";
import type { WizardFormState, PriceMode } from "@/hooks/useAddServiceForm";
import type { ChargedPer } from "@/services/services-service";

const CHARGED_PER: Array<{ value: ChargedPer; label: string }> = [
  { value: "one_time", label: "One Time" },
  { value: "daily", label: "Day" },
  { value: "weekly", label: "Week" },
  { value: "monthly", label: "Month" },
];

export const chargedPerUnit: Record<ChargedPer, string> = {
  one_time: "one time",
  daily: "day",
  weekly: "week",
  monthly: "month",
};

interface WizardStep3AddDetailsProps {
  form: WizardFormState;
  serviceName: string;
  serviceIcon?: string | null;
  groupingName?: string;
  serviceArea?: string;
  totalImageCount: number;
  maxImages: number;
  maxDescription: number;
  onSetField: <K extends keyof WizardFormState>(
    key: K,
    value: WizardFormState[K],
  ) => void;
  onAddImages: (files: File[]) => void;
  onRemoveImageAt: (index: number) => void;
  onChangeService?: () => void;
  onSubmit: () => void;
  isValid: boolean;
  isSubmitting: boolean;
  submitLabel: string;
}

function PriceModeCard({
  title,
  caption,
  active,
  onClick,
}: {
  title: string;
  caption: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-start gap-2.5 rounded-2xl border p-3.5 text-left transition-colors ${
        active
          ? "border-brand bg-[#F2FBEF] ring-1 ring-brand"
          : "border-[#DCE8D9] bg-white"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          active ? "border-brand" : "border-[#C9D8C5]"
        }`}
      >
        {active && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-bold leading-tight text-ink">
          {title}
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-tight text-ink-muted">
          {caption}
        </span>
      </span>
    </button>
  );
}

function PriceInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block flex-1 rounded-2xl border border-[#DCE8D9] bg-white px-3.5 py-2.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
      <span className="block text-[11px] text-ink-muted">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full bg-transparent text-[15px] font-bold text-ink outline-none placeholder:font-normal placeholder:text-ink-muted/60"
      />
    </label>
  );
}

export function WizardStep3AddDetails({
  form,
  serviceName,
  serviceIcon,
  groupingName,
  serviceArea,
  totalImageCount,
  maxImages,
  maxDescription,
  onSetField,
  onAddImages,
  onRemoveImageAt,
  onChangeService,
  onSubmit,
  isValid,
  isSubmitting,
  submitLabel,
}: WizardStep3AddDetailsProps) {
  // Stable object URLs for local file previews; revoked when files change.
  const fileUrls = useMemo(
    () => form.newImageFiles.map((f) => URL.createObjectURL(f)),
    [form.newImageFiles],
  );
  useEffect(
    () => () => fileUrls.forEach((u) => URL.revokeObjectURL(u)),
    [fileUrls],
  );
  const allImages = [...form.existingImageUrls, ...fileUrls];

  const unit = chargedPerUnit[form.chargedPer];
  const priceLabel =
    form.priceMode === "fixed"
      ? `Price (RWF/${unit})`
      : `Price Range (RWF/${unit})`;

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* Selected service banner */}
      <div className="flex items-center gap-3 rounded-2xl bg-[#E8F7E5] p-4">
        <IconBadge icon={serviceIcon} />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-ink">
            {serviceName}
          </span>
          {groupingName && (
            <span className="mt-0.5 block text-[12.5px] text-ink-muted">
              {groupingName}
            </span>
          )}
        </span>
        {onChangeService && (
          <button
            type="button"
            onClick={onChangeService}
            className="flex shrink-0 items-center gap-1.5 text-[13px] font-bold text-brand"
          >
            Change
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Photos */}
      <section>
        <h3 className="text-[15px] font-black text-ink">
          Add Photos <span className="font-semibold text-ink-muted">(optional)</span>
        </h3>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Show your work and build trust with employers.
        </p>
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {allImages.map((src, idx) => (
            <div
              key={src}
              className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-[#E8F7E5]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => onRemoveImageAt(idx)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {totalImageCount < maxImages && (
            <label className="flex h-[88px] w-[88px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#C9D8C5] bg-white text-ink-muted transition-colors hover:border-brand hover:text-brand">
              <Plus className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Add more</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    onAddImages(Array.from(e.target.files));
                    e.target.value = "";
                  }
                }}
              />
            </label>
          )}
        </div>
        <p className="mt-1.5 text-[11.5px] text-ink-muted">
          You can add up to {maxImages} photos
        </p>
      </section>

      {/* Price */}
      <section>
        <h3 className="text-[15px] font-black text-ink">Price</h3>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Set how you charge for this service.
        </p>

        <div className="mt-3 flex gap-2.5">
          <PriceModeCard
            title="Fixed Price"
            caption="Set one price"
            active={form.priceMode === "fixed"}
            onClick={() => onSetField("priceMode", "fixed" as PriceMode)}
          />
          <PriceModeCard
            title="Price Range"
            caption="Set minimum and maximum price"
            active={form.priceMode === "range"}
            onClick={() => onSetField("priceMode", "range" as PriceMode)}
          />
        </div>

        {/* Open to Negotiate */}
        <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-[#DCE8D9] bg-white p-3.5">
          <span className="min-w-0">
            <span className="block text-[13.5px] font-bold text-ink">
              Open to Negotiate
            </span>
            <span className="mt-0.5 block text-[11.5px] text-ink-muted">
              Employers can negotiate the price
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={form.negotiable}
            onClick={() => onSetField("negotiable", !form.negotiable)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              form.negotiable ? "bg-brand" : "bg-[#D5E2D2]"
            }`}
          >
            <span
              className={`absolute left-0 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                form.negotiable ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Price amount(s) */}
      <section>
        <h3 className="text-[14px] font-black text-ink">{priceLabel}</h3>
        <div className="mt-2.5 flex items-center gap-2.5">
          {form.priceMode === "fixed" ? (
            <PriceInput
              label="Price"
              value={form.priceMin}
              placeholder="20,000"
              onChange={(v) => onSetField("priceMin", v)}
            />
          ) : (
            <>
              <PriceInput
                label="Minimum price"
                value={form.priceMin}
                placeholder="15,000"
                onChange={(v) => onSetField("priceMin", v)}
              />
              <span className="text-ink-muted">–</span>
              <PriceInput
                label="Maximum price"
                value={form.priceMax}
                placeholder="25,000"
                onChange={(v) => onSetField("priceMax", v)}
              />
            </>
          )}
        </div>

        {/* Charged per */}
        <div className="mt-3 flex gap-2">
          {CHARGED_PER.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onSetField("chargedPer", value)}
              className={`flex-1 rounded-xl border px-2 py-2 text-[12.5px] font-bold transition-colors ${
                form.chargedPer === value
                  ? "border-brand bg-brand text-white"
                  : "border-[#DCE8D9] bg-white text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Service areas (auto-resolved from the worker's default address) */}
      <section>
        <h3 className="text-[14px] font-black text-ink">
          Service Areas <span className="font-semibold text-ink-muted">(optional)</span>
        </h3>
        <div className="mt-2.5 flex items-center gap-3 rounded-2xl border border-[#DCE8D9] bg-white p-3.5">
          <MapPin className="h-5 w-5 shrink-0 text-brand" />
          <span className="flex-1 text-[14px] font-semibold text-ink">
            {serviceArea || "Your default area"}
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted" />
        </div>
      </section>

      {/* Description */}
      <section>
        <h3 className="text-[14px] font-black text-ink">
          Description <span className="font-semibold text-ink-muted">(optional)</span>
        </h3>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Tell clients a bit about your service...
        </p>
        <div className="mt-2.5 rounded-2xl border border-[#DCE8D9] bg-white p-3.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
          <textarea
            value={form.description}
            maxLength={maxDescription}
            rows={3}
            placeholder="I provide thorough cleaning for homes and offices. I pay attention to details and use quality products."
            onChange={(e) => onSetField("description", e.target.value)}
            className="w-full resize-none bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-muted/60"
          />
          <p className="text-right text-[11px] text-ink-muted">
            {form.description.length}/{maxDescription}
          </p>
        </div>
      </section>

      {/* Sticky submit */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[428px] border-t border-[#DCE8D9] bg-surface px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <AppButton
          type="button"
          className="w-full"
          disabled={!isValid || isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Saving…" : submitLabel}
        </AppButton>
      </div>
    </div>
  );
}
