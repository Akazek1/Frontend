"use client";

import { useCallback, useEffect, useState } from "react";
import servicesService from "@/services/services-service";
import { useAuth } from "@/hooks/useAuth";
import type { Service } from "@/types";

/**
 * Fetches and caches the current user's own services for the listing page.
 *
 * Uses the owner-exemption baked into the backend's GET /services?providerId=
 * — when the viewer matches the providerId, the server returns hidden cards
 * too, so this list is exhaustive even when the worker is offline.
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

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setServices([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const list = await servicesService.list({ providerId: userId, limit: 100 });
      setServices(list);
    } catch (err) {
      const message =
        (err as any)?.response?.data?.message || "Failed to load services";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const removeLocal = useCallback((id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const upsertLocal = useCallback((service: Service) => {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === service.id);
      if (idx === -1) return [service, ...prev];
      const next = prev.slice();
      next[idx] = service;
      return next;
    });
  }, []);

  return { services, isLoading, error, refetch, removeLocal, upsertLocal };
}
