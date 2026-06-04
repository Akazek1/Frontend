"use client";

import { LayoutGrid } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ChargedPerRadio } from "@/components/services/ChargedPerRadio";
import { TipCard } from "@/components/services/TipCard";
import type { WizardFormState } from "@/hooks/useAddServiceForm";
import type { ServiceCategory, ChargedPer } from "@/services/services-service";
import {
  AppButton,
  FormField,
  appInputClass,
} from "@/components/ui/app-primitives";

interface WizardStep1BasicsProps {
  form: WizardFormState;
  categories: ServiceCategory[];
  categoriesLoading: boolean;
  isValid: boolean;
  onSetField: <K extends keyof WizardFormState>(key: K, value: WizardFormState[K]) => void;
  onContinue: () => void;
}

export function WizardStep1Basics({
  form,
  categories,
  categoriesLoading,
  isValid,
  onSetField,
  onContinue,
}: WizardStep1BasicsProps) {
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (isValid) onContinue();
      }}
    >
      <header>
        <p className="text-[12px] font-black uppercase tracking-wide text-brand">
          Step 1 of 2
        </p>
        <h2 className="mt-1 text-[22px] font-black text-ink">
          Basic Information
        </h2>
        <p className="mt-1 text-[13px] text-[#475467]">
          Let&apos;s start with the essential details for your service.
        </p>
      </header>

      {/* Category */}
      <FormField label="Service Category" required>
        <Select
          value={form.categoryId}
          onValueChange={(v) => onSetField("categoryId", v)}
          disabled={categoriesLoading}
        >
          <SelectTrigger className={appInputClass}>
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface">
                <LayoutGrid className="h-4 w-4 text-brand" />
              </span>
              <SelectValue placeholder="Select a category" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <TipCard
          variant="lightbulb"
          dismissible={false}
          title=""
          body="Choose the category that best fits the service you provide."
        />
      </FormField>

      {/* Price */}
      <FormField label="How much do you charge?" required>
        <div className="flex h-12 items-center overflow-hidden rounded-md border border-[#DCEEDD] bg-white focus-within:ring-2 focus-within:ring-brand/30">
          <span className="border-r border-[#DCEEDD] bg-surface px-3 text-[13px] font-black text-brand">
            RWF
          </span>
          <Input
            id="service-price"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Enter amount"
            value={form.price}
            onChange={(e) => onSetField("price", e.target.value)}
            className="h-full border-0 focus-visible:ring-0"
          />
        </div>
      </FormField>

      {/* Charged per */}
      <FormField label="Charged per" required>
        <ChargedPerRadio
          value={form.chargedPer}
          onChange={(next: ChargedPer) => onSetField("chargedPer", next)}
        />
      </FormField>

      <TipCard
        dismissible={false}
        body="You can edit these details anytime after creating your service card."
      />

      {/* Sticky CTA */}
      <div className="sticky bottom-0 -mx-4 mt-2 border-t border-[#DCEEDD] bg-white px-4 pb-[env(safe-area-inset-bottom)] pt-3">
        <AppButton
          type="submit"
          disabled={!isValid}
          className="w-full text-[15px] font-black disabled:bg-[#DCEEDD] disabled:text-[#667085]"
        >
          Continue →
        </AppButton>
      </div>
    </form>
  );
}
