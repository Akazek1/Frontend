"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  Check,
  Loader2,
  Search,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import ServiceCard from "@/components/service-card";
import { Service } from "@/types";
import jobsService, { Job } from "@/services/jobs-service";
import { JobPostCard } from "@/components/job-post-card";
import {
  getServiceDetailPath,
  mapServiceToProviderCard,
} from "@/lib/service-display";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/error-handler";
import {
  AppButton,
  FormField,
  SheetBody,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPanel,
  appTextareaClass,
} from "@/components/ui/app-primitives";
import { cn } from "@/lib/utils";

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

interface HireModal {
  serviceId: string;
  providerName: string;
  serviceTitle: string;
}

interface ExistingBooking {
  status?: string;
  service?: {
    id?: string;
  } | null;
}

interface ApplicationSummary {
  jobId: string;
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

const buildSearchCacheKey = (type: "jobs" | "services", query: string, filters: object) => {
  const normalizedFilters = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));

  return JSON.stringify({
    type,
    query: query.trim().toLowerCase(),
    filters: normalizedFilters,
  });
};

const SearchResults = ({ query, onQueryChange, mode = "employer", filterTrigger = 0, onExitPanel }: SearchResultsProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [draftFilters, setDraftFilters] = useState<SearchFilters>({});
  const [jobFilters, setJobFilters] = useState<JobFilters>({});
  const [draftJobFilters, setDraftJobFilters] = useState<JobFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hireModal, setHireModal] = useState<HireModal | null>(null);
  const [notes, setNotes] = useState("");
  const [submittingHire, setSubmittingHire] = useState(false);
  const [requestedServiceIds, setRequestedServiceIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [isApplyingJob, setIsApplyingJob] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchRequestRef = useRef(0);
  const searchCacheRef = useRef<Map<string, { services?: Service[]; jobs?: Job[] }>>(new Map());
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { requireAuth } = useRequireAuth();
  const currentUserId = user?.id;

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
        clearLoadingTimer();
        setServices([]);
        setJobs([]);
        setError(null);
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters, jobFilters, hasSearchInput, hasActiveFilters, mode]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode !== "employer" || !currentUserId) return;

    const fetchRequestedServices = async () => {
      try {
        const response = await api.get("/bookings", { params: { role: "employer" } });
        const bookings = Array.isArray(response.data.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];
        const inactive = new Set(["CANCELLED", "REJECTED"]);
        setRequestedServiceIds(
          new Set(
            (bookings as ExistingBooking[])
              .filter((booking) => booking.service?.id && !inactive.has(String(booking.status).toUpperCase()))
              .map((booking) => booking.service?.id as string),
          ),
        );
      } catch {
        // Non-blocking: search results can still show and the API will validate duplicates.
      }
    };

    fetchRequestedServices();
  }, [mode, currentUserId]);

  useEffect(() => {
    if (mode !== "provider" || !currentUserId) return;

    const fetchApplications = async () => {
      try {
        const applications = await jobsService.getMyApplications();
        if (Array.isArray(applications)) {
          setAppliedJobIds(new Set((applications as ApplicationSummary[]).map((application) => application.jobId)));
        }
      } catch {
        // Non-blocking: the job cards still render and the API validates duplicate applications.
      }
    };

    fetchApplications();
  }, [mode, currentUserId]);

  const fetchJobs = async (searchQuery: string, jf: JobFilters, requestId: number) => {
    const cacheKey = buildSearchCacheKey("jobs", searchQuery, jf);
    const cached = searchCacheRef.current.get(cacheKey)?.jobs;
    if (cached) {
      setJobs(cached);
      setError(null);
      setIsLoading(false);
      return;
    }

    scheduleLoadingIndicator();
    setError(null);

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("searchTerm", searchQuery.trim());
    if (jf.minBudget) params.set("minBudget", String(jf.minBudget));
    if (jf.maxBudget) params.set("maxBudget", String(jf.maxBudget));
    if (jf.location) params.set("location", jf.location);
    params.set("limit", "12");

    try {
      const response = await api.get(`/jobs?${params.toString()}`);
      if (requestId !== searchRequestRef.current) return;
      const data: Job[] = Array.isArray(response.data.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];
      searchCacheRef.current.set(cacheKey, { jobs: data });
      setJobs(data);
    } catch {
      if (requestId !== searchRequestRef.current) return;
      setError("Something went wrong while fetching jobs.");
      setJobs([]);
    } finally {
      if (requestId !== searchRequestRef.current) return;
      clearLoadingTimer();
      setIsLoading(false);
    }
  };

  const fetchServices = async (
    searchQuery: string,
    selectedFilters: SearchFilters,
    requestId: number
  ) => {
    const cacheKey = buildSearchCacheKey("services", searchQuery, selectedFilters);
    const cached = searchCacheRef.current.get(cacheKey)?.services;
    if (cached) {
      setServices(cached);
      setError(null);
      setIsLoading(false);
      return;
    }

    scheduleLoadingIndicator();
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
    params.set("limit", "12");

    try {
      const response = await api.get(`/services?${params.toString()}`);

      if (response.status !== 200) {
        throw new Error("Failed to fetch services");
      }

      const data: Service[] = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      if (requestId !== searchRequestRef.current) return;
      searchCacheRef.current.set(cacheKey, { services: data });
      setServices(data);
    } catch {
      if (requestId !== searchRequestRef.current) return;
      setError("Something went wrong while fetching services.");
      setServices([]);
    } finally {
      if (requestId !== searchRequestRef.current) return;
      clearLoadingTimer();
      setIsLoading(false);
    }
  };

  const clearLoadingTimer = () => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  };

  const scheduleLoadingIndicator = () => {
    clearLoadingTimer();
    loadingTimerRef.current = setTimeout(() => {
      setIsLoading(true);
    }, 180);
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

  const openHireModal = (service: Service) => {
    const providerName = `${service.provider.firstName || ""} ${service.provider.lastName || ""}`.trim() || "Provider";

    if (currentUserId && service.provider.id === currentUserId) {
      toast.error("You can't book your own service.");
      return;
    }

    if (requestedServiceIds.has(service.id)) return;

    requireAuth(() => {
      setHireModal({
        serviceId: service.id,
        providerName,
        serviceTitle: service.title,
      });
    }, "hire");
  };

  const closeHireModal = () => {
    setHireModal(null);
    setNotes("");
  };

  const handleHireSubmit = async () => {
    if (!hireModal) return;

    setSubmittingHire(true);
    try {
      await api.post("/bookings", {
        serviceId: hireModal.serviceId,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      toast.success(`Booking request sent to ${hireModal.providerName}!`);
      setRequestedServiceIds((prev) => {
        const next = new Set(prev);
        next.add(hireModal.serviceId);
        return next;
      });
      closeHireModal();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send request. Please try again."));
    } finally {
      setSubmittingHire(false);
    }
  };

  const handleExpressJob = async (jobId: string) => {
    if (appliedJobIds.has(jobId) || isApplyingJob) return;

    setIsApplyingJob(jobId);
    try {
      await jobsService.applyToJob(jobId, { message: "I am interested in this job." });
      setAppliedJobIds((prev) => new Set([...prev, jobId]));
      toast.success("Interest sent! The employer will be notified.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send interest."));
    } finally {
      setIsApplyingJob(null);
    }
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
              className="flex min-h-8 items-center gap-1 rounded-full bg-[#E8F5E9] px-3 text-[12px] font-semibold text-brand"
            >
              {filter.label}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-6 text-sm text-[#687268]">
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
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
            <h2 className="text-[16px] font-bold text-ink">
              {mode === "provider" ? "Matching Jobs" : "Matching Services"}
            </h2>
            <p className="text-[12px] text-[#687268]">
              {resultCount} {resultCount === 1 ? "match" : "matches"}{resultLabel}
            </p>
          </div>

          {mode === "provider" ? (
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobPostCard
                  key={job.id}
                  job={{
                    id: job.id,
                    title: job.title,
                    category: job.category?.name || "Other",
                    description: job.description,
                    location: job.address?.city || "Kigali",
                    budgetMin: job.budgetMin,
                    budgetMax: job.budgetMax,
                    createdAt: job.createdAt,
                    posterName: `${job.employer?.firstName || ""} ${job.employer?.lastName || ""}`.trim(),
                    posterIsPrivate: !job.employer?.firstName,
                    employerId: job.employer?.id || job.employerId,
                  }}
                  currentUserId={currentUserId}
                  applied={appliedJobIds.has(job.id)}
                  isApplying={isApplyingJob === job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  onExpress={() => requireAuth(() => handleExpressJob(job.id), "apply", `/jobs/${job.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {services.map((service) => {
                const card = mapServiceToProviderCard(service);

                return (
                  <ServiceCard
                    key={service.id}
                    {...card}
                    hasRequested={requestedServiceIds.has(service.id)}
                    isOwnService={Boolean(currentUserId && service.provider.id === currentUserId)}
                    onClick={() => router.push(getServiceDetailPath(service))}
                    onHireClick={() => openHireModal(service)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {!isLoading && !error && (hasSearchInput || hasActiveFilters) && !hasResults && (
        <div className="rounded-2xl border border-dashed border-[#DDE3DD] bg-white px-5 py-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F6F1]">
            {mode === "provider" ? (
              <Briefcase className="h-5 w-5 text-brand" />
            ) : (
              <Search className="h-5 w-5 text-brand" />
            )}
          </div>
          <h3 className="text-[15px] font-bold text-ink">
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
          <h2 className="text-[16px] font-bold leading-5 text-ink">Popular Searches</h2>
          <div className="flex flex-wrap items-center gap-2">
            {popularSearches.map((search, index) => (
              <button
                key={index}
                type="button"
                className="flex min-h-9 items-center rounded-full border border-[#E1E8E1] bg-white px-3 py-1.5 text-[13px] font-semibold text-ink transition hover:border-brand hover:bg-[#F1F8F1] hover:text-brand"
                onClick={() => onQueryChange(search)}
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {hireModal && (
        <>
          <SheetOverlay zIndexClassName="z-[90]" onClick={closeHireModal} aria-hidden="true" />
          <SheetPanel zIndexClassName="z-[91]" className="max-w-sm rounded-t-[28px]" onClose={closeHireModal}>
            <SheetHeader
              title={hireModal.providerName}
              subtitle={hireModal.serviceTitle}
              onClose={closeHireModal}
              className="border-b-0 pb-2"
              leading={
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-brand">
                  Request
                </span>
              }
            />

            <SheetBody className="space-y-5 pt-2">
              <FormField label="Message" hint="Optional">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe what you need, preferred schedule, or any specific requirements..."
                  rows={3}
                  className={cn(appTextareaClass, "min-h-[96px]")}
                />
              </FormField>
            </SheetBody>

            <SheetFooter className="flex gap-3">
              <AppButton
                appVariant="secondary"
                onClick={closeHireModal}
                className="flex-1"
              >
                Cancel
              </AppButton>
              <AppButton
                onClick={handleHireSubmit}
                disabled={submittingHire}
                className="flex-1"
              >
                {submittingHire ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Request"}
              </AppButton>
            </SheetFooter>
          </SheetPanel>
        </>
      )}

      {isFilterOpen && (
        <>
          <SheetOverlay zIndexClassName="z-[80]" onClick={() => setIsFilterOpen(false)} aria-hidden="true" />
          <SheetPanel zIndexClassName="z-[81]" className="max-w-md sm:rounded-3xl" onClose={() => setIsFilterOpen(false)}>
            <SheetHeader
              title="Filters"
              subtitle={mode === "provider" ? "Narrow down job results." : "Choose what should appear in the cards."}
              onClose={() => setIsFilterOpen(false)}
            />

            <SheetBody className="max-h-[70vh] space-y-5">
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
            </SheetBody>

            <SheetFooter className="flex gap-3 bg-gray-50">
              <AppButton
                type="button"
                onClick={clearFilters}
                appVariant="secondary"
                className="flex-1"
              >
                Reset
              </AppButton>
              <AppButton
                type="button"
                onClick={applyFilters}
                className="flex-1"
              >
                Apply
              </AppButton>
            </SheetFooter>
          </SheetPanel>
        </>
      )}
    </div>
  );
};

const FilterGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="text-[13px] font-bold text-ink">{title}</h3>
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
        ? "border-brand bg-[#E8F5E9] text-brand"
        : "border-gray-200 bg-white text-[#4B554B] hover:border-brand/50"
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
      className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-[13px] font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      placeholder="RWF"
    />
  </label>
);

export default SearchResults;
