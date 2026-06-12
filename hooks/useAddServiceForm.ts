"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import servicesService, {
  ChargedPer,
  CreateServicePayload,
  fromBackendPriceFields,
} from "@/services/services-service";
import type { Service } from "@/types";

export type PriceMode = "fixed" | "range";

export interface WizardFormState {
  /** Step 1: Grouping (broad category) selection */
  groupingId: string;
  /** Step 2: Job type (category) selection */
  categoryId: string;
  /** Step 3: Pricing */
  priceMode: PriceMode;
  priceMin: string; // string while typing; coerced to number on submit
  priceMax: string;
  chargedPer: ChargedPer;
  /** "Open to Negotiate" — employers can discuss the stated price. */
  negotiable: boolean;
  /** Step 3: Details (both optional — title auto-derives from the category). */
  title: string;
  description: string;
  /** Image URLs already uploaded (edit mode rehydrate or after upload). */
  existingImageUrls: string[];
  /** Local File objects that still need to be uploaded with the request. */
  newImageFiles: File[];
}

interface UseAddServiceFormOptions {
  /** When set, this is an edit flow — rehydrate from the given service. */
  service?: Service;
  /** Stable session-storage key. Defaults to "new"; pass the service id for edits. */
  persistKey?: string;
}

const STORAGE_PREFIX = "hwa.addServiceForm.";
const MAX_IMAGES = 6;
const MAX_DESCRIPTION = 150;

function emptyForm(): WizardFormState {
  return {
    groupingId: "",
    categoryId: "",
    priceMode: "fixed",
    priceMin: "",
    priceMax: "",
    chargedPer: "daily",
    negotiable: false,
    title: "",
    description: "",
    existingImageUrls: [],
    newImageFiles: [],
  };
}

function rehydrateFromService(service: Service): WizardFormState {
  const { priceMin, priceMax, chargedPer } = fromBackendPriceFields(service);
  const categoryId =
    typeof service.category === "string"
      ? service.category
      : service.category?.id ?? "";
  const existing = [
    ...(service.serviceImages ?? []),
    ...(service.serviceImage && !service.serviceImages?.includes(service.serviceImage)
      ? [service.serviceImage]
      : []),
  ].filter(Boolean) as string[];
  return {
    groupingId: "", // edit flow starts at the details step; grouping not needed
    categoryId,
    priceMode: priceMin !== priceMax ? "range" : "fixed",
    priceMin: priceMin ? String(priceMin) : "",
    priceMax: priceMax ? String(priceMax) : "",
    chargedPer,
    negotiable: Boolean((service as { negotiable?: boolean }).negotiable),
    title: service.title ?? "",
    description: service.description ?? "",
    existingImageUrls: existing.slice(0, MAX_IMAGES),
    newImageFiles: [],
  };
}

function readSession(key: string): Partial<WizardFormState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    // File objects can't be serialized — sessionStorage only carries scalar fields.
    return JSON.parse(raw) as Partial<WizardFormState>;
  } catch {
    return null;
  }
}

function writeSession(key: string, state: WizardFormState) {
  if (typeof window === "undefined") return;
  try {
    const persistable = {
      groupingId: state.groupingId,
      categoryId: state.categoryId,
      priceMode: state.priceMode,
      priceMin: state.priceMin,
      priceMax: state.priceMax,
      chargedPer: state.chargedPer,
      negotiable: state.negotiable,
      title: state.title,
      description: state.description,
      existingImageUrls: state.existingImageUrls,
    };
    window.sessionStorage.setItem(
      STORAGE_PREFIX + key,
      JSON.stringify(persistable),
    );
  } catch {
    /* quota or private mode — silently skip */
  }
}

function clearSession(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function useAddServiceForm(options: UseAddServiceFormOptions = {}) {
  const { service, persistKey = service?.id ?? "new" } = options;
  const seededRef = useRef(false);

  const [form, setForm] = useState<WizardFormState>(() => {
    if (service) return rehydrateFromService(service);
    return emptyForm();
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rehydrate from sessionStorage on first client paint. Only do this when we
  // don't already have server-provided data (edit-mode pre-fill wins).
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    const saved = readSession(persistKey);
    if (!saved) return;
    setForm((prev) => ({
      ...prev,
      ...saved,
      // Files can't survive a refresh; keep any in-memory File[] we already have.
      newImageFiles: prev.newImageFiles,
    }));
  }, [persistKey]);

  // Persist on every change.
  useEffect(() => {
    if (!seededRef.current) return;
    writeSession(persistKey, form);
  }, [form, persistKey]);

  const setField = useCallback(
    <K extends keyof WizardFormState>(key: K, value: WizardFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const addImageFiles = useCallback((files: File[]) => {
    setForm((prev) => {
      const total = prev.existingImageUrls.length + prev.newImageFiles.length;
      const room = Math.max(0, MAX_IMAGES - total);
      if (room === 0) return prev;
      return {
        ...prev,
        newImageFiles: [...prev.newImageFiles, ...files.slice(0, room)],
      };
    });
  }, []);

  const removeImageAt = useCallback((index: number) => {
    setForm((prev) => {
      const existingCount = prev.existingImageUrls.length;
      if (index < existingCount) {
        const next = prev.existingImageUrls.slice();
        next.splice(index, 1);
        return { ...prev, existingImageUrls: next };
      }
      const newIdx = index - existingCount;
      const next = prev.newImageFiles.slice();
      next.splice(newIdx, 1);
      return { ...prev, newImageFiles: next };
    });
  }, []);

  const totalImageCount = useMemo(
    () => form.existingImageUrls.length + form.newImageFiles.length,
    [form.existingImageUrls.length, form.newImageFiles.length],
  );

  // Step 1: grouping picked
  const isStep1Valid = useMemo(() => !!form.groupingId, [form.groupingId]);

  // Step 2: job type picked
  const isStep2Valid = useMemo(() => !!form.categoryId, [form.categoryId]);

  // Step 3: price is the only required input — photos and description are
  // optional, and the title auto-derives from the category on the backend.
  const isStep3Valid = useMemo(() => {
    const minNum = Number(form.priceMin);
    if (!Number.isFinite(minNum) || minNum <= 0) return false;
    if (form.priceMode === "fixed") return !!form.chargedPer;
    const maxNum = Number(form.priceMax);
    return (
      Number.isFinite(maxNum) && maxNum >= minNum && !!form.chargedPer
    );
  }, [form.priceMode, form.priceMin, form.priceMax, form.chargedPer]);

  const submit = useCallback(async (): Promise<Service> => {
    if (!isStep2Valid || !isStep3Valid) {
      throw new Error("Form is not yet valid");
    }
    setIsSubmitting(true);
    try {
      const priceMin = Number(form.priceMin);
      const priceMax =
        form.priceMode === "fixed" ? priceMin : Number(form.priceMax);
      const payload: CreateServicePayload = {
        // Backend derives the title from the category name when omitted.
        title: form.title.trim() || undefined,
        description: form.description.trim().slice(0, MAX_DESCRIPTION) || undefined,
        priceMin,
        priceMax,
        chargedPer: form.chargedPer,
        negotiable: form.negotiable,
        categoryId: form.categoryId,
        serviceImages: form.existingImageUrls,
        imageFiles: form.newImageFiles,
      };
      const result = service
        ? await servicesService.update(service.id, payload)
        : await servicesService.create(payload);
      clearSession(persistKey);
      return result;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    form,
    isStep2Valid,
    isStep3Valid,
    persistKey,
    service,
  ]);

  const reset = useCallback(() => {
    setForm(service ? rehydrateFromService(service) : emptyForm());
    clearSession(persistKey);
  }, [persistKey, service]);

  return {
    form,
    setField,
    addImageFiles,
    removeImageAt,
    totalImageCount,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    submit,
    isSubmitting,
    reset,
    maxImages: MAX_IMAGES,
    maxDescription: MAX_DESCRIPTION,
  };
}

/** Test-only helper exposed for spec tests. */
export const __internals = {
  emptyForm,
  rehydrateFromService,
  storagePrefix: STORAGE_PREFIX,
  maxImages: MAX_IMAGES,
};
