"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import EmployerBookings from "@/components/bookings/employer-bookings";
import { useViewMode } from "@/context/view-mode-context";

const BookingsPage: React.FC = () => {
  const { viewMode, toggleViewMode } = useViewMode();
  const router = useRouter();

  // If user is in provider mode and lands on /bookings, redirect to /jobs
  // /bookings is for employers (services they booked), /jobs is for providers (jobs they received)
  useEffect(() => {
    if (viewMode === "provider") {
      router.replace("/jobs");
    }
  }, [viewMode, router]);

  return <EmployerBookings />;
};

export default BookingsPage;
