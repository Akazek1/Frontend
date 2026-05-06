"use client";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ProviderBookings from "@/components/bookings/provider-bookings";
import EmployerBookings from "@/components/bookings/employer-bookings";

const BookingsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isProvider = user?.userType === "Individual" || user?.userType === "Agency";

  // Providers see their received jobs + stats
  // Employers see their booking history
  return isProvider ? <ProviderBookings /> : <EmployerBookings />;
};

export default BookingsPage;
