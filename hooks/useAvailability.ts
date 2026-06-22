"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import servicesService from "@/services/services-service";
import { useAuth } from "@/hooks/useAuth";

/**
 * Reads + toggles the worker's global `availableForWork` flag.
 *
 * Optimistically flips the local UI value when the user taps the toggle and
 * rolls it back if the server PATCH fails. Initial value seeds from the
 * cached `user` (Redux) so the toggle never flashes the wrong state.
 */
export function useAvailability(): {
  available: boolean;
  isUpdating: boolean;
  setAvailable: (next: boolean) => Promise<void>;
} {
  const { user, updateUserProfile } = useAuth();

  // The User type may not yet carry availableForWork in TypeScript; pull it
  // off the runtime object so we don't have to widen the global type today.
  const initial = (user as any)?.availableForWork;
  const [available, setLocalAvailable] = useState<boolean>(
    typeof initial === "boolean" ? initial : true,
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Re-sync when the cached user object changes (login, refetch, etc.).
  useEffect(() => {
    if (typeof initial === "boolean") {
      setLocalAvailable(initial);
    }
  }, [initial]);

  const setAvailable = useCallback(
    async (next: boolean) => {
      if (isUpdating) return;
      const previous = available;
      setLocalAvailable(next);
      setIsUpdating(true);
      try {
        const result = await servicesService.setAvailability(next);
        setLocalAvailable(result.availableForWork);
        // Keep the Redux user in sync so other surfaces see the new value.
        if (user) {
          await updateUserProfile(
            { availableForWork: result.availableForWork } as any,
            user as any,
          );
        }
      } catch (error) {
        setLocalAvailable(previous);
        const message =
          (error as any)?.response?.data?.message ||
          "Could not update availability. Please try again.";
        toast.error(message);
      } finally {
        setIsUpdating(false);
      }
    },
    [available, isUpdating, updateUserProfile, user],
  );

  return { available, isUpdating, setAvailable };
}
