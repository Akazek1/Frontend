"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSelector, useStore } from "react-redux";
import type { RootState } from "@/store";

export const TERMS_GATE_EVENT = "huza:terms-not-accepted";

interface TermsGateContextValue {
  isOpen: boolean;
  openTermsGate: () => void;
  closeTermsGate: () => void;
}

const TermsGateContext = createContext<TermsGateContextValue | null>(null);

export function TermsGateProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const store = useStore<RootState>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const openTermsGate = useCallback(() => setIsOpen(true), []);
  const closeTermsGate = useCallback(() => setIsOpen(false), []);

  // Listen for the event fired by the axios interceptor. Read the store
  // directly (not a render-time value): a 403 can land in the same tick that
  // logout flipped isAuthenticated, and there is no session left to gate then.
  useEffect(() => {
    const handler = () => {
      if (store.getState().auth.isAuthenticated) openTermsGate();
    };
    window.addEventListener(TERMS_GATE_EVENT, handler);
    return () => window.removeEventListener(TERMS_GATE_EVENT, handler);
  }, [openTermsGate, store]);

  useEffect(() => {
    if (!isAuthenticated) setIsOpen(false);
  }, [isAuthenticated]);

  return (
    <TermsGateContext.Provider value={{ isOpen, openTermsGate, closeTermsGate }}>
      {children}
    </TermsGateContext.Provider>
  );
}

export function useTermsGate() {
  const ctx = useContext(TermsGateContext);
  if (!ctx) throw new Error("useTermsGate must be used within TermsGateProvider");
  return ctx;
}
