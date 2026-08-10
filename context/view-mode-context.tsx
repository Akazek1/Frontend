"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

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
  const { user, isAuthenticated } = useAuth();
  const [viewMode, setViewModeState] = useState<ViewMode>("employer");
  const [isInitialized, setIsInitialized] = useState(false);
  // Both views are accessible to everyone (guests AND registered users) — the
  // toggle is never locked. Provider status only gates *actions* (e.g.
  // expressing interest), enforced server-side. `onlyWorker` here just picks a
  // sensible *default* view; it does not restrict toggling.
  const isProvider = Boolean(user?.isProvider);
  // A provider with no other (non-individual) roles defaults to the provider view.
  const onlyWorker = isAuthenticated && isProvider;

  // Initialize from saved preference, else a sensible default.
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);

      if (!isAuthenticated) {
        // Guests always open on "Hire help" — the primary first-time action.
        // We deliberately ignore any previously stored value here: a stale
        // default saved in an earlier session must not flip them over to
        // "Find work" right after the page loads. (Matches the initial state,
        // so there's no visible flicker either.)
        setViewModeState("employer");
      } else if (saved === "provider" || saved === "employer") {
        // Signed-in users keep their explicit last choice.
        setViewModeState(saved);
      } else {
        // First-time signed-in users: sole workers land on "Find work",
        // everyone else on "Hire help".
        setViewModeState(onlyWorker ? "provider" : "employer");
      }
      setIsInitialized(true);
    }
  }, [isAuthenticated, onlyWorker, isInitialized]);

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


