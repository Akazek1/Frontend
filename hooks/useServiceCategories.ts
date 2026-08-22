"use client";

import { useQuery } from "@tanstack/react-query";
import servicesService, { ServiceCategory } from "@/services/services-service";
import { queryPersistenceMaxAge } from "@/lib/query-persistence";

/**
 * Cached list of service categories (the flat job-type list from
 * GET /services/categories). Categories are effectively static — they change
 * only when an admin edits the taxonomy — so this is cached aggressively and
 * persisted to IndexedDB (see shouldPersistQuery):
 *  - the wizard/forms that need it no longer refetch on every mount,
 *  - a cold start renders the last-known list instantly, then refreshes quietly.
 */
export function useServiceCategories(): {
  categories: ServiceCategory[];
  isLoading: boolean;
  error: string | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ["service-categories"],
    queryFn: () => servicesService.listCategories(),
    staleTime: 30 * 60 * 1000,
    gcTime: queryPersistenceMaxAge,
  });

  return {
    categories: data ?? [],
    // Only the genuine first-ever load (no cached/persisted data) shows loading.
    isLoading: isLoading && !data,
    error: error ? "Failed to load categories" : null,
  };
}
