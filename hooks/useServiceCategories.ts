"use client";

import { useEffect, useRef, useState } from "react";
import servicesService, { ServiceCategory } from "@/services/services-service";

// Module-level cache so multiple wizard mounts don't hit the network twice
// per session. Categories are global and effectively static.
let cachedCategories: ServiceCategory[] | null = null;
let inflightFetch: Promise<ServiceCategory[]> | null = null;

export function useServiceCategories(): {
  categories: ServiceCategory[];
  isLoading: boolean;
  error: string | null;
} {
  const [categories, setCategories] = useState<ServiceCategory[]>(
    cachedCategories ?? [],
  );
  const [isLoading, setIsLoading] = useState<boolean>(!cachedCategories);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (cachedCategories) {
      setCategories(cachedCategories);
      setIsLoading(false);
      return;
    }

    if (!inflightFetch) {
      inflightFetch = servicesService
        .listCategories()
        .then((list) => {
          cachedCategories = list;
          return list;
        })
        .finally(() => {
          inflightFetch = null;
        });
    }

    setIsLoading(true);
    inflightFetch
      .then((list) => {
        if (!mountedRef.current) return;
        setCategories(list);
        setError(null);
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        const message =
          (err as any)?.response?.data?.message || "Failed to load categories";
        setError(message);
      })
      .finally(() => {
        if (!mountedRef.current) return;
        setIsLoading(false);
      });
  }, []);

  return { categories, isLoading, error };
}

/** Test-only escape hatch — resets the module cache between specs. */
export function __resetServiceCategoriesCache() {
  cachedCategories = null;
  inflightFetch = null;
}
