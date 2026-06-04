"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  ChevronRight,
  Info,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  Star,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import BackButtonHeader from "@/components/header/back-button-header";
import { Switch } from "@/components/ui/switch";
import {
  AppSectionHeader,
  Card,
  PageShell,
  appActionCardClass,
  appContentClass,
} from "@/components/ui/app-primitives";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

interface NotificationPreferences {
  bookingInquiries: boolean;
  bookingConfirmations: boolean;
  messages: boolean;
  profileReviews: boolean;
  paymentUpdates: boolean;
}

type PreferenceKey = keyof NotificationPreferences;

const defaultPreferences: NotificationPreferences = {
  bookingInquiries: true,
  bookingConfirmations: true,
  messages: true,
  profileReviews: true,
  paymentUpdates: true,
};

const preferenceGroups: Array<{
  title: string;
  icon: React.ElementType;
  items: Array<{
    key: PreferenceKey;
    title: string;
    description: string;
    icon: React.ElementType;
    tone: string;
  }>;
}> = [
  {
    title: "Messages",
    icon: MessageCircle,
    items: [
      {
        key: "messages",
        title: "New messages",
        description: "Notify me when a client or worker sends a message",
        icon: MessageCircle,
        tone: "bg-emerald-50 text-brand",
      },
    ],
  },
  {
    title: "Bookings",
    icon: CalendarCheck,
    items: [
      {
        key: "bookingInquiries",
        title: "Booking requests",
        description: "Official offers and new interest in your job posts",
        icon: BriefcaseBusiness,
        tone: "bg-emerald-50 text-brand",
      },
      {
        key: "bookingConfirmations",
        title: "Booking updates",
        description: "Confirmations, cancellations, filled positions, and application updates",
        icon: CalendarCheck,
        tone: "bg-blue-50 text-[#2563EB]",
      },
    ],
  },
  {
    title: "Payments",
    icon: WalletCards,
    items: [
      {
        key: "paymentUpdates",
        title: "Payment updates",
        description: "Payments received, failed, refunded, or requiring attention",
        icon: WalletCards,
        tone: "bg-amber-50 text-[#B45309]",
      },
    ],
  },
  {
    title: "Reviews",
    icon: Star,
    items: [
      {
        key: "profileReviews",
        title: "Profile reviews",
        description: "New reviews and replies to reviews you wrote",
        icon: Star,
        tone: "bg-yellow-50 text-[#D97706]",
      },
    ],
  },
];

const channels = [
  {
    title: "Push",
    description: "This device",
    status: "On",
    icon: Smartphone,
    tone: "bg-emerald-50 text-brand",
    statusClassName: "bg-emerald-50 text-brand",
  },
  {
    title: "Email",
    description: "Not configured",
    status: "Off",
    icon: Mail,
    tone: "bg-blue-50 text-[#2563EB]",
    statusClassName: "bg-gray-100 text-[#6B7280]",
  },
  {
    title: "SMS",
    description: "Not configured",
    status: "Off",
    icon: MessageSquareText,
    tone: "bg-orange-50 text-[#F59E0B]",
    statusClassName: "bg-gray-100 text-[#6B7280]",
  },
];

const NotificationsPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<PreferenceKey | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/users/profile");
      const saved = response.data.data?.notificationPreferences;
      if (saved && typeof saved === "object") {
        setPreferences((prev) => ({ ...prev, ...saved }));
      }
    } catch (err) {
      console.error("Error fetching preferences:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: PreferenceKey) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    setSavingKey(key);

    try {
      await api.patch("/users/notification-preferences", updated);
      toast.success("Notification preferences updated");
    } catch (err) {
      console.error("Error updating preferences:", err);
      toast.error("Failed to update preferences");
      setPreferences(preferences);
    } finally {
      setSavingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-6">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <PageShell className="gap-5">
      <BackButtonHeader
        text="Notification Settings"
        subtitle="Choose the Akazek updates you want to receive."
        backHref="/more"
      />

        <Link
          href="/more/notifications/history"
          className={cn(appActionCardClass, "flex items-center justify-between px-4 py-3")}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F7E5] text-brand">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <span className="block text-[15px] font-semibold text-ink">
                Notification history
              </span>
              <span className="text-[13px] text-[#6B7280]">Review recent alerts</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-brand" />
        </Link>

        <div className={cn(appContentClass, "gap-5")}>
          {preferenceGroups.map((group) => {
            const GroupIcon = group.icon;

            return (
              <section key={group.title} className="space-y-2">
                <AppSectionHeader title={group.title} icon={GroupIcon} />

                <Card variant="list" className="overflow-hidden rounded-2xl">
                  {group.items.map((item, index) => {
                    const ItemIcon = item.icon;
                    const isSaving = savingKey === item.key;

                    return (
                      <div
                        key={item.key}
                        className={cn(
                          "flex min-h-[76px] items-center gap-3 px-4 py-3",
                          index > 0 && "border-t border-[#EDF1EC]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                            item.tone,
                          )}
                        >
                          <ItemIcon className="h-5 w-5" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold leading-5 text-ink">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[13px] leading-5 text-[#6B7280]">
                            {item.description}
                          </p>
                        </div>

                        <Switch
                          checked={preferences[item.key]}
                          disabled={isSaving}
                          onCheckedChange={() => handleToggle(item.key)}
                          aria-label={`Toggle ${item.title}`}
                          className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-[#D1D5DB]"
                        />
                      </div>
                    );
                  })}
                </Card>
              </section>
            );
          })}
        </div>

        <section className="space-y-2">
          <AppSectionHeader title="Notification channels" icon={ShieldCheck} />

          <div className="grid grid-cols-3 gap-3">
            {channels.map((channel) => {
              const ChannelIcon = channel.icon;

              return (
                <Card
                  variant="list"
                  key={channel.title}
                  className="p-3"
                >
                  <div className="flex flex-col gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        channel.tone,
                      )}
                    >
                      <ChannelIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold text-ink">{channel.title}</p>
                      <p className="mt-1 text-[12px] leading-4 text-[#6B7280]">
                        {channel.description}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "w-fit rounded-full px-2.5 py-1 text-[12px] font-bold",
                        channel.statusClassName,
                      )}
                    >
                      {channel.status}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <Card className="flex gap-3 border-[#BFD8FF] bg-[#EEF6FF] text-[#2F5E9E]">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-[13px] leading-5">
            Important account, safety, and booking-critical notifications may still be sent when
            needed to keep your account and active bookings secure.
          </p>
        </Card>
    </PageShell>
  );
};

export default NotificationsPreferences;
