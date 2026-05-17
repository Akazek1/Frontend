import { UserRole } from "@/services/auth-service";

/**
 * Null-safe check if a user has a specific role
 */
export const hasRole = (roles: UserRole[] | string[] | undefined | null, role: UserRole): boolean => {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.includes(role);
};

/**
 * Convenience check for Employer/Agency status
 */
export const isEmployer = (roles: UserRole[] | string[] | undefined | null): boolean => {
  return hasRole(roles, "EMPLOYER");
};

/**
 * Convenience check for Worker status
 */
export const isWorker = (roles: UserRole[] | string[] | undefined | null): boolean => {
  return hasRole(roles, "WORKER");
};

/**
 * Returns a display label ("Agency" or "Individual") for legacy UI compatibility
 * based on the roles array.
 */
export const roleToDisplayType = (roles: UserRole[] | string[] | undefined | null): "Agency" | "Individual" => {
  if (isEmployer(roles)) return "Agency";
  return "Individual";
};
