"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  DEVICE_PUSH_KEY,
  registerFcmToken,
  unregisterFcmToken,
} from "@/services/fcm-token-service";

type DevicePermission = "unsupported" | "default" | "granted" | "denied";

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

const PREFERENCES_KEY = ["notification-preferences"] as const;

const NotificationsPreferences = () => {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [savingKey, setSavingKey] = useState<PreferenceKey | null>(null);

  // OS-level push permission for THIS device — distinct from the per-category
  // preferences above (which only decide whether the server bothers sending).
  // Without OS permission + a registered token, nothing can ever arrive.
  const [devicePermission, setDevicePermission] = useState<DevicePermission>("default");
  const [deviceOptedOut, setDeviceOptedOut] = useState(false);
  const [deviceBusy, setDeviceBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setDevicePermission("unsupported");
      return;
    }
    setDevicePermission(Notification.permission as DevicePermission);
    setDeviceOptedOut(localStorage.getItem(DEVICE_PUSH_KEY) === "off");
  }, []);

  const deviceEnabled = devicePermission === "granted" && !deviceOptedOut;

  const handleDeviceToggle = async (next: boolean) => {
    if (devicePermission === "unsupported") {
      toast.error("Open the installed Akazek app (Add to Home Screen) to enable notifications.");
      return;
    }
    setDeviceBusy(true);
    try {
      if (next) {
        // Request permission FIRST, synchronously within this tap — iOS requires
        // requestPermission() to run inside the user gesture.
        let permission = Notification.permission as DevicePermission;
        if (permission === "default") {
          permission = (await Notification.requestPermission()) as DevicePermission;
          setDevicePermission(permission);
        }
        if (permission === "denied") {
          toast.error("Notifications are blocked. Enable them in your device settings.");
          return;
        }
        if (permission !== "granted") return;
        localStorage.setItem(DEVICE_PUSH_KEY, "on");
        setDeviceOptedOut(false);
        const token = await registerFcmToken();
        toast[token ? "success" : "error"](
          token
            ? "Notifications enabled on this device"
            : "Couldn't finish enabling notifications. Please try again.",
        );
      } else {
        localStorage.setItem(DEVICE_PUSH_KEY, "off");
        setDeviceOptedOut(true);
        await unregisterFcmToken();
        toast.success("Notifications turned off on this device");
      }
    } finally {
      setDeviceBusy(false);
    }
  };

  const deviceDescription =
    devicePermission === "unsupported"
      ? "Open the installed app (Add to Home Screen) to turn on notifications."
      : devicePermission === "denied"
        ? "Blocked — allow notifications for Akazek in your device settings."
        : deviceEnabled
          ? "You'll get booking, message, and review alerts on this phone."
          : "Turn on to get booking, message, and review alerts on this phone.";

  // Cached: revisiting the settings page renders the saved toggles instantly.
  const { data: savedPreferences, isLoading } = useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: async (): Promise<Partial<NotificationPreferences>> => {
      const response = await api.get("/users/profile");
      const saved = response.data.data?.notificationPreferences;
      return saved && typeof saved === "object" ? saved : {};
    },
  });

  // Mirror the fetched preferences into local state for optimistic toggling.
  useEffect(() => {
    if (savedPreferences) {
      setPreferences((prev) => ({ ...prev, ...savedPreferences }));
    }
  }, [savedPreferences]);

  const handleToggle = async (key: PreferenceKey) => {
    const previous = preferences;
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    setSavingKey(key);

    try {
      await api.patch("/users/notification-preferences", updated);
      // Keep the cache in sync so a remount within the cache window doesn't
      // briefly re-show the old value.
      queryClient.setQueryData<Partial<NotificationPreferences>>(PREFERENCES_KEY, updated);
      toast.success("Notification preferences updated");
    } catch (err) {
      console.error("Error updating preferences:", err);
      toast.error("Failed to update preferences");
      setPreferences(previous);
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

        <Card variant="list" className="rounded-2xl">
          <div className="flex min-h-[76px] items-center gap-3 px-4 py-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-brand">
              <Smartphone className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-5 text-ink">
                Notifications on this device
              </p>
              <p className="mt-0.5 text-[13px] leading-5 text-[#6B7280]">{deviceDescription}</p>
            </div>
            <Switch
              checked={deviceEnabled}
              disabled={
                deviceBusy ||
                devicePermission === "unsupported" ||
                devicePermission === "denied"
              }
              onCheckedChange={handleDeviceToggle}
              aria-label="Toggle notifications on this device"
              className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-[#D1D5DB]"
            />
          </div>
        </Card>

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
              // The Push card reflects the live device state instead of a
              // hardcoded "On"; Email/SMS stay as their static placeholders.
              const isPush = channel.title === "Push";
              const status = isPush ? (deviceEnabled ? "On" : "Off") : channel.status;
              const statusClassName = isPush
                ? deviceEnabled
                  ? "bg-emerald-50 text-brand"
                  : "bg-gray-100 text-[#6B7280]"
                : channel.statusClassName;

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
                        statusClassName,
                      )}
                    >
                      {status}
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
