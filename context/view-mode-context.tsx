"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isGuestBrowsingEnabled } from "@/lib/feature-flags";

export type ViewMode = "provider" | "employer";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

interface ViewModeProviderProps {
  children: React.ReactNode;
}

const VIEW_MODE_STORAGE_KEY = "hwa_view_mode";

export const ViewModeProvider: React.FC<ViewModeProviderProps> = ({ children }) => {
  const { roles, isAuthenticated } = useAuth();
  const [viewMode, setViewModeState] = useState<ViewMode>("employer");
  const [isInitialized, setIsInitialized] = useState(false);
  const onlyEmployer = isAuthenticated && roles.length === 1 && roles[0] === "EMPLOYER";
  const onlyWorker = isAuthenticated && roles.length === 1 && roles[0] === "WORKER";

  // Initialize from localStorage or roles
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      
      if (onlyEmployer) {
        setViewModeState("employer");
        setIsInitialized(true);
      } else if (saved === "provider" || saved === "employer") {
        setViewModeState(saved);
        setIsInitialized(true);
      } else if (isAuthenticated && roles.length > 0) {
        // Default based on roles
        const newMode = onlyWorker ? "provider" : "employer";
        setViewModeState(newMode);
        setIsInitialized(true);
      } else if (!isAuthenticated && isGuestBrowsingEnabled()) {
        // Guests default to the jobs feed ("Find work") per the redesign.
        setViewModeState("provider");
        setIsInitialized(true);
      }
    }
  }, [isAuthenticated, roles, isInitialized, onlyEmployer, onlyWorker]);

  useEffect(() => {
    if (!isInitialized || typeof window === "undefined" || !onlyEmployer) return;

    setViewModeState("employer");
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, "employer");
  }, [isInitialized, onlyEmployer]);

  // Save to localStorage whenever viewMode changes
  useEffect(() => {
    if (typeof window !== "undefined" && isInitialized) {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    }
  }, [viewMode, isInitialized]);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
  };

  const toggleViewMode = () => {
    setViewModeState((prev) => (prev === "provider" ? "employer" : "provider"));
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
};


