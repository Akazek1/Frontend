"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

/**
 * Client-side role gate.
 *
 * Use on pages that need a stricter check than the auth middleware can
 * enforce (the middleware only sees the JWT presence, not the user's roles).
 *
 * When the user isn't authenticated, this hook stays silent — the existing
 * middleware will already have redirected them. When they're authed but
 * lack the required role, we redirect to `fallbackPath` and surface a
 * toast explaining why.
 *
 * Returns `true` while the role check is still resolving (user not loaded
 * yet) and `null`/`true`/`false` once we know.
 */
export function useRequireRole(
  allowedRoles: string[],
  options: {
    fallbackPath?: string;
    toastMessage?: string;
  } = {}
): { isAllowed: boolean | null; isLoading: boolean } {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const toastedRef = useRef(false);

  const fallbackPath = options.fallbackPath ?? "/more";
  const toastMessage =
    options.toastMessage ?? "Switch to Provider mode to add services.";

  const roles = user?.roles ?? [];
  const hasRequiredRole =
    roles.length > 0 && allowedRoles.some((role) => roles.includes(role as any));

  const knowsRoles = !!user && roles.length > 0;
  const isAllowed = knowsRoles ? hasRequiredRole : null;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return; // middleware handles this
    if (!user) return; // still loading user record

    if (!hasRequiredRole && !toastedRef.current) {
      toastedRef.current = true;
      toast(toastMessage, { icon: "👷" });
      router.replace(fallbackPath);
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    hasRequiredRole,
    router,
    fallbackPath,
    toastMessage,
  ]);

  return { isAllowed, isLoading };
}
