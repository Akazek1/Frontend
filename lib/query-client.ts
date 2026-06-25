import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | null = null;

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Within 1 min of a fetch, revisiting a page reuses the cache with no
        // network call at all.
        staleTime: 60_000,
        // Keep ordinary unmounted query data short-lived in RAM; persisted
        // public queries opt into a longer gcTime at their call sites.
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function getAppQueryClient() {
  if (!queryClient) {
    queryClient = createAppQueryClient();
  }
  return queryClient;
}

export function clearAppQueryClient() {
  queryClient?.clear();
}
