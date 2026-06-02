import api from "@/lib/axios";
import type { Service } from "@/types";

export type ChargedPer = "one_time" | "daily" | "weekly" | "monthly";

export interface ServiceCategory {
  id: string;
  name: string;
  nameKn?: string;
  nameFr?: string;
  icon?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateServicePayload {
  title: string;
  description: string;
  price: number;
  chargedPer: ChargedPer;
  categoryId: string;
  serviceImages?: string[];
  /** Raw File objects from the picker. When present, the request is sent
   *  as multipart and the backend uploads each to Cloudinary. */
  imageFiles?: File[];
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

interface ApiEnvelope<T> {
  data?: T;
  statusCode?: number;
  message?: string;
  timestamp?: string;
}

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in (payload as any)) {
    const inner = (payload as ApiEnvelope<T>).data;
    if (inner !== undefined) return inner;
  }
  return payload as T;
}

/**
 * Map a ChargedPer value to the priceMin/priceMax/priceType triplet the
 * backend expects. The wizard collects a single rate, so min === max.
 */
function toBackendPriceFields(price: number, chargedPer: ChargedPer) {
  return {
    priceMin: price,
    priceMax: price,
    priceType: chargedPer,
  };
}

/**
 * Reverse mapping for the wizard's edit flow. Tries hard to recover a
 * (price, chargedPer) pair from a legacy backend record that may carry
 * priceMin !== priceMax or a non-wizard priceType.
 */
export function fromBackendPriceFields(service: Pick<Service, "priceMin" | "priceMax" | "priceType">): {
  price: number;
  chargedPer: ChargedPer;
} {
  const price = service.priceMax ?? service.priceMin ?? 0;
  const raw = (service.priceType || "daily").toLowerCase();
  const chargedPer: ChargedPer =
    raw === "one_time" || raw === "fixed"
      ? "one_time"
      : raw === "weekly"
      ? "weekly"
      : raw === "monthly"
      ? "monthly"
      : "daily";
  return { price, chargedPer };
}

function buildMultipart(payload: CreateServicePayload | UpdateServicePayload) {
  const form = new FormData();

  const { imageFiles, serviceImages, price, chargedPer, ...rest } = payload as CreateServicePayload;

  const data: Record<string, unknown> = { ...rest };
  if (typeof price === "number" && chargedPer) {
    Object.assign(data, toBackendPriceFields(price, chargedPer));
  }
  if (serviceImages && serviceImages.length > 0) {
    data.serviceImages = serviceImages;
  }

  form.append("data", JSON.stringify(data));
  imageFiles?.forEach((file) => form.append("serviceImages", file));
  return form;
}

const servicesService = {
  async list(params: {
    providerId?: string;
    providerUsername?: string;
    category?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<Service[]> {
    const response = await api.get("/services", { params });
    return unwrap<Service[]>(response.data);
  },

  async getById(id: string): Promise<Service> {
    const response = await api.get(`/services/${id}`);
    return unwrap<Service>(response.data);
  },

  async listCategories(): Promise<ServiceCategory[]> {
    const response = await api.get("/services/categories");
    return unwrap<ServiceCategory[]>(response.data);
  },

  async create(payload: CreateServicePayload): Promise<Service> {
    const hasFiles = (payload.imageFiles?.length ?? 0) > 0;
    if (hasFiles) {
      const form = buildMultipart(payload);
      const response = await api.post("/services", form);
      return unwrap<Service>(response.data);
    }

    const { price, chargedPer, imageFiles, ...rest } = payload;
    const response = await api.post("/services", {
      ...rest,
      ...toBackendPriceFields(price, chargedPer),
    });
    return unwrap<Service>(response.data);
  },

  async update(id: string, payload: UpdateServicePayload): Promise<Service> {
    const hasFiles = (payload.imageFiles?.length ?? 0) > 0;
    if (hasFiles) {
      const form = buildMultipart(payload);
      const response = await api.patch(`/services/${id}`, form);
      return unwrap<Service>(response.data);
    }

    const { price, chargedPer, imageFiles, ...rest } = payload;
    const body: Record<string, unknown> = { ...rest };
    if (typeof price === "number" && chargedPer) {
      Object.assign(body, toBackendPriceFields(price, chargedPer));
    }
    const response = await api.patch(`/services/${id}`, body);
    return unwrap<Service>(response.data);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/services/${id}`);
  },

  /**
   * Deactivate (or reactivate) a service via PATCH /services/:id.
   *
   * This is the user-facing flow exposed in the UI as "Deactivate" /
   * "Activate". Hard-delete is intentionally not exposed to owners — it
   * would let workers shed bad reviews by recreating the same card.
   */
  async setActive(id: string, isActive: boolean): Promise<Service> {
    const response = await api.patch(`/services/${id}`, { isActive });
    return unwrap<Service>(response.data);
  },

  async setAvailability(available: boolean): Promise<{ id: string; availableForWork: boolean }> {
    const response = await api.patch("/users/me/availability", { available });
    return unwrap<{ id: string; availableForWork: boolean }>(response.data);
  },
};

export default servicesService;
