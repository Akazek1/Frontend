"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import servicesService from "@/services/services-service";
import { useAuth } from "@/hooks/useAuth";
import type { Service } from "@/types";

/** Cache key for the signed-in user's own services. Not persisted to disk. */
export const myServicesQueryKey = (userId?: string) => ["my-services", userId] as const;

/**
 * Fetches and caches the current user's own services for the listing page.
 *
 * Uses the owner-exemption baked into the backend's GET /services?providerId=
 * — when the viewer matches the providerId, the server returns hidden cards
 * too, so this list is exhaustive even when the worker is offline.
 *
 * Shared through React Query, so components mounted together (onboarding +
 * its embedded wizard) make one request. staleTime 0 keeps the old "fresh on
 * every visit" behaviour, but a revisit shows the cached list instantly while
 * it refetches in the background.
 */
export function useServices(): {
  services: Service[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  removeLocal: (id: string) => void;
  upsertLocal: (service: Service) => void;
} {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const enabled = isAuthenticated && !!userId;
  const queryClient = useQueryClient();
  const queryKey = myServicesQueryKey(userId);

  const query = useQuery({
    queryKey,
    queryFn: () => servicesService.list({ providerId: userId, limit: 100 }),
    enabled,
    staleTime: 0,
  });

  const { refetch: refetchQuery } = query;
  const refetch = useCallback(async () => {
    await refetchQuery();
  }, [refetchQuery]);

  const removeLocal = useCallback(
    (id: string) => {
      queryClient.setQueryData<Service[]>(myServicesQueryKey(userId), (prev) =>
        prev?.filter((s) => s.id !== id),
      );
    },
    [queryClient, userId],
  );

  const upsertLocal = useCallback(
    (service: Service) => {
      queryClient.setQueryData<Service[]>(myServicesQueryKey(userId), (prev = []) => {
        const idx = prev.findIndex((s) => s.id === service.id);
        if (idx === -1) return [service, ...prev];
        const next = prev.slice();
        next[idx] = service;
        return next;
      });
    },
    [queryClient, userId],
  );

  const error = query.error
    ? (query.error as any)?.response?.data?.message || "Failed to load services"
    : null;

  return {
    services: query.data ?? [],
    // Signed-out users have nothing to load; otherwise show loading until the
    // first response so the page never flashes "no services".
    isLoading: enabled ? query.isPending : false,
    error,
    refetch,
    removeLocal,
    upsertLocal,
  };
}
