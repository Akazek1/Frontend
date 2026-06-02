"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import servicesService, {
  ChargedPer,
  CreateServicePayload,
  fromBackendPriceFields,
} from "@/services/services-service";
import type { Service } from "@/types";

export interface WizardFormState {
  /** Step 1 */
  categoryId: string;
  price: string; // kept as string while typing; coerced to number on submit
  chargedPer: ChargedPer;
  /** Step 2 */
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
const MAX_IMAGES = 5;

function emptyForm(): WizardFormState {
  return {
    categoryId: "",
    price: "",
    chargedPer: "daily",
    title: "",
    description: "",
    existingImageUrls: [],
    newImageFiles: [],
  };
}

function rehydrateFromService(service: Service): WizardFormState {
  const { price, chargedPer } = fromBackendPriceFields(service);
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
    categoryId,
    price: price ? String(price) : "",
    chargedPer,
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
      categoryId: state.categoryId,
      price: state.price,
      chargedPer: state.chargedPer,
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

  const isStep1Valid = useMemo(() => {
    const priceNum = Number(form.price);
    return (
      !!form.categoryId &&
      !!form.chargedPer &&
      Number.isFinite(priceNum) &&
      priceNum > 0
    );
  }, [form.categoryId, form.chargedPer, form.price]);

  const isStep2Valid = useMemo(() => {
    return (
      totalImageCount > 0 &&
      form.title.trim().length > 0 &&
      form.description.trim().length > 0
    );
  }, [form.title, form.description, totalImageCount]);

  const submit = useCallback(async (): Promise<Service> => {
    if (!isStep1Valid || !isStep2Valid) {
      throw new Error("Form is not yet valid");
    }
    setIsSubmitting(true);
    try {
      const payload: CreateServicePayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        chargedPer: form.chargedPer,
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
    isStep1Valid,
    isStep2Valid,
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
    submit,
    isSubmitting,
    reset,
    maxImages: MAX_IMAGES,
  };
}

/** Test-only helper exposed for spec tests. */
export const __internals = {
  emptyForm,
  rehydrateFromService,
  storagePrefix: STORAGE_PREFIX,
  maxImages: MAX_IMAGES,
};
