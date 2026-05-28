"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  Check,
  Loader2,
  MapPin,
  Search,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import ServiceCard from "@/components/service-card";
import { Service } from "@/types";
import { Job } from "@/services/jobs-service";
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

interface JobFilters {
  minBudget?: number;
  maxBudget?: number;
  location?: string;
}

interface SearchResultsProps {
  query: string;
  onQueryChange: (q: string) => void;
  mode?: "employer" | "provider";
  /** Increment to imperatively open the filter panel from outside */
  filterTrigger?: number;
  /** Called when filters are reset with no active query — lets the parent unmount this panel */
  onExitPanel?: () => void;
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

const SearchResults = ({ query, onQueryChange, mode = "employer", filterTrigger = 0, onExitPanel }: SearchResultsProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [draftFilters, setDraftFilters] = useState<SearchFilters>({});
  const [jobFilters, setJobFilters] = useState<JobFilters>({});
  const [draftJobFilters, setDraftJobFilters] = useState<JobFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRequestRef = useRef(0);
  const router = useRouter();

  const popularSearches = useMemo(
    () =>
      mode === "provider"
        ? ["House Cleaning", "Nanny", "Driver", "Cook", "Plumber", "Gardening", "Security Guard", "Electrician"]
        : ["Electrician", "House Cleaning", "Nanny / Childcare", "Plumber", "Painter", "Carpenter", "Gardening", "Cook", "Driver", "Laundry", "Security Guard", "AC Repair"],
    [mode]
  );

  const activeFilterCount = mode === "provider"
    ? Object.values(jobFilters).filter((v) => v !== undefined && v !== "").length
    : Object.values(filters).filter((v) => v !== undefined && v !== "").length;
  const hasSearchInput = Boolean(query.trim());
  const hasActiveFilters = activeFilterCount > 0;

  useEffect(() => {
    if (filterTrigger > 0) {
      if (mode === "provider") {
        setDraftJobFilters(jobFilters);
      } else {
        setDraftFilters(filters);
      }
      setIsFilterOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTrigger]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const requestId = searchRequestRef.current + 1;
      searchRequestRef.current = requestId;

      if (hasSearchInput || hasActiveFilters) {
        if (mode === "provider") {
          fetchJobs(query, jobFilters, requestId);
        } else {
          fetchServices(query, filters, requestId);
        }
      } else {
        setServices([]);
        setJobs([]);
        setError(null);
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, filters, jobFilters, hasSearchInput, hasActiveFilters, mode]);

  const fetchJobs = async (searchQuery: string, jf: JobFilters, requestId: number) => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("searchTerm", searchQuery.trim());
    if (jf.minBudget) params.set("minBudget", String(jf.minBudget));
    if (jf.maxBudget) params.set("maxBudget", String(jf.maxBudget));
    if (jf.location) params.set("location", jf.location);

    try {
      const response = await api.get(`/jobs?${params.toString()}`);
      if (requestId !== searchRequestRef.current) return;
      const data: Job[] = Array.isArray(response.data.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];
      setJobs(data);
    } catch {
      if (requestId !== searchRequestRef.current) return;
      setError("Something went wrong while fetching jobs.");
      setJobs([]);
    } finally {
      if (requestId !== searchRequestRef.current) return;
      setIsLoading(false);
    }
  };

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

  const applyFilters = () => {
    if (mode === "provider") {
      setJobFilters(draftJobFilters);
    } else {
      setFilters(draftFilters);
    }
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    if (mode === "provider") {
      setDraftJobFilters({});
      setJobFilters({});
    } else {
      setDraftFilters({});
      setFilters({});
    }
    setIsFilterOpen(false);
    // If there's also no search query, tell the parent it can dismiss the panel
    if (!query.trim()) onExitPanel?.();
  };

  const removeServiceFilter = (key: keyof SearchFilters) => {
    setFilters((current) => ({ ...current, [key]: undefined }));
  };

  const removeJobFilter = (key: keyof JobFilters) => {
    setJobFilters((current) => ({ ...current, [key]: undefined }));
  };

  const serviceFilterLabels = [
    filters.serviceType && {
      key: "serviceType" as const,
      label: SERVICE_TYPES.find((type) => type.value === filters.serviceType)?.label,
      onRemove: () => removeServiceFilter("serviceType"),
    },
    filters.availability && {
      key: "availability" as const,
      label: AVAILABILITY_OPTIONS.find((option) => option.value === filters.availability)?.label,
      onRemove: () => removeServiceFilter("availability"),
    },
    filters.location && { key: "location" as const, label: filters.location, onRemove: () => removeServiceFilter("location") },
    filters.distanceKm && { key: "distanceKm" as const, label: `${filters.distanceKm} km`, onRemove: () => removeServiceFilter("distanceKm") },
    filters.minPrice && { key: "minPrice" as const, label: `From ${filters.minPrice.toLocaleString()} RWF`, onRemove: () => removeServiceFilter("minPrice") },
    filters.maxPrice && { key: "maxPrice" as const, label: `Up to ${filters.maxPrice.toLocaleString()} RWF`, onRemove: () => removeServiceFilter("maxPrice") },
    filters.minRating && { key: "minRating" as const, label: `${filters.minRating}+ stars`, onRemove: () => removeServiceFilter("minRating") },
  ].filter(Boolean) as Array<{ key: string; label?: string; onRemove: () => void }>;

  const jobFilterLabels = [
    jobFilters.minBudget && { key: "minBudget", label: `From ${jobFilters.minBudget.toLocaleString()} RWF`, onRemove: () => removeJobFilter("minBudget") },
    jobFilters.maxBudget && { key: "maxBudget", label: `Up to ${jobFilters.maxBudget.toLocaleString()} RWF`, onRemove: () => removeJobFilter("maxBudget") },
    jobFilters.location && { key: "location", label: jobFilters.location, onRemove: () => removeJobFilter("location") },
  ].filter(Boolean) as Array<{ key: string; label: string; onRemove: () => void }>;

  const activeFilterLabels = mode === "provider" ? jobFilterLabels : serviceFilterLabels;

  const showDiscovery = !hasSearchInput && !hasActiveFilters;
  const resultLabel = hasSearchInput ? ` for "${query.trim()}"` : " for your filters";
  const resultCount = mode === "provider" ? jobs.length : services.length;
  const hasResults = resultCount > 0;

  return (
    <div className="space-y-4 pb-4">
      {activeFilterLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilterLabels.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={filter.onRemove}
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
          {mode === "provider" ? "Finding matching jobs..." : "Finding matching services..."}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {!isLoading && !error && (hasSearchInput || hasActiveFilters) && hasResults && (
        <div className="space-y-4">
          <div>
            <h2 className="text-[16px] font-bold text-[#1B2431]">
              {mode === "provider" ? "Matching Jobs" : "Matching Services"}
            </h2>
            <p className="text-[12px] text-[#687268]">
              {resultCount} {resultCount === 1 ? "match" : "matches"}{resultLabel}
            </p>
          </div>

          {mode === "provider" ? (
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobResultCard key={job.id} job={job} onClick={() => router.push(`/jobs/${job.id}`)} />
              ))}
            </div>
          ) : (
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
          )}
        </div>
      )}

      {!isLoading && !error && (hasSearchInput || hasActiveFilters) && !hasResults && (
        <div className="rounded-2xl border border-dashed border-[#DDE3DD] bg-white px-5 py-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F6F1]">
            {mode === "provider" ? (
              <Briefcase className="h-5 w-5 text-[#145B10]" />
            ) : (
              <Search className="h-5 w-5 text-[#145B10]" />
            )}
          </div>
          <h3 className="text-[15px] font-bold text-[#1B2431]">
            {mode === "provider" ? "No jobs found" : "No services found"}
          </h3>
          <p className="mx-auto mt-1 max-w-[260px] text-[13px] leading-5 text-[#687268]">
            {mode === "provider"
              ? "Try a different keyword or check back later for new postings."
              : "Try a broader search, a different area, or fewer filters."}
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
                className="flex min-h-9 items-center rounded-full border border-[#E1E8E1] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#1B2431] transition hover:border-[#145B10] hover:bg-[#F1F8F1] hover:text-[#145B10]"
                onClick={() => onQueryChange(search)}
              >
                {search}
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
                <p className="text-[12px] text-[#687268]">
                  {mode === "provider" ? "Narrow down job results." : "Choose what should appear in the cards."}
                </p>
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
              {mode === "provider" ? (
                <>
                  <FilterGroup title="Budget range (RWF)">
                    <div className="grid grid-cols-2 gap-3">
                      <NumberInput
                        label="Min"
                        value={draftJobFilters.minBudget}
                        onChange={(value) => setDraftJobFilters((c) => ({ ...c, minBudget: value }))}
                      />
                      <NumberInput
                        label="Max"
                        value={draftJobFilters.maxBudget}
                        onChange={(value) => setDraftJobFilters((c) => ({ ...c, maxBudget: value }))}
                      />
                    </div>
                  </FilterGroup>

                  <FilterGroup title="Area">
                    <div className="grid grid-cols-2 gap-2">
                      {LOCATION_OPTIONS.map((location) => (
                        <OptionButton
                          key={location}
                          label={location}
                          selected={draftJobFilters.location === location}
                          onClick={() => setDraftJobFilters((c) => ({
                            ...c,
                            location: c.location === location ? undefined : location,
                          }))}
                        />
                      ))}
                    </div>
                  </FilterGroup>
                </>
              ) : (
                <>
                  <FilterGroup title="Service type">
                    <SegmentedOptions
                      options={SERVICE_TYPES}
                      value={draftFilters.serviceType}
                      onChange={(value) => setDraftFilters((c) => ({ ...c, serviceType: value as ServiceTypeFilter }))}
                    />
                  </FilterGroup>

                  <FilterGroup title="Availability">
                    <SegmentedOptions
                      options={AVAILABILITY_OPTIONS}
                      value={draftFilters.availability}
                      onChange={(value) => setDraftFilters((c) => ({ ...c, availability: value as AvailabilityFilter }))}
                    />
                  </FilterGroup>

                  <FilterGroup title="Area">
                    <div className="grid grid-cols-2 gap-2">
                      {LOCATION_OPTIONS.map((location) => (
                        <OptionButton
                          key={location}
                          label={location}
                          selected={draftFilters.location === location}
                          onClick={() => setDraftFilters((c) => ({
                            ...c,
                            location: c.location === location ? undefined : location,
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
                          onClick={() => setDraftFilters((c) => ({
                            ...c,
                            distanceKm: c.distanceKm === distance ? undefined : distance,
                          }))}
                        />
                      ))}
                    </div>
                  </FilterGroup>

                  <FilterGroup title="Price range (RWF)">
                    <div className="grid grid-cols-2 gap-3">
                      <NumberInput
                        label="Min"
                        value={draftFilters.minPrice}
                        onChange={(value) => setDraftFilters((c) => ({ ...c, minPrice: value }))}
                      />
                      <NumberInput
                        label="Max"
                        value={draftFilters.maxPrice}
                        onChange={(value) => setDraftFilters((c) => ({ ...c, maxPrice: value }))}
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
                          onClick={() => setDraftFilters((c) => ({
                            ...c,
                            minRating: c.minRating === rating ? undefined : rating,
                          }))}
                        />
                      ))}
                    </div>
                  </FilterGroup>
                </>
              )}
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

const formatBudget = (min?: number | null, max?: number | null) => {
  if (!min && !max) return "Negotiable";
  const fmt = (n: number) => `RWF ${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
};

const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const JobResultCard = ({ job, onClick }: { job: Job; onClick: () => void }) => {
  const budget = formatBudget(job.budgetMin, job.budgetMax);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2 hover:border-[#145B10]/30 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9]">
          <Briefcase className="h-4 w-4 text-[#145B10]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-semibold text-[#145B10]">
              {job.category.name}
            </span>
            <span className="text-[10px] text-gray-400">{timeAgo(job.createdAt)}</span>
          </div>
          <h3 className="mt-1 text-[14px] font-bold leading-snug text-[#1B2431]">{job.title}</h3>
        </div>
      </div>

      {job.address?.city && (
        <div className="flex items-center gap-1 text-[11px] text-[#616161]">
          <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
          {job.address.city}, Kigali
        </div>
      )}

      <p className="line-clamp-2 text-[11px] leading-relaxed text-[#616161]">{job.description}</p>

      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[12px] font-bold text-[#1B2431]">{budget}</span>
        <span className="rounded-full bg-[#145B10] px-3 py-1 text-[11px] font-bold text-white">
          View Job
        </span>
      </div>
    </div>
  );
};

export default SearchResults;
