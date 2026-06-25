import type { Query } from "@tanstack/react-query";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";
import { clearAppQueryClient } from "@/lib/query-client";

const QUERY_CACHE_KEY = "akazek-react-query-cache";
const PERSISTED_QUERY_MAX_AGE = 24 * 60 * 60 * 1000;

export const queryPersistenceBuster =
  process.env.NEXT_PUBLIC_BUILD_ID ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  "local-build";

export const queryPersistenceMaxAge = PERSISTED_QUERY_MAX_AGE;

export const queryPersister: Persister = {
  persistClient: (client: PersistedClient) => set(QUERY_CACHE_KEY, client),
  restoreClient: () => get<PersistedClient>(QUERY_CACHE_KEY),
  removeClient: () => del(QUERY_CACHE_KEY),
};

export function shouldPersistQuery(query: Query) {
  const [scope, area] = query.queryKey;

  return (
    (scope === "services" && area === "browse") ||
    scope === "active-languages"
  );
}

export async function clearPersistedQueryCache() {
  clearAppQueryClient();
  await queryPersister.removeClient();
}
