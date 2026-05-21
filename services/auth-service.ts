import api from "@/lib/axios";
import { getAuthToken } from "@/lib/auth-utils";

// Define types for auth requests and responses
export interface SendOtpRequest {
  phoneNumber: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
}

export type UserRole = "WORKER" | "EMPLOYER" | "ADMIN" | "SUB_ADMIN";

export interface AuthResponse {
  data: {
    token: string;
    user: {
      id: string;
      phoneNumber: string;
      firstName: string;
      lastName: string;
      email: string;
      roles: UserRole[];
      isMobileVerified: boolean;
      isEmailVerified: boolean;
      profilePicture?: string;
      isProfileComplete?: boolean;
      dateOfBirth?: string;
      gender?: string;
      languages?: string[];
      country?: string;
      username?: string;
    };
  };
}

// Auth service functions
const authService = {
  // Send OTP to phone number
  sendOtp: async (
    data: SendOtpRequest
  ): Promise<{ message: string; phoneNumber: string }> => {
    try {
      const response = await api.post<{ data: { message: string; phoneNumber: string } }>(
        "/auth/request-otp",
        data
      );
      // Backend wraps response in { data, statusCode, message, timestamp }
      return response.data.data || response.data;
    } catch (error) {
      console.error("Error in sendOtp service:", error);
      throw error;
    }
  },

  // Verify OTP
  verifyOtp: async (data: VerifyOtpRequest): Promise<AuthResponse["data"]> => {
    try {
      const response = await api.post<AuthResponse>("/auth/verify-otp", data);

      // Store token in localStorage and cookie
      if (response.data.data?.token) {
        const token = response.data.data.token;
        localStorage.setItem("token", token);
        document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        console.warn("Token not found in response:", response.data);
      }

      // ✅ Return only the relevant data: { token, user }
      return response.data.data;
    } catch (error) {
      console.error("Error in verifyOtp service:", error);
      throw error;
    }
  },

  // Logout user
  logout: (): void => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  },

  // Get current user
  getCurrentUser: async (): Promise<AuthResponse["data"]["user"]> => {
    interface GetUserResponse {
      data: {
        user: AuthResponse["data"]["user"]
      }
    }
    const response = await api.get<GetUserResponse>("/auth/me")
    return response.data.data?.user
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return getAuthToken() !== null;
  },
};

export default authService;
