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

import { useCallback, useEffect, useMemo, useState } from "react";
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

export function useWorkData(): UseWorkDataResult {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [workerBookings, setWorkerBookings] = useState<BookingRecord[]>([]);
  const [employerBookings, setEmployerBookings] = useState<BookingRecord[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [jobPosts, setJobPosts] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roles = user?.roles || [];
  const isProvider = roles.includes("WORKER");
  const isEmployer = roles.includes("EMPLOYER");

  const refetch = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(!user);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // We fetch BOTH worker-side and employer-side data regardless of declared
      // roles. Reason: a user without the EMPLOYER role can still act as an
      // employer in the UI (e.g. via "Request to Hire" on a service card),
      // which creates a booking with them as the employerId. The backend
      // already filters by req.user.id on both sides, so this is safe — it
      // just means a single-role user gets an empty array on the other side
      // instead of a missed-fetch bug. Same logic applies to job posts and
      // worker applications.
      const [workerResult, employerResult, appsResult, postsResult] = await Promise.allSettled([
        api.get<{ data: BookingRecord[] }>("/bookings/received"),
        api.get<{ data: BookingRecord[] }>("/bookings", { params: { role: "employer" } }),
        jobsService.getMyApplications(),
        jobsService.getMyJobs(),
      ]);

      const nextWorkerBookings =
        workerResult.status === "fulfilled" && Array.isArray(workerResult.value.data?.data)
          ? workerResult.value.data.data
          : [];
      const nextEmployerBookings =
        employerResult.status === "fulfilled" && Array.isArray(employerResult.value.data?.data)
          ? employerResult.value.data.data
          : [];
      const nextApplications =
        appsResult.status === "fulfilled" && Array.isArray(appsResult.value)
          ? appsResult.value
          : [];
      const nextJobPosts =
        postsResult.status === "fulfilled" && Array.isArray(postsResult.value)
          ? postsResult.value
          : [];

      setWorkerBookings(nextWorkerBookings);
      setEmployerBookings(nextEmployerBookings);
      setApplications(nextApplications);
      setJobPosts(nextJobPosts);

      // 401/403 on endpoints the user lacks permission for is expected (we
      // always fetch both sides — see comment above). Only surface a banner
      // when something actually went wrong (network error or 5xx).
      const isExpectedPermissionError = (r: PromiseSettledResult<unknown>) => {
        if (r.status !== "rejected") return false;
        const status = (r.reason as { response?: { status?: number } })?.response?.status;
        return status === 401 || status === 403;
      };
      const realFailures = [workerResult, employerResult, appsResult, postsResult].filter(
        (r) => r.status === "rejected" && !isExpectedPermissionError(r),
      );
      if (realFailures.length > 0) {
        setError("Some work data could not be loaded.");
      }
    } catch {
      setError("Could not load your work right now.");
      setWorkerBookings([]);
      setEmployerBookings([]);
      setApplications([]);
      setJobPosts([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isEmployer, isProvider, user]);

  useEffect(() => {
    if (!isLoading) {
      void refetch();
    }
  }, [isLoading, refetch]);

  const items = useMemo(
    () => composeWorkItems({ workerBookings, employerBookings, applications, jobPosts }),
    [applications, employerBookings, jobPosts, workerBookings],
  );

  return {
    user,
    roles,
    isProvider,
    isEmployer,
    isDualRole: isProvider && isEmployer,
    loading: isLoading || loading,
    error,
    items,
    jobPosts,
    refetch,
  };
}
