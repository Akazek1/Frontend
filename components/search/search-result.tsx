"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import ServiceCard from "@/components/service-card";
import { Service } from "@/types";
import { formatPrice } from "@/lib/utils";
import {
  getBookingType,
  getProviderHandle,
  getServiceCardImage,
  getServiceDetailPath,
} from "@/lib/service-display";

type ServiceTypeFilter = "INDIVIDUAL" | "AGENCY" | "COMPANY";
type AvailabilityFilter = "available" | "unavailable";

interface SearchFilters {
  serviceType?: ServiceTypeFilter;
  availability?: AvailabilityFilter;
  location?: string;
  distanceKm?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

interface SearchResultsProps {
  query: string;
  onBack: () => void;
  initialFilterOpen?: boolean;
}

const SERVICE_TYPES: Array<{ label: string; value: ServiceTypeFilter }> = [
  { label: "Individual", value: "INDIVIDUAL" },
  { label: "Agency", value: "AGENCY" },
  { label: "Company", value: "COMPANY" },
];

const AVAILABILITY_OPTIONS: Array<{ label: string; value: AvailabilityFilter }> = [
  { label: "Available", value: "available" },
  { label: "Unavailable", value: "unavailable" },
];

const DISTANCE_OPTIONS = [2, 5, 10, 25];
const LOCATION_OPTIONS = ["Kicukiro", "Nyarugenge", "Gasabo", "Kigali", "Remera"];
const RATING_OPTIONS = [4.5, 4, 3.5];

const SearchResults = ({ query: initialQuery, onBack, initialFilterOpen = false }: SearchResultsProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [services, setServices] = useState<Service[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [draftFilters, setDraftFilters] = useState<SearchFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(initialFilterOpen);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRequestRef = useRef(0);
  const router = useRouter();

  const popularSearches = useMemo(
    () => [
      "Electrician",
      "House Cleaning",
      "Nanny / Childcare",
      "Plumber",
      "Painter",
      "Carpenter",
      "Gardening",
      "Cook",
      "Driver",
      "Laundry",
      "Security Guard",
      "AC Repair",
    ],
    []
  );

  const activeFilterCount = Object.values(filters).filter((value) => value !== undefined && value !== "").length;
  const hasSearchInput = Boolean(query.trim());
  const hasActiveFilters = activeFilterCount > 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const requestId = searchRequestRef.current + 1;
      searchRequestRef.current = requestId;

      if (hasSearchInput || hasActiveFilters) {
        fetchServices(query, filters, requestId);
      } else {
        setServices([]);
        setError(null);
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, filters, hasSearchInput, hasActiveFilters]);

  const fetchServices = async (
    searchQuery: string,
    selectedFilters: SearchFilters,
    requestId: number
  ) => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("searchTerm", searchQuery.trim());
    if (selectedFilters.serviceType) params.set("serviceType", selectedFilters.serviceType);
    if (selectedFilters.availability) {
      params.set("available", selectedFilters.availability === "available" ? "true" : "false");
    }
    if (selectedFilters.location) params.set("location", selectedFilters.location);
    if (selectedFilters.distanceKm) params.set("distanceKm", String(selectedFilters.distanceKm));
    if (selectedFilters.minPrice) params.set("minPrice", String(selectedFilters.minPrice));
    if (selectedFilters.maxPrice) params.set("maxPrice", String(selectedFilters.maxPrice));
    if (selectedFilters.minRating) params.set("minRating", String(selectedFilters.minRating));

    try {
      const response = await api.get(`/services?${params.toString()}`);

      if (response.status !== 200) {
        throw new Error("Failed to fetch services");
      }

      const data: Service[] = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      if (requestId !== searchRequestRef.current) return;
      setServices(data);
    } catch {
      if (requestId !== searchRequestRef.current) return;
      setError("Something went wrong while fetching services.");
      setServices([]);
    } finally {
      if (requestId !== searchRequestRef.current) return;
      setIsLoading(false);
    }
  };

  const openFilters = () => {
    setDraftFilters(filters);
    setIsFilterOpen(true);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters({});
    setFilters({});
    setIsFilterOpen(false);
  };

  const removeFilter = (key: keyof SearchFilters) => {
    setFilters((current) => ({ ...current, [key]: undefined }));
  };

  const filterLabels = [
    filters.serviceType && {
      key: "serviceType" as const,
      label: SERVICE_TYPES.find((type) => type.value === filters.serviceType)?.label,
    },
    filters.availability && {
      key: "availability" as const,
      label: AVAILABILITY_OPTIONS.find((option) => option.value === filters.availability)?.label,
    },
    filters.location && { key: "location" as const, label: filters.location },
    filters.distanceKm && { key: "distanceKm" as const, label: `${filters.distanceKm} km` },
    filters.minPrice && { key: "minPrice" as const, label: `From ${filters.minPrice.toLocaleString()} RWF` },
    filters.maxPrice && { key: "maxPrice" as const, label: `Up to ${filters.maxPrice.toLocaleString()} RWF` },
    filters.minRating && { key: "minRating" as const, label: `${filters.minRating}+ stars` },
  ].filter(Boolean) as Array<{ key: keyof SearchFilters; label?: string }>;

  const showDiscovery = !hasSearchInput && !hasActiveFilters;
  const resultLabel = hasSearchInput ? ` for "${query.trim()}"` : " for your filters";

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 rounded-full"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-[17px] font-bold leading-5 text-[#1B2431]">Find Home Services</h1>
          <p className="mt-0.5 text-[12px] leading-4 text-[#687268]">Names, services, categories, and places.</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative min-w-0 flex-1">
          <Icons.SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 fill-[#878787]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search name, service, category..."
            className="h-12 w-full rounded-2xl border border-[#DDE3DD] bg-white pl-11 pr-10 text-[14px] font-medium text-[#1B2431] shadow-sm outline-none transition placeholder:text-[13px] placeholder:font-medium placeholder:text-[#7A827A] focus:border-[#145B10] focus:ring-2 focus:ring-[#145B10]/20"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#7A827A] hover:bg-gray-100"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={openFilters}
          className="relative flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-[#DDE3DD] bg-white px-4 shadow-sm transition active:scale-95 hover:border-[#145B10] hover:bg-[#F1F8F1]"
          aria-label="Open filters"
        >
          <SlidersHorizontal className="h-[18px] w-[18px] text-[#145B10]" />
          <span className="text-[13px] font-bold text-[#1B2431]">Filter</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#145B10] px-1 text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {filterLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterLabels.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => removeFilter(filter.key)}
              className="flex min-h-8 items-center gap-1 rounded-full bg-[#E8F5E9] px-3 text-[12px] font-semibold text-[#145B10]"
            >
              {filter.label}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-6 text-sm text-[#687268]">
          <Loader2 className="h-4 w-4 animate-spin text-[#145B10]" />
          Finding matching services...
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {!isLoading && !error && (hasSearchInput || hasActiveFilters) && services.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-[16px] font-bold text-[#1B2431]">Matching Services</h2>
            <p className="text-[12px] text-[#687268]">
              {services.length} {services.length === 1 ? "match" : "matches"}{resultLabel}
            </p>
          </div>
          <div className="grid gap-4">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                image={getServiceCardImage(service)}
                profileImage={service.provider.profilePicture}
                name={`${service.provider.firstName || ""} ${service.provider.lastName || ""}`.trim()}
                handle={getProviderHandle(service.provider)}
                title={service.title}
                experience={service.description || ""}
                languages={Array.isArray(service.provider.languages) ? service.provider.languages.join(", ") : ""}
                location={Array.isArray(service.serviceAreas) ? service.serviceAreas[0] || "" : ""}
                price={formatPrice(service.priceMin, service.priceMax, service.priceType)}
                rating={service.reviews?.averageRating || 0}
                reviews={service.reviews?.totalReviews || 0}
                distance={filters.distanceKm ? `Within ${filters.distanceKm} km` : "Nearby"}
                available={service.isActive}
                verified={service.provider.isVerified}
                onClick={() => router.push(getServiceDetailPath(service))}
                onHireClick={() => router.push(`/book/${getBookingType(service)}/${service.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && (hasSearchInput || hasActiveFilters) && services.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#DDE3DD] bg-white px-5 py-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F6F1]">
            <Search className="h-5 w-5 text-[#145B10]" />
          </div>
          <h3 className="text-[15px] font-bold text-[#1B2431]">No services found</h3>
          <p className="mx-auto mt-1 max-w-[260px] text-[13px] leading-5 text-[#687268]">
            Try a broader search, a different area, or fewer filters.
          </p>
        </div>
      )}

      {showDiscovery && (
        <div className="space-y-3">
          <h2 className="text-[16px] font-bold leading-5 text-[#1B2431]">Popular Searches</h2>
          <div className="flex flex-wrap items-center gap-2">
            {popularSearches.map((search, index) => (
              <button
                key={index}
                type="button"
                className="flex min-h-9 items-center gap-1 rounded-full border border-[#E1E8E1] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#1B2431] transition hover:border-[#145B10] hover:bg-[#F1F8F1] hover:text-[#145B10]"
                onClick={() => setQuery(search)}
              >
                {search}
                <ArrowLeft className="h-3.5 w-3.5 rotate-[145deg]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {isFilterOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
          <div className="w-full max-w-md rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-[17px] font-bold text-[#1B2431]">Filters</h2>
                <p className="text-[12px] text-[#687268]">Choose what should appear in the cards.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5">
              <FilterGroup title="Service type">
                <SegmentedOptions
                  options={SERVICE_TYPES}
                  value={draftFilters.serviceType}
                  onChange={(value) => setDraftFilters((current) => ({ ...current, serviceType: value as ServiceTypeFilter }))}
                />
              </FilterGroup>

              <FilterGroup title="Availability">
                <SegmentedOptions
                  options={AVAILABILITY_OPTIONS}
                  value={draftFilters.availability}
                  onChange={(value) => setDraftFilters((current) => ({ ...current, availability: value as AvailabilityFilter }))}
                />
              </FilterGroup>

              <FilterGroup title="Area">
                <div className="grid grid-cols-2 gap-2">
                  {LOCATION_OPTIONS.map((location) => (
                    <OptionButton
                      key={location}
                      label={location}
                      selected={draftFilters.location === location}
                      onClick={() => setDraftFilters((current) => ({
                        ...current,
                        location: current.location === location ? undefined : location,
                      }))}
                    />
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup title="Distance">
                <div className="grid grid-cols-4 gap-2">
                  {DISTANCE_OPTIONS.map((distance) => (
                    <OptionButton
                      key={distance}
                      label={`${distance} km`}
                      selected={draftFilters.distanceKm === distance}
                      onClick={() => setDraftFilters((current) => ({
                        ...current,
                        distanceKm: current.distanceKm === distance ? undefined : distance,
                      }))}
                    />
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup title="Price range">
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput
                    label="Min"
                    value={draftFilters.minPrice}
                    onChange={(value) => setDraftFilters((current) => ({ ...current, minPrice: value }))}
                  />
                  <NumberInput
                    label="Max"
                    value={draftFilters.maxPrice}
                    onChange={(value) => setDraftFilters((current) => ({ ...current, maxPrice: value }))}
                  />
                </div>
              </FilterGroup>

              <FilterGroup title="Rating">
                <div className="grid grid-cols-3 gap-2">
                  {RATING_OPTIONS.map((rating) => (
                    <OptionButton
                      key={rating}
                      label={`${rating}+`}
                      selected={draftFilters.minRating === rating}
                      onClick={() => setDraftFilters((current) => ({
                        ...current,
                        minRating: current.minRating === rating ? undefined : rating,
                      }))}
                    />
                  ))}
                </div>
              </FilterGroup>
            </div>

            <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">
              <button
                type="button"
                onClick={clearFilters}
                className="h-12 flex-1 rounded-2xl border border-gray-200 bg-white text-[13px] font-bold text-[#1B2431]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="h-12 flex-1 rounded-2xl bg-[#145B10] text-[13px] font-bold text-white shadow-lg shadow-[#145B10]/20"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="text-[13px] font-bold text-[#1B2431]">{title}</h3>
    {children}
  </div>
);

const SegmentedOptions = ({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: string }>;
  value?: string;
  onChange: (value: string | undefined) => void;
}) => (
  <div className="grid grid-cols-3 gap-2">
    {options.map((option) => (
      <OptionButton
        key={option.value}
        label={option.label}
        selected={value === option.value}
        onClick={() => onChange(value === option.value ? undefined : option.value)}
      />
    ))}
  </div>
);

const OptionButton = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-h-10 items-center justify-center gap-1 rounded-2xl border px-3 text-[12px] font-bold transition ${
      selected
        ? "border-[#145B10] bg-[#E8F5E9] text-[#145B10]"
        : "border-gray-200 bg-white text-[#4B554B] hover:border-[#145B10]/50"
    }`}
  >
    {selected && <Check className="h-3.5 w-3.5" />}
    {label}
  </button>
);

const NumberInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (value?: number) => void;
}) => (
  <label className="space-y-1">
    <span className="text-[11px] font-bold uppercase text-[#687268]">{label}</span>
    <input
      type="number"
      min={0}
      value={value || ""}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined)}
      className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-[13px] font-semibold text-[#1B2431] outline-none focus:border-[#145B10] focus:ring-2 focus:ring-[#145B10]/20"
      placeholder="RWF"
    />
  </label>
);

export default SearchResults;
