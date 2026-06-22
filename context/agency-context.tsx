"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "@/lib/axios";

export interface AgencyStats {
  totalWorkers: number;
  activePlacements: number;
  pendingRequests: number;
  openIssues: number;
  totalCommissionEarned: number;
  unpaidCommission: number;
}

export interface AgencyOrg {
  id: string;
  name: string;
  verified: boolean;
  logoUrl: string | null;
}

interface AgencyContextValue {
  org: AgencyOrg | null;
  stats: AgencyStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** unread message count is not yet wired to a backend; kept for badge parity */
  unreadMessages: number;
}

const AgencyContext = createContext<AgencyContextValue | null>(null);

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const [org, setOrg] = useState<AgencyOrg | null>(null);
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get("/agency/dashboard");
      const data = res.data?.data || res.data;
      setOrg(data?.org ?? null);
      setStats(data?.stats ?? null);
      setError(null);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 403 || status === 404 ? "not-agency" : "load-failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AgencyContext.Provider value={{ org, stats, loading, error, refresh, unreadMessages: 0 }}>
      {children}
    </AgencyContext.Provider>
  );
}

export function useAgency() {
  const ctx = useContext(AgencyContext);
  if (!ctx) throw new Error("useAgency must be used within AgencyProvider");
  return ctx;
}
