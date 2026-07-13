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
import { useTranslations } from "next-intl";
import ServiceCard from "@/components/service-card";
import { Service } from "@/types";
import jobsService, { Job } from "@/services/jobs-service";
import { JobPostCard } from "@/components/job-post-card";
import {
  getServiceDetailPath,
  getServiceDisplayName,
  mapServiceToProviderCard,
} from "@/lib/service-display";
import { SectorPicker } from "@/components/ui/sector-picker";
import {
  getViewerLocation,
  saveViewerLocation,
  type ViewerLocation,
} from "@/constants/rwanda-sectors";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  ReviewPromptDialog,
  type ReviewPromptPayload,
} from "@/components/reviews/review-prompt-dialog";
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

type ServiceTypeFilter = "INDIVIDUAL" | "STAFFING_AGENCY" | "COMPANY";
type AvailabilityFilter = "available" | "unavailable";

interface SearchFilters {
  serviceType?: ServiceTypeFilter;
  availability?: AvailabilityFilter;
  location?: string;
  distanceKm?: number;
  minPrice?: number;
  maxPrice?: number;
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
  id?: string;
  status?: string;
  service?: {
    id?: string;
  } | null;
  // Reviews authored by the current employer for this booking (backend filters
  // to the caller) — empty on a completed booking means it's still unreviewed.
  reviews?: { id: string }[];
  // Backend's authoritative flag (replaced the `reviews` array): true when the
  // booking is completed and still needs a comment-bearing review.
  reviewPending?: boolean;
}

interface ApplicationSummary {
  jobId: string;
}

const SERVICE_TYPES = (t: (key: string) => string): Array<{ label: string; value: ServiceTypeFilter }> => [
  { label: t("serviceTypeIndividual"), value: "INDIVIDUAL" },
  { label: t("serviceTypeAgency"), value: "STAFFING_AGENCY" },
  { label: t("serviceTypeCompany"), value: "COMPANY" },
];

const AVAILABILITY_OPTIONS = (t: (key: string) => string): Array<{ label: string; value: AvailabilityFilter }> => [
  { label: t("availabilityAvailable"), value: "available" },
  { label: t("availabilityUnavailable"), value: "unavailable" },
];

const DISTANCE_OPTIONS = [2, 5, 10, 25];
const LOCATION_OPTIONS = ["Kicukiro", "Nyarugenge", "Gasabo", "Kigali", "Remera"];
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
  const t = useTranslations("searchResult");
  const [services, setServices] = useState<Service[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [draftFilters, setDraftFilters] = useState<SearchFilters>({});
  const [jobFilters, setJobFilters] = useState<JobFilters>({});
  const [draftJobFilters, setDraftJobFilters] = useState<JobFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerLoc, setViewerLoc] = useState<ViewerLocation | null>(null);
  const [showLocPicker, setShowLocPicker] = useState(false);
  const [hireModal, setHireModal] = useState<HireModal | null>(null);
  const [notes, setNotes] = useState("");
  const [submittingHire, setSubmittingHire] = useState(false);
  const [requestedServiceIds, setRequestedServiceIds] = useState<Set<string>>(new Set());
  // serviceId -> bookingId of a completed-but-unreviewed job (review-first re-hire).
  const [reviewableByService, setReviewableByService] = useState<Map<string, string>>(new Map());
  const [reviewModal, setReviewModal] = useState<{ service: Service; bookingId: string } | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [isApplyingJob, setIsApplyingJob] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchRequestRef = useRef(0);
  const searchCacheRef = useRef<Map<string, { services?: Service[]; jobs?: Job[] }>>(new Map());
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { requireAuth } = useRequireAuth();
  // Owner detection requires a live session; `user` can persist without a token.
  const currentUserId = isAuthenticated ? user?.id : undefined;

  const popularSearches = useMemo(
    () =>
      mode === "provider"
        ? [t("popularProvider1"), t("popularProvider2"), t("popularProvider3"), t("popularProvider4"), t("popularProvider5"), t("popularProvider6"), t("popularProvider7"), t("popularProvider8")]
        : [t("popularEmployer1"), t("popularEmployer2"), t("popularEmployer3"), t("popularEmployer4"), t("popularEmployer5"), t("popularEmployer6"), t("popularEmployer7"), t("popularEmployer8"), t("popularEmployer9"), t("popularEmployer10"), t("popularEmployer11"), t("popularEmployer12")],
    [mode, t]
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

  // Read viewer location from localStorage once on mount.
  useEffect(() => {
    setViewerLoc(getViewerLocation());
  }, []);

  useEffect(() => {
    if (mode !== "employer" || !currentUserId) return;

    const fetchRequestedServices = async () => {
      try {
        const response = await api.get("/bookings", { params: { role: "employer" }, skipAuthRedirect: true });
        const bookings = Array.isArray(response.data.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];
        const active = new Set(["PENDING", "CONFIRMED", "IN_PROGRESS"]);
        const list = bookings as ExistingBooking[];
        const activeIds = new Set(
          list
            .filter((b) => b.service?.id && active.has(String(b.status).toUpperCase()))
            .map((b) => b.service?.id as string),
        );
        setRequestedServiceIds(activeIds);
        // Completed jobs you haven't reviewed → card leads with "Leave a review"
        // (unless there's also an active booking for that service).
        const reviewable = new Map<string, string>();
        for (const b of list) {
          const sid = b.service?.id;
          // Prefer the backend's reviewPending flag (it replaced `reviews`);
          // fall back to the empty-reviews check for older API responses.
          const reviewPending =
            typeof b.reviewPending === "boolean"
              ? b.reviewPending
              : (b.reviews?.length ?? 0) === 0;
          if (
            sid &&
            b.id &&
            !activeIds.has(sid) &&
            String(b.status).toUpperCase() === "COMPLETED" &&
            reviewPending
          ) {
            if (!reviewable.has(sid)) reviewable.set(sid, b.id);
          }
        }
        setReviewableByService(reviewable);
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
      setError(t("errorFetchJobs"));
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
    // Include viewer sector in cache key so a location change busts the cache.
    const loc = getViewerLocation();
    const cacheKey = buildSearchCacheKey("services", searchQuery, {
      ...selectedFilters,
      _viewerSector: loc?.sector,
    });
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
    if (loc) {
      params.set("viewerLat", String(loc.lat));
      params.set("viewerLng", String(loc.lng));
    }
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
      setError(t("errorFetchServices"));
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

  const submitProviderReview = async (payload: ReviewPromptPayload) => {
    if (!reviewModal) return false;
    try {
      await api.post("/feedback", {
        wouldRehire: payload.wouldRehire,
        comment: payload.comment,
        bookingId: reviewModal.bookingId,
      });
      toast.success(t("reviewSubmitted"));
      // Card returns to "Request to Hire".
      setReviewableByService((prev) => {
        const next = new Map(prev);
        next.delete(reviewModal.service.id);
        return next;
      });
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotSubmitReview")));
      return false;
    }
  };

  const openHireModal = (service: Service) => {
    const providerName = service.provider
      ? `${service.provider.firstName || ""} ${service.provider.lastName || ""}`.trim() || t("providerFallback")
      : service.company?.name || t("companyFallback");

    if (currentUserId && service.provider?.id === currentUserId) {
      toast.error(t("cantBookOwnService"));
      return;
    }

    if (requestedServiceIds.has(service.id)) return;

    requireAuth(() => {
      setHireModal({
        serviceId: service.id,
        providerName,
        serviceTitle: getServiceDisplayName(service),
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
      toast.success(t("bookingRequestSentTo", { name: hireModal.providerName }));
      setRequestedServiceIds((prev) => {
        const next = new Set(prev);
        next.add(hireModal.serviceId);
        return next;
      });
      closeHireModal();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("failedSendRequest")));
    } finally {
      setSubmittingHire(false);
    }
  };

  const handleExpressJob = async (jobId: string) => {
    if (appliedJobIds.has(jobId) || isApplyingJob) return;

    setIsApplyingJob(jobId);
    try {
      await jobsService.applyToJob(jobId, { message: t("interestedMessage") });
      setAppliedJobIds((prev) => new Set([...prev, jobId]));
      toast.success(t("interestSent"));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("failedSendInterest")));
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
      label: SERVICE_TYPES(t).find((type) => type.value === filters.serviceType)?.label,
      onRemove: () => removeServiceFilter("serviceType"),
    },
    filters.availability && {
      key: "availability" as const,
      label: AVAILABILITY_OPTIONS(t).find((option) => option.value === filters.availability)?.label,
      onRemove: () => removeServiceFilter("availability"),
    },
    filters.location && { key: "location" as const, label: filters.location, onRemove: () => removeServiceFilter("location") },
    filters.distanceKm && { key: "distanceKm" as const, label: t("kmSuffix", { km: filters.distanceKm }), onRemove: () => removeServiceFilter("distanceKm") },
    filters.minPrice && { key: "minPrice" as const, label: t("fromAmountRwf", { amount: filters.minPrice.toLocaleString() }), onRemove: () => removeServiceFilter("minPrice") },
    filters.maxPrice && { key: "maxPrice" as const, label: t("upToAmountRwf", { amount: filters.maxPrice.toLocaleString() }), onRemove: () => removeServiceFilter("maxPrice") },
  ].filter(Boolean) as Array<{ key: string; label?: string; onRemove: () => void }>;

  const jobFilterLabels = [
    jobFilters.minBudget && { key: "minBudget", label: t("fromAmountRwf", { amount: jobFilters.minBudget.toLocaleString() }), onRemove: () => removeJobFilter("minBudget") },
    jobFilters.maxBudget && { key: "maxBudget", label: t("upToAmountRwf", { amount: jobFilters.maxBudget.toLocaleString() }), onRemove: () => removeJobFilter("maxBudget") },
    jobFilters.location && { key: "location", label: jobFilters.location, onRemove: () => removeJobFilter("location") },
  ].filter(Boolean) as Array<{ key: string; label: string; onRemove: () => void }>;

  const activeFilterLabels = mode === "provider" ? jobFilterLabels : serviceFilterLabels;

  const showDiscovery = !hasSearchInput && !hasActiveFilters;
  const resultLabel = hasSearchInput ? t("forQuery", { query: query.trim() }) : t("forYourFilters");
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

      {/* Location anchor — always visible for employer searches so users know
          what the distance on each card is measured from. */}
      {mode !== "provider" && (
        <div className="flex items-center gap-1.5 text-[12px] text-[#687268]">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-brand" />
          <span>{t("near")}</span>
          <button
            type="button"
            onClick={() => setShowLocPicker(true)}
            className="font-semibold text-brand hover:underline underline-offset-2"
          >
            {viewerLoc
              ? viewerLoc.village
                ? `${viewerLoc.village}, ${viewerLoc.cell}`
                : viewerLoc.cell
                  ? `${viewerLoc.cell}, ${viewerLoc.sector}`
                  : `${viewerLoc.sector}, ${viewerLoc.district}`
              : t("setYourLocation")}
          </button>
          {viewerLoc && (
            <span className="text-[#bbb]">{t("distancesShownHint")}</span>
          )}
        </div>
      )}

      {/* Controlled sector picker — opens on demand from the location anchor */}
      <SectorPicker
        value={viewerLoc}
        open={showLocPicker}
        onOpenChange={setShowLocPicker}
        onChange={(loc: ViewerLocation) => {
          const next: ViewerLocation = loc;
          saveViewerLocation(next);
          setViewerLoc(next);
          // Bust search cache so next search picks up new viewerLat/Lng
          searchCacheRef.current.clear();
        }}
      />

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-6 text-sm text-[#687268]">
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
          {mode === "provider" ? t("findingJobs") : t("findingServices")}
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
              {mode === "provider" ? t("matchingJobs") : t("matchingServices")}
            </h2>
            <p className="text-[12px] text-[#687268]">
              {t("matchCount", { count: resultCount })}{resultLabel}
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
                    category: job.category?.name || t("otherCategory"),
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
                const reviewBookingId = reviewableByService.get(service.id);

                return (
                  <ServiceCard
                    key={service.id}
                    {...card}
                    hasRequested={requestedServiceIds.has(service.id)}
                    isOwnService={Boolean(currentUserId && service.provider?.id === currentUserId)}
                    needsReview={Boolean(reviewBookingId)}
                    onLeaveReview={() =>
                      reviewBookingId && setReviewModal({ service, bookingId: reviewBookingId })
                    }
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
            {mode === "provider" ? t("noJobsFound") : t("noServicesFound")}
          </h3>
          <p className="mx-auto mt-1 max-w-[260px] text-[13px] leading-5 text-[#687268]">
            {mode === "provider"
              ? t("tryDifferentKeyword")
              : t("tryBroaderSearch")}
          </p>

          {/* Employers who can't find a match can post a job instead — the
              right moment to capture intent. Hidden in provider (job-search) mode. */}
          {mode !== "provider" && (
            <div className="mt-5 rounded-xl border border-brand/20 bg-[#F1F8F1] p-4 text-center">
              <p className="text-[13px] font-bold text-ink">
                {t("cantFindWhatYouNeed")}
              </p>
              <p className="mx-auto mt-1 max-w-[240px] text-[12px] leading-5 text-[#687268]">
                {t("postJobAndProvidersComeToYou")}
              </p>
              <button
                type="button"
                onClick={() =>
                  requireAuth(() => router.push("/post-job"), "post-job")
                }
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[13px] font-bold text-white transition-colors hover:bg-[#0f4a0c]"
              >
                {t("postAJob")}
                <span aria-hidden>→</span>
              </button>
            </div>
          )}
        </div>
      )}

      {showDiscovery && (
        <div className="space-y-3">
          <h2 className="text-[16px] font-bold leading-5 text-ink">{t("popularSearches")}</h2>
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

      <ReviewPromptDialog
        open={Boolean(reviewModal)}
        subject={
          reviewModal
            ? {
                title: mapServiceToProviderCard(reviewModal.service).name,
                subtitle: getServiceDisplayName(reviewModal.service),
              }
            : null
        }
        rehireQuestion={t("rehireQuestion")}
        onOpenChange={(open) => {
          if (!open) setReviewModal(null);
        }}
        onSubmit={submitProviderReview}
      />

      {hireModal && (
        <>
          <SheetOverlay zIndexClassName="z-[90]" onClick={closeHireModal} aria-hidden="true" />
          <SheetPanel side="floating" zIndexClassName="z-[91]" className="max-w-sm" onClose={closeHireModal}>
            <SheetHeader
              title={hireModal.providerName}
              subtitle={hireModal.serviceTitle}
              onClose={closeHireModal}
              className="border-b-0 pb-2"
              leading={
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-brand">
                  {t("request")}
                </span>
              }
            />

            <SheetBody className="space-y-5 pt-2">
              <FormField label={t("message")} hint={t("optional")}>
                <textarea
                  autoFocus
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("hireNotesPlaceholder")}
                  rows={3}
                  className={cn(appTextareaClass, "min-h-[96px]")}
                />
              </FormField>
            </SheetBody>

            <SheetFooter className="flex gap-3 border-t-0 pb-6 pt-0">
              <AppButton
                appVariant="secondary"
                onClick={closeHireModal}
                className="flex-1"
              >
                {t("cancel")}
              </AppButton>
              <AppButton
                onClick={handleHireSubmit}
                disabled={submittingHire}
                className="flex-1"
              >
                {submittingHire ? <Loader2 className="h-4 w-4 animate-spin" /> : t("sendRequest")}
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
              title={t("filters")}
              subtitle={mode === "provider" ? t("narrowDownJobResults") : t("chooseWhatAppearsInCards")}
              onClose={() => setIsFilterOpen(false)}
            />

            <SheetBody className="max-h-[70vh] space-y-5">
              {mode === "provider" ? (
                <>
                  <FilterGroup title={t("budgetRangeRwf")}>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberInput
                        label={t("min")}
                        value={draftJobFilters.minBudget}
                        onChange={(value) => setDraftJobFilters((c) => ({ ...c, minBudget: value }))}
                      />
                      <NumberInput
                        label={t("max")}
                        value={draftJobFilters.maxBudget}
                        onChange={(value) => setDraftJobFilters((c) => ({ ...c, maxBudget: value }))}
                      />
                    </div>
                  </FilterGroup>

                  <FilterGroup title={t("area")}>
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
                  <FilterGroup title={t("serviceType")}>
                    <SegmentedOptions
                      options={SERVICE_TYPES(t)}
                      value={draftFilters.serviceType}
                      onChange={(value) => setDraftFilters((c) => ({ ...c, serviceType: value as ServiceTypeFilter }))}
                    />
                  </FilterGroup>

                  <FilterGroup title={t("availability")}>
                    <SegmentedOptions
                      options={AVAILABILITY_OPTIONS(t)}
                      value={draftFilters.availability}
                      onChange={(value) => setDraftFilters((c) => ({ ...c, availability: value as AvailabilityFilter }))}
                    />
                  </FilterGroup>

                  <FilterGroup title={t("area")}>
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

                  <FilterGroup title={t("distance")}>
                    <div className="grid grid-cols-4 gap-2">
                      {DISTANCE_OPTIONS.map((distance) => (
                        <OptionButton
                          key={distance}
                          label={t("kmSuffix", { km: distance })}
                          selected={draftFilters.distanceKm === distance}
                          onClick={() => setDraftFilters((c) => ({
                            ...c,
                            distanceKm: c.distanceKm === distance ? undefined : distance,
                          }))}
                        />
                      ))}
                    </div>
                  </FilterGroup>

                  <FilterGroup title={t("priceRangeRwf")}>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberInput
                        label={t("min")}
                        value={draftFilters.minPrice}
                        onChange={(value) => setDraftFilters((c) => ({ ...c, minPrice: value }))}
                      />
                      <NumberInput
                        label={t("max")}
                        value={draftFilters.maxPrice}
                        onChange={(value) => setDraftFilters((c) => ({ ...c, maxPrice: value }))}
                      />
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
                {t("reset")}
              </AppButton>
              <AppButton
                type="button"
                onClick={applyFilters}
                className="flex-1"
              >
                {t("apply")}
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
}) => {
  const t = useTranslations("searchResult");
  return (
    <label className="space-y-1">
      <span className="text-[11px] font-bold uppercase text-[#687268]">{label}</span>
      <input
        type="number"
        min={0}
        value={value || ""}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined)}
        className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-[13px] font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        placeholder={t("rwfPlaceholder")}
      />
    </label>
  );
};

export default SearchResults;
