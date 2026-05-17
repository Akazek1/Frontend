import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import authService, {
  type SendOtpRequest,
  type VerifyOtpRequest,
  type AuthResponse,
} from "@/services/auth-service";
import { toast } from "react-hot-toast";
import type { AxiosError } from "axios";

// Define the auth state interface
interface AuthState {
  user: AuthResponse["data"]["user"] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  otpSent: boolean;
  phoneNumber: string | null;
}

// Helper function to safely parse localStorage
const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser || storedUser === "undefined" || storedUser === "null") {
      return null;
    }
    const user = JSON.parse(storedUser);

    // Migration: Convert old userType to roles array
    if (user && !user.roles && user.userType) {
      user.roles = [user.userType === "Agency" ? "EMPLOYER" : "WORKER"];
      delete user.userType;
      localStorage.setItem("user", JSON.stringify(user));
    }

    return user;
  } catch (error) {
    console.error("Error parsing stored user:", error);
    // Clear invalid data
    localStorage.removeItem("user");
    return null;
  }
};

const storedUser = getStoredUser();

// Sync profileComplete cookie with stored user state on load
if (typeof document !== "undefined" && storedUser) {
  if (storedUser.firstName) {
    document.cookie = "profileComplete=true; path=/; max-age=31536000";
  } else {
    document.cookie = "profileComplete=; path=/; max-age=0";
  }
}

// Initial state
const initialState: AuthState = {
  user: storedUser,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  isAuthenticated:
    typeof window !== "undefined" ? !!localStorage.getItem("token") : false,
  isLoading: false,
  error: null,
  otpSent: false,
  phoneNumber: null,
};

// Async thunks
export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (data: SendOtpRequest, { rejectWithValue }) => {
    try {
      return await authService.sendOtp(data);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      const message = err.response?.data?.message || "Failed to send OTP";
      return rejectWithValue(message);
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (data: VerifyOtpRequest, { rejectWithValue }) => {
    try {
      const response = await authService.verifyOtp(data);
      return response;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      const message = err.response?.data?.message || "OTP verification failed";
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  document.cookie = "token=; path=/; max-age=0";
  document.cookie = "profileComplete=; path=/; max-age=0";
  authService.logout();
});

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getCurrentUser();
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      const message = err.response?.data?.message || "Failed to get user";
      return rejectWithValue(message);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: (state) => {
      state.error = null;
      state.isLoading = false;
    },
    setPhoneNumber: (state, action: PayloadAction<string>) => {
      state.phoneNumber = action.payload;
    },
    updateUser(state, action: PayloadAction<Partial<AuthState["user"]>>) {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };

        // Update localStorage too
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Send OTP cases
      .addCase(sendOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.otpSent = true;
        toast.success("OTP sent successfully");
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Verify OTP cases
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.otpSent = false;
        state.phoneNumber = null;

        // Save user and token to localStorage and mirror token into a cookie
        // so the Next.js middleware can gate protected routes.
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(action.payload.user));
          localStorage.setItem("token", action.payload.token);
          document.cookie = `token=${action.payload.token}; path=/; max-age=86400; SameSite=Lax`;
          if (action.payload.user?.firstName) {
            document.cookie = "profileComplete=true; path=/; max-age=31536000";
          } else {
            document.cookie = "profileComplete=; path=/; max-age=0";
          }
        }

        toast.success("OTP verified successfully");
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Logout case
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.otpSent = false;
        state.phoneNumber = null;
        toast.success("Logged out successfully");
      })

      // Get current user cases
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        if (typeof document !== "undefined" && action.payload?.firstName) {
          document.cookie = "profileComplete=true; path=/; max-age=31536000";
        }
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { resetAuthState, setPhoneNumber, updateUser } = authSlice.actions;
export default authSlice.reducer;
