"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

interface AuthGateContextValue {
  isOpen: boolean;
  intent: string | undefined;
  redirectUrl: string | undefined;
  openAuthGate: (intent?: string, redirectUrl?: string) => void;
  closeAuthGate: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [intent, setIntent] = useState<string | undefined>(undefined);
  const [redirectUrl, setRedirectUrl] = useState<string | undefined>(undefined);

  const openAuthGate = useCallback((newIntent?: string, newRedirectUrl?: string) => {
    setIntent(newIntent);
    setRedirectUrl(newRedirectUrl);
    setIsOpen(true);
  }, []);

  const closeAuthGate = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AuthGateContext.Provider value={{ isOpen, intent, redirectUrl, openAuthGate, closeAuthGate }}>
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGate must be used within AuthGateProvider");
  return ctx;
}
