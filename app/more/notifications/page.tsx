"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import BackButtonHeader from "@/components/header/back-button-header";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

interface NotificationPreferences {
  bookingInquiries: boolean;
  bookingConfirmations: boolean;
  messages: boolean;
  profileReviews: boolean;
  paymentUpdates: boolean;
}

const NotificationsPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    bookingInquiries: true,
    bookingConfirmations: true,
    messages: true,
    profileReviews: true,
    paymentUpdates: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/users/profile");
      const notificationPrefs = response.data.data?.notificationPreferences || preferences;
      setPreferences(notificationPrefs);
    } catch (err) {
      console.error("Error fetching preferences:", err);
      toast.error("Failed to load notification preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);

    try {
      await api.patch("/users/notification-preferences", updated);
      toast.success("Notification preferences updated");
    } catch (err) {
      console.error("Error updating preferences:", err);
      toast.error("Failed to update preferences");
      setPreferences(preferences);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#F1FCEF] px-6 py-11 space-y-6 min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#145B10]" />
      </div>
    );
  }

  return (
    <div className="bg-[#F1FCEF] px-6 py-11 space-y-6 min-h-screen pb-16">
      <BackButtonHeader text="Notifications" backHref="/profile" />

      <div className="space-y-6">
        {/* Bookings Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#145B10] uppercase tracking-wide">Bookings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-lg text-[#1B2431] leading-6">New job inquiries</label>
              <Checkbox
                checked={preferences.bookingInquiries}
                onCheckedChange={() => handleToggle("bookingInquiries")}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-lg text-[#1B2431] leading-6">Booking confirmations</label>
              <Checkbox
                checked={preferences.bookingConfirmations}
                onCheckedChange={() => handleToggle("bookingConfirmations")}
              />
            </div>
          </div>
        </div>

        <Separator className="bg-[#EEEEEE]" />

        {/* Messages Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#145B10] uppercase tracking-wide">Messages</h3>
          <div className="flex items-center justify-between">
            <label className="text-lg text-[#1B2431] leading-6">New messages</label>
            <Checkbox
              checked={preferences.messages}
              onCheckedChange={() => handleToggle("messages")}
            />
          </div>
        </div>

        <Separator className="bg-[#EEEEEE]" />

        {/* Reviews Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#145B10] uppercase tracking-wide">Reviews</h3>
          <div className="flex items-center justify-between">
            <label className="text-lg text-[#1B2431] leading-6">New profile reviews</label>
            <Checkbox
              checked={preferences.profileReviews}
              onCheckedChange={() => handleToggle("profileReviews")}
            />
          </div>
        </div>

        <Separator className="bg-[#EEEEEE]" />

        {/* Payments Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#145B10] uppercase tracking-wide">Payments</h3>
          <div className="flex items-center justify-between">
            <label className="text-lg text-[#1B2431] leading-6">Payment updates</label>
            <Checkbox
              checked={preferences.paymentUpdates}
              onCheckedChange={() => handleToggle("paymentUpdates")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPreferences;
