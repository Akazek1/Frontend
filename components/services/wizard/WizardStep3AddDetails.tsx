"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight, Loader2, MapPin, Pencil, Plus, X } from "lucide-react";
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
  onReorderImages: (from: number, to: number) => void;
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

const LONG_PRESS_MS = 350;
const ITEM_STEP_PX = 98; // 88px thumb + 10px gap

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
  onReorderImages,
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

  // ── Long-press drag-to-reorder (in addition to the arrow buttons) ─────────
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartRef = useRef<{ idx: number; x: number } | null>(null);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null); // long-press charging
  const [drag, setDrag] = useState<{ fromIdx: number; toIdx: number } | null>(null);

  // Visual display order — reorders live while dragging so the user sees a preview.
  const displayOrder = useMemo(() => {
    const indices = allImages.map((_, i) => i);
    if (!drag || drag.fromIdx === drag.toIdx) return indices;
    const arr = [...indices];
    const [moved] = arr.splice(drag.fromIdx, 1);
    arr.splice(drag.toIdx, 0, moved);
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allImages.length, drag]);

  const cancelPress = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
    pointerStartRef.current = null;
    setPendingIdx(null);
  };

  const onPhotoPointerDown = (e: ReactPointerEvent<HTMLDivElement>, idx: number) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerStartRef.current = { idx, x: e.clientX };
    setPendingIdx(idx);
    pressTimerRef.current = setTimeout(() => {
      if (pointerStartRef.current?.idx === idx) {
        setDrag({ fromIdx: idx, toIdx: idx });
        setPendingIdx(null);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          (navigator as Navigator & { vibrate: (ms: number) => void }).vibrate(10);
        }
      }
    }, LONG_PRESS_MS);
  };

  const onPhotoPointerMove = (e: ReactPointerEvent<HTMLDivElement>, idx: number) => {
    if (!pointerStartRef.current || pointerStartRef.current.idx !== idx) return;
    const dx = e.clientX - pointerStartRef.current.x;
    if (!drag) {
      // Cancel the long-press if the finger slides before the hold fires.
      if (Math.abs(dx) > 6) cancelPress();
      return;
    }
    const steps = Math.round(dx / ITEM_STEP_PX);
    const toIdx = Math.max(0, Math.min(allImages.length - 1, drag.fromIdx + steps));
    setDrag((prev) => (prev ? { ...prev, toIdx } : null));
  };

  const onPhotoPointerUp = (_e: ReactPointerEvent<HTMLDivElement>, idx: number) => {
    if (!pointerStartRef.current || pointerStartRef.current.idx !== idx) return;
    cancelPress();
    if (drag) {
      if (drag.fromIdx !== drag.toIdx) onReorderImages(drag.fromIdx, drag.toIdx);
      setDrag(null);
    }
  };

  const onPhotoPointerCancel = () => {
    cancelPress();
    setDrag(null);
  };
  // ──────────────────────────────────────────────────────────────────────────

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
          {displayOrder.map((originalIdx, displayPos) => {
            const src = allImages[originalIdx];
            const isFirst = originalIdx === 0;
            const isLast = originalIdx === allImages.length - 1;
            const canReorder = allImages.length > 1;
            const isBeingDragged = drag?.fromIdx === originalIdx;
            const isCharging = pendingIdx === originalIdx;
            return (
              <div
                key={src}
                className={[
                  "relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-[#E8F7E5] select-none transition-transform duration-150",
                  isBeingDragged ? "scale-110 shadow-xl ring-2 ring-brand z-10" : "",
                  isCharging ? "scale-95 opacity-70" : "",
                ].join(" ")}
                style={{ touchAction: "none" }}
                onPointerDown={(e) => onPhotoPointerDown(e, originalIdx)}
                onPointerMove={(e) => onPhotoPointerMove(e, originalIdx)}
                onPointerUp={(e) => onPhotoPointerUp(e, originalIdx)}
                onPointerCancel={onPhotoPointerCancel}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover pointer-events-none" />

                {/* Cover badge on first position */}
                {displayPos === 0 && canReorder && (
                  <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    Cover
                  </span>
                )}

                {/* Remove — hidden during an active drag to avoid mis-taps.
                    stopPropagation keeps the tap from starting a drag. */}
                {!drag && (
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onRemoveImageAt(originalIdx)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}

                {/* Move left / right — tappable reordering. Hidden during a
                    drag; stopPropagation keeps taps from starting a drag. */}
                {canReorder && !drag && (
                  <div className="absolute inset-x-0 bottom-0 flex justify-between">
                    <button
                      type="button"
                      aria-label="Move photo left"
                      disabled={isFirst}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => onReorderImages(originalIdx, originalIdx - 1)}
                      className="flex h-5 w-5 items-center justify-center rounded-tr-md bg-ink/70 text-white disabled:opacity-0"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move photo right"
                      disabled={isLast}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => onReorderImages(originalIdx, originalIdx + 1)}
                      className="flex h-5 w-5 items-center justify-center rounded-tl-md bg-ink/70 text-white disabled:opacity-0"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
          {allImages.length > 1 ? "Use the arrows to reorder · First photo is the cover · " : ""}You can add up to {maxImages} photos
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
