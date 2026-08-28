"use client";

import {
  useInfiniteQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import servicesService, {
  type BrowseServicesParams,
  type PaginatedServices,
} from "@/services/services-service";
import { queryPersistenceMaxAge } from "@/lib/query-persistence";

/** Cards fetched per page. Kept small so the first paint is fast. */
export const SERVICES_PAGE_SIZE = 12;

/**
 * Cached, paginated marketplace browse list. Backed by React Query's infinite
 * query, so:
 *  - revisiting a page renders the cached cards instantly (no spinner),
 *  - changing filters/search keeps the previous results on screen while the
 *    new ones load (no empty flash),
 *  - scrolling to the bottom fetches the next ranked page (see fetchNextPage),
 *  - identical param sets are deduped and shared across components.
 *
 * The query key is the (page-less) params object — React Query hashes it
 * deterministically, so passing a fresh object literal each render is fine.
 * `page` is threaded through `pageParam`, not the key, so all pages of one
 * filter set live under a single cache entry.
 */
export function useServiceList(params: BrowseServicesParams = {}) {
  const query = useInfiniteQuery({
    queryKey: ["services", "browse", params],
    queryFn: ({ pageParam }) =>
      servicesService.browse({
        ...params,
        page: pageParam,
        limit: SERVICES_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedServices, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.items.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    gcTime: queryPersistenceMaxAge,
    placeholderData: keepPreviousData,
  });

  // Flatten pages into one list for rendering; expose the total so callers can
  // show "showing N of M" and decide whether more exist. Dedupe by id: the
  // ranked marketplace pool can shift slightly between page fetches (time-based
  // scoring, live data changes), so the same service may land on two pages —
  // without this, React sees duplicate keys.
  const pages = query.data?.pages ?? [];
  const seen = new Set<string>();
  const services: (typeof pages)[number]["items"] = [];
  for (const p of pages) {
    for (const item of p.items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        services.push(item);
      }
    }
  }
  const total = pages[0]?.total ?? 0;

  return { ...query, services, total };
}
