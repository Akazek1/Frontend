"use client";

import React, { useState } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  queryPersistenceBuster,
  queryPersistenceMaxAge,
  queryPersister,
  shouldPersistQuery,
} from "@/lib/query-persistence";
import { getAppQueryClient } from "@/lib/query-client";

/**
 * App-wide React Query client. The defaults are tuned so that navigating away
 * from a list and coming back does NOT show a spinner: cached data is served
 * instantly (stale-while-revalidate), and a background refetch only happens
 * once the data is older than `staleTime`.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => getAppQueryClient());

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister: queryPersister,
        maxAge: queryPersistenceMaxAge,
        buster: queryPersistenceBuster,
        dehydrateOptions: {
          shouldDehydrateQuery: shouldPersistQuery,
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
