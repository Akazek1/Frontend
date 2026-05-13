"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProviderBookings from "@/components/bookings/provider-bookings";
import { useViewMode } from "@/context/view-mode-context";

const JobsPage: React.FC = () => {
  const { viewMode, toggleViewMode } = useViewMode();
  const router = useRouter();

  // If user is in employer mode and lands on /jobs, switch view to provider
  // (since /jobs is the provider-specific route)
  useEffect(() => {
    if (viewMode === "employer") {
      toggleViewMode();
    }
  }, [viewMode, toggleViewMode]);

  return <ProviderBookings />;
};

export default JobsPage;
