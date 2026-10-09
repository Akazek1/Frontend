"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import type { RootState, AppDispatch } from "@/store";
import {
  sendOtp,
  verifyOtp,
  logout,
  getCurrentUser,
  resetAuthState,
  setPhoneNumber,
  updateUser,
} from "@/store/slices/auth-slice";
import type {
  AuthResponse,
  SendOtpRequest,
  VerifyOtpRequest,
  UserRole,
} from "@/services/auth-service";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { getAuthToken } from "@/lib/auth-utils";
import { track } from "@/lib/analytics";

// Ensures the session is validated against the backend at most once per full
// page load, even though many components call useAuth. Reset naturally on reload
// (module re-evaluates).
let sessionRevalidated = false;
let resumeListenerRegistered = false;

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const t = useTranslations("authToasts");
  const { user, isAuthenticated, isLoading, error, otpSent, phoneNumber } =
    useSelector((state: RootState) => state.auth);
  const effectiveIsAuthenticated = isAuthenticated || Boolean(getAuthToken());

  const roles = user?.roles || [];

  const hasRole = (role: UserRole) => {
    return roles.includes(role);
  };

  // Validate the session on mount whenever a token is present — including when a
  // (possibly stale) user was rehydrated from redux-persist. Trusting a cached
  // user without re-checking the token leaves a broken "looks logged in but every
  // request 401s" shell after the token expires or is invalidated. Hitting
  // /auth/me forces a resolution: a valid token refreshes the user, an invalid
  // one trips the axios 401 handler which clears the session and drops to the
  // guest home. Guarded to fire once per page load (not per useAuth consumer).
  useEffect(() => {
    if (!effectiveIsAuthenticated) return;

    // Validate once per app load. Reset the guard on failure so a transient
    // error can retry — the session is no longer wiped on failure (see the
    // getCurrentUser.rejected reducer), so this just refreshes stale data.
    if (!sessionRevalidated) {
      sessionRevalidated = true;
      dispatch(getCurrentUser())
        .unwrap()
        .catch(() => {
          sessionRevalidated = false;
        });
    }

    // Re-validate whenever the app returns to the foreground, so a session that
    // went stale while backgrounded refreshes without needing a full restart.
    // Registered once globally, not per useAuth consumer.
    if (!resumeListenerRegistered && typeof document !== "undefined") {
      resumeListenerRegistered = true;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && getAuthToken()) {
          dispatch(getCurrentUser());
        }
      });
    }
  }, [dispatch, effectiveIsAuthenticated]);

  // Send OTP function
  const handleSendOtp = async (data: SendOtpRequest) => {
    try {
      // Validate phone number before dispatching
      if (!data.phoneNumber || data.phoneNumber.length < 9) {
        toast.error(t("invalidPhone"));
        return false;
      }

      dispatch(setPhoneNumber(data.phoneNumber));

      // Prevent duplicate OTP requests
      if (isLoading) {
        return false;
      }

      await dispatch(sendOtp(data)).unwrap();
      track("otp_requested"); // funnel: a verification code was sent
      return true;
    } catch (error) {
      console.error("Error sending OTP:", error);
      track("otp_send_failed"); // couldn't even send the code (SMS/network)
      return false;
    }
  };

  // Verify OTP function - accepts either string (otp) or object { phoneNumber, otp }
  const handleVerifyOtp = async (otpOrData: string | { phoneNumber: string; otp: string }) => {
    let phone: string;
    let otp: string;

    if (typeof otpOrData === "string") {
      // Legacy format: just OTP string
      if (!phoneNumber) {
        toast.error(
          t("phoneMissing")
        );
        return false;
      }
      phone = phoneNumber;
      otp = otpOrData;
    } else {
      // New format: object with phoneNumber and otp
      phone = otpOrData.phoneNumber;
      otp = otpOrData.otp;
    }

    try {
      // Accept 6-digit OTP (standard) or hardcoded OTP for development
      if (otp.length !== 6) {
        toast.error(t("invalidOtpLength"));
        return false;
      }

      const data: VerifyOtpRequest = {
        phoneNumber: phone,
        otp,
      };

      const result = await dispatch(verifyOtp(data)).unwrap();

      if (result.token) {
        track("otp_verified"); // funnel: code accepted, into the app
        return result.user;
      } else {
        toast.error(t("invalidOtp"));
      }
    } catch (error) {
      console.error("OTP verification failed:", error);
      track("otp_failed"); // wrong/expired code — the drop-off point
      const err = error as Error & { response?: { data?: { message?: string } } }
      const errorMessage = err?.response?.data?.message || err?.message || t("otpFailed")
      toast.error(errorMessage)
      return false
    }
  };

  // Logout function
  const handleLogout = async () => {
    await dispatch(logout());
    router.push("/"); // Redirect to guest home page after logout
  };

  // Update user profile locally
  const updateUserProfile = async (
    data: Partial<AuthResponse["data"]["user"]>,
    currentUser: AuthResponse["data"]["user"] | null
  ) => {
    try {
      if (isLoading) {
        toast.error(t("requestInProgress"));
        return false;
      }

      dispatch(updateUser(data));

      // Use the passed-in user directly
      if (typeof window !== "undefined" && currentUser) {
        const updatedUser = {
          ...currentUser,
          ...data,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        toast.error(t("userNotFound"));
        return false;
      }

      toast.success(t("profileUpdated"));
      return true;
    } catch (error) {
      const err = error as Error;
      const message = err.message || t("profileUpdateFailed");
      console.error("Error updating user profile:", error);
      toast.error(message);
      return false;
    }
  };

  // Reset auth state (clear errors)
  const resetAuth = () => {
    dispatch(resetAuthState());
  };

  return {
    user,
    roles,
    isAuthenticated: effectiveIsAuthenticated,
    isLoading,
    error,
    otpSent,
    phoneNumber,
    hasRole,
    sendOtp: handleSendOtp,
    verifyOtp: handleVerifyOtp,
    logout: handleLogout,
    updateUserProfile,
    resetAuth,
    setPhoneNumber: (phone: string) => dispatch(setPhoneNumber(phone)),
  };
};
