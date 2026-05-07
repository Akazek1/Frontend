"use client";
import React from "react";
import ProviderBookings from "@/components/bookings/provider-bookings";
import EmployerBookings from "@/components/bookings/employer-bookings";
import { useViewMode } from "@/context/view-mode-context";

const BookingsPage: React.FC = () => {
  const { viewMode } = useViewMode();

  return viewMode === "provider" ? <ProviderBookings /> : <EmployerBookings />;
};

export default BookingsPage;
