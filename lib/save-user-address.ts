import api from "@/lib/axios";

export interface SaveAddressInput {
  city: string;
  district?: string;
  sector?: string;
  /**
   * Finer-grained location (e.g. "Village, Cell") preserved here because the
   * Address schema has no cell/village columns. `street` is the only free-text
   * field the backend DTO whitelists, so the detail a user selects isn't lost.
   */
  street?: string;
  lat?: number;
  lng?: number;
}

/**
 * Persists a user's default address. Only sends fields the backend's
 * CreateAddressDto/Address schema actually accept (street, city, district,
 * sector, latitude, longitude) — the API runs forbidNonWhitelisted validation,
 * so unknown fields like province/cell/village cause a silent 400.
 */
export async function saveUserAddress(loc: SaveAddressInput) {
  return api.post("/users/addresses", {
    city: loc.city,
    district: loc.district || undefined,
    sector: loc.sector || undefined,
    street: loc.street || undefined,
    isDefault: true,
    ...(loc.lat != null && loc.lng != null ? { latitude: loc.lat, longitude: loc.lng } : {}),
  });
}
