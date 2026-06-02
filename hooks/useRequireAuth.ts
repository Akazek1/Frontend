"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useAuthGate } from "@/context/auth-gate-context";
import { getAuthToken } from "@/lib/auth-utils";

/**
 * Gate commitment actions behind authentication.
 *
 * Guests can browse freely, but actions like applying to a job, requesting to
 * hire, saving, posting, or booking require an account. `requireAuth` runs the
 * action when signed in; otherwise it opens an in-place bottom sheet so the
 * guest can sign in without losing their browsing context.
 *
 * Usage:
 *   const { requireAuth } = useRequireAuth();
 *   const handleSave = () => {
 *     requireAuth(() => { ...authenticated-only logic }, "bookmark");
 *   };
 */
export function useRequireAuth() {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const { openAuthGate } = useAuthGate();
  const effectiveIsAuthenticated = isAuthenticated || Boolean(getAuthToken());

  const requireAuth = (action?: () => void, intent?: string, redirectUrl?: string): boolean => {
    if (effectiveIsAuthenticated) {
      action?.();
      return true;
    }
    openAuthGate(intent, redirectUrl);
    return false;
  };

  return { isAuthenticated: effectiveIsAuthenticated, requireAuth };
}
