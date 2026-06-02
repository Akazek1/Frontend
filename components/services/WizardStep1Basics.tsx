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
import { Button } from "@/components/ui/button";
import { ChargedPerRadio } from "@/components/services/ChargedPerRadio";
import { TipCard } from "@/components/services/TipCard";
import type { WizardFormState } from "@/hooks/useAddServiceForm";
import type { ServiceCategory, ChargedPer } from "@/services/services-service";

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
        <p className="text-[12px] font-black uppercase tracking-wide text-[#145B10]">
          Step 1 of 2
        </p>
        <h2 className="mt-1 text-[22px] font-black text-[#1B2431]">
          Basic Information
        </h2>
        <p className="mt-1 text-[13px] text-[#475467]">
          Let&apos;s start with the essential details for your service.
        </p>
      </header>

      {/* Category */}
      <section className="flex flex-col gap-2">
        <label className="text-[13px] font-black text-[#1B2431]">
          Service Category <span className="text-[#FF3D00]">*</span>
        </label>
        <Select
          value={form.categoryId}
          onValueChange={(v) => onSetField("categoryId", v)}
          disabled={categoriesLoading}
        >
          <SelectTrigger className="h-12 border-[#DCEEDD] bg-white text-[14px]">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F1FCEF]">
                <LayoutGrid className="h-4 w-4 text-[#145B10]" />
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
      </section>

      {/* Price */}
      <section className="flex flex-col gap-2">
        <label
          htmlFor="service-price"
          className="text-[13px] font-black text-[#1B2431]"
        >
          How much do you charge? <span className="text-[#FF3D00]">*</span>
        </label>
        <div className="flex h-12 items-center overflow-hidden rounded-md border border-[#DCEEDD] bg-white focus-within:ring-2 focus-within:ring-[#145B10]/30">
          <span className="border-r border-[#DCEEDD] bg-[#F1FCEF] px-3 text-[13px] font-black text-[#145B10]">
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
      </section>

      {/* Charged per */}
      <section className="flex flex-col gap-2">
        <p className="text-[13px] font-black text-[#1B2431]">
          Charged per <span className="text-[#FF3D00]">*</span>
        </p>
        <ChargedPerRadio
          value={form.chargedPer}
          onChange={(next: ChargedPer) => onSetField("chargedPer", next)}
        />
      </section>

      <TipCard
        dismissible={false}
        body="You can edit these details anytime after creating your service card."
      />

      {/* Sticky CTA */}
      <div className="sticky bottom-0 -mx-4 mt-2 border-t border-[#DCEEDD] bg-white px-4 pb-[env(safe-area-inset-bottom)] pt-3">
        <Button
          type="submit"
          disabled={!isValid}
          className="h-12 w-full bg-[#145B10] text-[15px] font-black text-white hover:bg-[#0F4D0C] disabled:bg-[#DCEEDD] disabled:text-[#667085]"
        >
          Continue →
        </Button>
      </div>
    </form>
  );
}
