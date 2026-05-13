import React from "react";
import { Providers } from "@/store/provider";
import { ViewModeProvider } from "@/context/view-mode-context";
import { Toaster } from "react-hot-toast";
import Layout from "@/components/layout/pwa-layout";

export default function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Providers>
      <ViewModeProvider>
        <Layout>
          <Toaster position="top-center" />
          {children}
        </Layout>
      </ViewModeProvider>
    </Providers>
  );
}
