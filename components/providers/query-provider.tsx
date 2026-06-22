"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * App-wide React Query client. The defaults are tuned so that navigating away
 * from a list and coming back does NOT show a spinner: cached data is served
 * instantly (stale-while-revalidate), and a background refetch only happens
 * once the data is older than `staleTime`.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Within 1 min of a fetch, revisiting a page reuses the cache with
            // no network call at all.
            staleTime: 60_000,
            // Keep unmounted query data around for 5 min so a back-navigation
            // still has something to render immediately.
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
