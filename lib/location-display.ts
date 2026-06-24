export type AddressDisplay = {
  city?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  country?: string | null;
};

function clean(part?: string | null) {
  const value = part?.trim();
  return value || null;
}

export function formatAddressLocation(address?: AddressDisplay | null, options: { includeCountry?: boolean } = {}) {
  if (!address) return "";
  const parts = [address.district, address.sector, address.cell]
    .map(clean)
    .filter((part): part is string => Boolean(part));

  if (parts.length === 0) {
    const fallback = clean(address.city);
    if (fallback) parts.push(fallback);
  }

  if (options.includeCountry) {
    const country = clean(address.country);
    if (country) parts.push(country);
  }

  return Array.from(new Set(parts)).join(", ");
}
