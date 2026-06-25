"use client";
import { RootState } from "@/store";
import { Bell, MapPin, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSelector } from "react-redux";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import LanguageSwitcher from "@/components/header/language-switcher";

import { getProviderHandle } from "@/lib/service-display";
import { NotificationItem, getNotificationHref, useNotifications } from "@/hooks/useNotifications";
import { NotificationRow } from "@/components/notifications/notification-row";
import api from "@/lib/axios";
import type { AddressDisplay } from "@/lib/location-display";
import { useEffect, useMemo, useState } from "react";

type HeaderAddress = AddressDisplay & {
  isDefault?: boolean;
};

const Header = () => {
  const t = useTranslations("header");
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const { items, unreadCount, refetch, markRead } = useNotifications({ limit: 5 });
  const [address, setAddress] = useState<HeaderAddress | null>(null);

  useEffect(() => {
    if (!user) {
      setAddress(null);
      return;
    }

    let cancelled = false;
    async function loadAddress() {
      try {
        const response = await api.get("/users/profile");
        const profile = response.data?.data || response.data || {};
        const addresses = Array.isArray(profile.addresses) ? profile.addresses : [];
        const next = addresses.find((addr: HeaderAddress) => addr.isDefault) || addresses[0] || null;
        if (!cancelled) setAddress(next);
      } catch {
        if (!cancelled) setAddress(null);
      }
    }

    void loadAddress();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const locationLabel = useMemo(() => {
    if (!user) return "Kigali, Rwanda";
    const city = address?.city?.trim();
    if (city) return city;
    const district = address?.district?.trim();
    if (district) return district;
    return t("location.set");
  }, [address, user, t]);

  const locationDetail = useMemo(() => {
    if (!address) return null;
    return [
      address.sector ? { label: t("location.sector"), value: address.sector } : null,
      address.district ? { label: t("location.district"), value: address.district } : null,
      address.city ? { label: t("location.city"), value: address.city } : null,
      address.country ? { label: t("location.country"), value: address.country } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }, [address, t]);

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.readAt) await markRead(n.id);
    const href = getNotificationHref(n);
    if (href) router.push(href);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("greeting.morning");
    if (hour < 17) return t("greeting.afternoon");
    if (hour < 21) return t("greeting.evening");
    return t("greeting.night");
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Top row */}
      <div className="flex items-center justify-between">

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex max-w-[190px] items-center gap-1.5 rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-left shadow-sm transition hover:border-brand/40 hover:bg-white"
              aria-label={t("location.aria")}
            >
              <MapPin className="w-3.5 h-3.5 text-brand flex-shrink-0" />
              <span className="truncate text-[13px] font-semibold text-ink">{locationLabel}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[calc(100vw-24px)] max-w-[300px] rounded-2xl border-gray-100 bg-white p-0 shadow-xl">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-[14px] font-bold text-ink">{t("location.title")}</p>
              <p className="mt-0.5 text-[12px] leading-5 text-ink-subtle">
                {t("location.subtitle")}
              </p>
            </div>
            <div className="space-y-2 px-4 py-3">
              {locationDetail?.length ? (
                locationDetail.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-[12px]">
                    <span className="text-ink-subtle">{item.label}</span>
                    <span className="min-w-0 truncate font-semibold text-ink">{item.value}</span>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-ink-subtle">{t("location.empty")}</p>
              )}
            </div>
            <Link
              href="/profile?section=location"
              className="block border-t border-gray-100 px-4 py-3 text-center text-[12px] font-bold text-brand hover:bg-surface"
            >
              {t("location.change")}
            </Link>
          </PopoverContent>
        </Popover>

        {/* Actions */}
        <div className="flex items-center gap-2">

          {/* Language chip — list driven by the admin "Languages" page */}
          <LanguageSwitcher />

          {/* Bell */}
          <Popover onOpenChange={(open) => { if (open) refetch(); }}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={t("notifications.aria")}
                className="relative bg-white/70 border border-gray-200 rounded-full p-2 shadow-sm"
              >
                <Bell className="w-4 h-4 text-ink" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full border border-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[calc(100vw-24px)] max-w-[320px] rounded-2xl border-gray-100 bg-white p-0 shadow-xl">
              <div className="border-b border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-bold text-ink">{t("notifications.title")}</p>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">{t("notifications.newBadge", { count: unreadCount })}</span>
                  )}
                </div>
              </div>
              <div className="max-h-[320px] overflow-y-auto p-2">
                {items.length === 0 ? (
                  <p className="px-3 py-6 text-center text-[12px] text-ink-subtle">{t("notifications.empty")}</p>
                ) : (
                  items.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      onClick={handleNotificationClick}
                      variant="compact"
                    />
                  ))
                )}
              </div>
              <Link
                href="/more/notifications/history"
                className="block w-full border-t border-gray-100 py-3 text-center text-[12px] font-bold text-brand hover:bg-surface"
              >
                {t("notifications.viewAll")}
              </Link>
            </PopoverContent>
          </Popover>

          {/* Avatar - go to personal profile or onboarding if not logged in */}
          <Link href={user ? `/${getProviderHandle(user).replace(/^@/, "")}` : "/onboarding"}>
            {user?.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt={t("profileAlt")}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-brand/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center ring-2 ring-brand/30">
                <User className="w-4 h-4" />
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Greeting */}
      <div>
        <h1 className="text-[20px] font-bold text-ink leading-tight">
          {getGreeting()}{user?.firstName ? `, ${user.firstName}` : ""} 👋
        </h1>
        <p className="text-[13px] text-ink-subtle mt-0.5">{t("subtitle")}</p>
      </div>
    </div>
  );
};

export default Header;
