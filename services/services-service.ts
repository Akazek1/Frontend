import api from "@/lib/axios";
import type { Service } from "@/types";

export type ChargedPer = "one_time" | "daily" | "weekly" | "monthly";

export interface ServiceCategory {
  id: string;
  name: string;
  nameKn?: string;
  nameFr?: string;
  /** Provider role noun for this type, e.g. "Cleaner" for "Cleaning". */
  providerLabel?: string | null;
  providerLabelKn?: string | null;
  providerLabelFr?: string | null;
  icon?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateServicePayload {
  description?: string;
  /** Fixed price = same min/max; range = distinct values. */
  priceMin: number;
  priceMax: number;
  chargedPer: ChargedPer;
  /** "Open to Negotiate" — price stays visible, employers can discuss it. */
  negotiable?: boolean;
  categoryId: string;
  serviceImages?: string[];
  /** Raw File objects from the picker. When present, the request is sent
   *  as multipart and the backend uploads each to Cloudinary. */
  imageFiles?: File[];
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

export interface BrowseServicesParams {
  category?: string;
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  serviceType?: string;
  available?: boolean;
  location?: string;
  page?: number;
  limit?: number;
}

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
 * Reverse mapping for the wizard's edit flow. Recovers (priceMin, priceMax,
 * chargedPer) from a backend record that may carry a non-wizard priceType.
 */
export function fromBackendPriceFields(service: Pick<Service, "priceMin" | "priceMax" | "priceType">): {
  priceMin: number;
  priceMax: number;
  chargedPer: ChargedPer;
} {
  const priceMin = service.priceMin ?? service.priceMax ?? 0;
  const priceMax = service.priceMax ?? service.priceMin ?? 0;
  const raw = (service.priceType || "daily").toLowerCase();
  const chargedPer: ChargedPer =
    raw === "one_time" || raw === "fixed"
      ? "one_time"
      : raw === "weekly"
      ? "weekly"
      : raw === "monthly"
      ? "monthly"
      : "daily";
  return { priceMin, priceMax, chargedPer };
}

/** Map the wizard payload onto the flat body POST/PATCH /services expects. */
function toBackendBody(payload: CreateServicePayload | UpdateServicePayload) {
  const { imageFiles, serviceImages, priceMin, priceMax, chargedPer, ...rest } =
    payload as CreateServicePayload;

  const body: Record<string, unknown> = { ...rest };
  if (typeof priceMin === "number") body.priceMin = priceMin;
  if (typeof priceMax === "number") body.priceMax = priceMax;
  if (chargedPer) body.priceType = chargedPer;
  if (serviceImages !== undefined) {
    body.serviceImages = serviceImages;
  }
  return body;
}

function buildMultipart(payload: CreateServicePayload | UpdateServicePayload) {
  const form = new FormData();
  form.append("data", JSON.stringify(toBackendBody(payload)));
  payload.imageFiles?.forEach((file) => form.append("serviceImages", file));
  return form;
}

// Photo uploads stream each image to Cloudinary one-by-one on the server, so a
// few photos can easily take longer than the axios default (30s). Give just the
// multipart requests a generous timeout instead of raising it globally.
const UPLOAD_TIMEOUT_MS = 120000;

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

  /**
   * Marketplace browse — the full filter set the public listing pages use.
   * Returns the personalized/ranked list from GET /services.
   */
  async browse(params: BrowseServicesParams = {}): Promise<Service[]> {
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
    const response = hasFiles
      ? await api.post("/services", buildMultipart(payload), { timeout: UPLOAD_TIMEOUT_MS })
      : await api.post("/services", toBackendBody(payload));
    return unwrap<Service>(response.data);
  },

  async update(id: string, payload: UpdateServicePayload): Promise<Service> {
    const hasFiles = (payload.imageFiles?.length ?? 0) > 0;
    const response = hasFiles
      ? await api.patch(`/services/${id}`, buildMultipart(payload), { timeout: UPLOAD_TIMEOUT_MS })
      : await api.patch(`/services/${id}`, toBackendBody(payload));
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

  /**
   * One-tap registration: pick one or more job-type (category) ids and the
   * backend creates a minimal listing for each, skipping ones already owned.
   */
  async register(categoryIds: string[]): Promise<{
    created: Service[];
    createdCount: number;
    skipped: { categoryId: string; reason: string }[];
  }> {
    const response = await api.post("/services/register", { categoryIds });
    return unwrap(response.data);
  },
};

export default servicesService;
