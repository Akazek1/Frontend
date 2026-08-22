"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { queryPersistenceMaxAge } from "@/lib/query-persistence";

/** One top-level browse grouping (ServiceCategory) plus its job types. */
export interface TaxonomyGrouping {
  id: string;
  name: string;
  nameKn?: string | null;
  nameFr?: string | null;
  icon?: string | null;
  sortOrder?: number;
  jobTypes?: { id: string; name: string; nameKn?: string | null; nameFr?: string | null; icon?: string | null }[];
}

async function fetchTaxonomyTree(): Promise<TaxonomyGrouping[]> {
  const response = await api.get("/taxonomy/tree");
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

/**
 * Cached browse taxonomy (groupings + job types). This is the most static data
 * in the app — it changes only when an admin edits the taxonomy — so it's cached
 * aggressively and persisted to IndexedDB (see shouldPersistQuery), meaning:
 *  - navigating away and back never shows a spinner or refetches,
 *  - even a cold PWA start renders the last-known categories instantly, then
 *    refreshes them quietly in the background.
 */
export function useTaxonomyTree() {
  return useQuery({
    queryKey: ["taxonomy-tree"],
    queryFn: fetchTaxonomyTree,
    // Effectively static: no refetch for 30 min, and stale-while-revalidate
    // after that keeps the old list on screen while the new one loads.
    staleTime: 30 * 60 * 1000,
    gcTime: queryPersistenceMaxAge,
  });
}
