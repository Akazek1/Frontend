"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import servicesService, {
  type BrowseServicesParams,
} from "@/services/services-service";

/**
 * Cached marketplace browse list. Backed by React Query, so:
 *  - revisiting a page renders the cached cards instantly (no spinner),
 *  - changing filters/search keeps the previous results on screen while the
 *    new ones load (no empty flash),
 *  - identical param sets are deduped and shared across components.
 *
 * The query key is the params object — React Query hashes it deterministically,
 * so passing a fresh object literal each render is fine.
 */
export function useServiceList(params: BrowseServicesParams = {}) {
  return useQuery({
    queryKey: ["services", "browse", params],
    queryFn: () => servicesService.browse(params),
    placeholderData: keepPreviousData,
  });
}
