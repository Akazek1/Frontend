/**
 * useWorkData — composed data hook for the unified /work page.
 *
 * Fetches in parallel from existing endpoints (bookings, applications, job
 * posts) and groups the results into WorkItems for rendering. Uses
 * Promise.allSettled so a single failed endpoint does not break the page.
 *
 * No new backend endpoints introduced — composes existing /bookings,
 * /bookings/received, /jobs/my-jobs (via jobsService) and applications.
 *
 * Extracted from work-page.tsx per WORK_PAGE_REFACTOR_PROMPT.md.
 */
"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import jobsService, { Job, JobApplication } from "@/services/jobs-service";
import { composeWorkItems } from "@/components/work/mappers";
import type { BookingRecord, WorkItem } from "@/components/work/types";

export interface UseWorkDataResult {
  user: ReturnType<typeof useAuth>["user"];
  roles: string[];
  isProvider: boolean;
  isEmployer: boolean;
  isDualRole: boolean;
  loading: boolean;
  error: string | null;
  items: WorkItem[];
  jobPosts: Job[];
  refetch: () => Promise<void>;
}

interface WorkData {
  workerBookings: BookingRecord[];
  employerBookings: BookingRecord[];
  applications: JobApplication[];
  jobPosts: Job[];
  /** True when an endpoint failed for a reason other than missing permission. */
  hadRealFailure: boolean;
}

/**
 * Fetches BOTH worker-side and employer-side data regardless of declared roles.
 * Reason: a user without the EMPLOYER role can still act as an employer in the
 * UI (e.g. via "Request to Hire"), which creates a booking with them as the
 * employerId. The backend filters by req.user.id on both sides, so this is safe
 * — a single-role user just gets an empty array on the other side. Uses
 * allSettled so one failing endpoint does not break the page.
 */
async function fetchWorkData(): Promise<WorkData> {
  const [workerResult, employerResult, appsResult, postsResult] = await Promise.allSettled([
    api.get<{ data: BookingRecord[] }>("/bookings/received"),
    api.get<{ data: BookingRecord[] }>("/bookings", { params: { role: "employer" } }),
    jobsService.getMyApplications(),
    jobsService.getMyJobs(),
  ]);

  // 401/403 on endpoints the user lacks permission for is expected (we always
  // fetch both sides). Only a network error or 5xx counts as a real failure.
  const isExpectedPermissionError = (r: PromiseSettledResult<unknown>) => {
    if (r.status !== "rejected") return false;
    const status = (r.reason as { response?: { status?: number } })?.response?.status;
    return status === 401 || status === 403;
  };

  return {
    workerBookings:
      workerResult.status === "fulfilled" && Array.isArray(workerResult.value.data?.data)
        ? workerResult.value.data.data
        : [],
    employerBookings:
      employerResult.status === "fulfilled" && Array.isArray(employerResult.value.data?.data)
        ? employerResult.value.data.data
        : [],
    applications:
      appsResult.status === "fulfilled" && Array.isArray(appsResult.value) ? appsResult.value : [],
    jobPosts:
      postsResult.status === "fulfilled" && Array.isArray(postsResult.value) ? postsResult.value : [],
    hadRealFailure: [workerResult, employerResult, appsResult, postsResult].some(
      (r) => r.status === "rejected" && !isExpectedPermissionError(r),
    ),
  };
}

export function useWorkData(): UseWorkDataResult {
  const { user, isAuthenticated, isLoading } = useAuth();
  const roles = user?.roles || [];
  // Phase 1 reads-flip: provider status comes from the isProvider flag.
  // Employer remains universal (any authenticated user can hire).
  const isProvider = Boolean(user?.isProvider);
  const isEmployer = roles.includes("EMPLOYER");

  const query = useQuery({
    queryKey: ["work-data", user?.id],
    queryFn: fetchWorkData,
    // Don't fetch until auth has resolved and we actually have a user.
    enabled: isAuthenticated && !!user && !isLoading,
  });

  const data = query.data;

  const items = useMemo(
    () =>
      composeWorkItems({
        workerBookings: data?.workerBookings ?? [],
        employerBookings: data?.employerBookings ?? [],
        applications: data?.applications ?? [],
        jobPosts: data?.jobPosts ?? [],
      }),
    [data],
  );

  // Preserve the previous Promise<void> contract callers `await`.
  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const error = data?.hadRealFailure
    ? "Some work data could not be loaded."
    : query.isError
      ? "Could not load your work right now."
      : null;

  return {
    user,
    roles,
    isProvider,
    isEmployer,
    isDualRole: isProvider && isEmployer,
    loading: isLoading || query.isLoading,
    error,
    items,
    jobPosts: data?.jobPosts ?? [],
    refetch,
  };
}
