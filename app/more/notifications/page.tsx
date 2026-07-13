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
import { useTranslations } from "next-intl";
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

function getPreferenceGroups(t: (key: string) => string): Array<{
  title: string;
  icon: React.ElementType;
  items: Array<{
    key: PreferenceKey;
    title: string;
    description: string;
    icon: React.ElementType;
    tone: string;
  }>;
}> {
  return [
    {
      title: t("groupMessages"),
      icon: MessageCircle,
      items: [
        {
          key: "messages",
          title: t("itemNewMessagesTitle"),
          description: t("itemNewMessagesDesc"),
          icon: MessageCircle,
          tone: "bg-emerald-50 text-brand",
        },
      ],
    },
    {
      title: t("groupBookings"),
      icon: CalendarCheck,
      items: [
        {
          key: "bookingInquiries",
          title: t("itemBookingRequestsTitle"),
          description: t("itemBookingRequestsDesc"),
          icon: BriefcaseBusiness,
          tone: "bg-emerald-50 text-brand",
        },
        {
          key: "bookingConfirmations",
          title: t("itemBookingUpdatesTitle"),
          description: t("itemBookingUpdatesDesc"),
          icon: CalendarCheck,
          tone: "bg-blue-50 text-[#2563EB]",
        },
      ],
    },
    {
      title: t("groupPayments"),
      icon: WalletCards,
      items: [
        {
          key: "paymentUpdates",
          title: t("itemPaymentUpdatesTitle"),
          description: t("itemPaymentUpdatesDesc"),
          icon: WalletCards,
          tone: "bg-amber-50 text-[#B45309]",
        },
      ],
    },
    {
      title: t("groupReviews"),
      icon: Star,
      items: [
        {
          key: "profileReviews",
          title: t("itemProfileReviewsTitle"),
          description: t("itemProfileReviewsDesc"),
          icon: Star,
          tone: "bg-yellow-50 text-[#D97706]",
        },
      ],
    },
  ];
}

function getChannels(t: (key: string) => string) {
  return [
    {
      id: "push",
      title: t("channelPush"),
      description: t("channelPushDesc"),
      status: t("statusOn"),
      icon: Smartphone,
      tone: "bg-emerald-50 text-brand",
      statusClassName: "bg-emerald-50 text-brand",
    },
    {
      id: "email",
      title: t("channelEmail"),
      description: t("notConfigured"),
      status: t("statusOff"),
      icon: Mail,
      tone: "bg-blue-50 text-[#2563EB]",
      statusClassName: "bg-gray-100 text-[#6B7280]",
    },
    {
      id: "sms",
      title: t("channelSms"),
      description: t("notConfigured"),
      status: t("statusOff"),
      icon: MessageSquareText,
      tone: "bg-orange-50 text-[#F59E0B]",
      statusClassName: "bg-gray-100 text-[#6B7280]",
    },
  ];
}

const PREFERENCES_KEY = ["notification-preferences"] as const;

const NotificationsPreferences = () => {
  const t = useTranslations("notificationSettings");
  const preferenceGroups = getPreferenceGroups(t);
  const channels = getChannels(t);
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
      toast.error(t("deviceUnsupported"));
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
          toast.error(t("notificationsBlocked"));
          return;
        }
        if (permission !== "granted") return;
        localStorage.setItem(DEVICE_PUSH_KEY, "on");
        setDeviceOptedOut(false);
        const token = await registerFcmToken();
        toast[token ? "success" : "error"](
          token
            ? t("notificationsEnabledDevice")
            : t("couldNotEnable"),
        );
      } else {
        localStorage.setItem(DEVICE_PUSH_KEY, "off");
        setDeviceOptedOut(true);
        await unregisterFcmToken();
        toast.success(t("notificationsTurnedOff"));
      }
    } finally {
      setDeviceBusy(false);
    }
  };

  const deviceDescription =
    devicePermission === "unsupported"
      ? t("deviceDescUnsupported")
      : devicePermission === "denied"
        ? t("deviceDescDenied")
        : deviceEnabled
          ? t("deviceDescEnabled")
          : t("deviceDescDisabled");

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
      toast.success(t("preferencesUpdated"));
    } catch (err) {
      console.error("Error updating preferences:", err);
      toast.error(t("failedToUpdate"));
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
        text={t("notificationSettingsTitle")}
        subtitle={t("chooseUpdatesSubtitle")}
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
                {t("notificationHistory")}
              </span>
              <span className="text-[13px] text-[#6B7280]">{t("reviewRecentAlerts")}</span>
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
                {t("notificationsThisDevice")}
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
              aria-label={t("toggleNotificationsDevice")}
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
                          aria-label={t("toggleItem", { title: item.title })}
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
          <AppSectionHeader title={t("notificationChannels")} icon={ShieldCheck} />

          <div className="grid grid-cols-3 gap-3">
            {channels.map((channel) => {
              const ChannelIcon = channel.icon;
              // The Push card reflects the live device state instead of a
              // hardcoded "On"; Email/SMS stay as their static placeholders.
              const isPush = channel.id === "push";
              const status = isPush ? (deviceEnabled ? t("statusOn") : t("statusOff")) : channel.status;
              const statusClassName = isPush
                ? deviceEnabled
                  ? "bg-emerald-50 text-brand"
                  : "bg-gray-100 text-[#6B7280]"
                : channel.statusClassName;

              return (
                <Card
                  variant="list"
                  key={channel.id}
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
            {t("criticalNotice")}
          </p>
        </Card>
    </PageShell>
  );
};

export default NotificationsPreferences;
