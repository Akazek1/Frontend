"use client";
import { useState } from "react";
import { RootState } from "@/store";
import { Bell, Check, Globe, MapPin, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { getProviderHandle } from "@/lib/service-display";
import { NotificationItem, getNotificationHref, useNotifications } from "@/hooks/useNotifications";
import { NotificationRow } from "@/components/notifications/notification-row";

const languages = [
  { code: "EN", name: "English", hint: "Default app language" },
  { code: "RW", name: "Kinyarwanda", hint: "Simple local wording" },
  { code: "FR", name: "French", hint: "Available soon" },
  { code: "SW", name: "Swahili", hint: "Available soon" },
];

const Header = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const router = useRouter();
  const { items, unreadCount, refetch, markRead } = useNotifications({ limit: 5 });

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.readAt) await markRead(n.id);
    const href = getNotificationHref(n);
    if (href) router.push(href);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Top row */}
      <div className="flex items-center justify-between">

        {/* Location label — static display only */}
        <div className="flex items-center gap-1.5 bg-white/70 border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-brand flex-shrink-0" />
          <span className="text-[13px] font-semibold text-ink">Kigali, Rwanda</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">

          {/* Language chip */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Change language"
                className="flex items-center gap-1 bg-white/70 border border-gray-200 rounded-full px-2.5 py-1.5 shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-brand" />
                <span className="text-[12px] font-semibold text-ink">{selectedLanguage}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[calc(100vw-24px)] max-w-[300px] rounded-2xl border-gray-100 bg-white p-3 shadow-xl">
              <div className="space-y-3">
                <div>
                  <p className="text-[14px] font-bold text-ink">Choose language</p>
                  <p className="text-[11px] text-ink-subtle">Preview only. Translation is not connected yet.</p>
                </div>
                <div className="space-y-1">
                  {languages.map((language) => {
                    const active = selectedLanguage === language.code;
                    return (
                      <button
                        key={language.code}
                        type="button"
                        onClick={() => setSelectedLanguage(language.code)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          active ? "bg-surface ring-1 ring-brand/20" : "hover:bg-gray-50"
                        }`}
                      >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${
                          active ? "bg-brand text-white" : "bg-gray-100 text-ink"
                        }`}>
                          {language.code}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold text-ink">{language.name}</span>
                          <span className="block text-[11px] text-ink-subtle">{language.hint}</span>
                        </span>
                        {active && <Check className="h-4 w-4 text-brand" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Bell */}
          <Popover onOpenChange={(open) => { if (open) refetch(); }}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Open notifications"
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
                  <p className="text-[14px] font-bold text-ink">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">{unreadCount} new</span>
                  )}
                </div>
              </div>
              <div className="max-h-[320px] overflow-y-auto p-2">
                {items.length === 0 ? (
                  <p className="px-3 py-6 text-center text-[12px] text-ink-subtle">No notifications yet.</p>
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
                View all notifications
              </Link>
            </PopoverContent>
          </Popover>

          {/* Avatar - go to personal profile or onboarding if not logged in */}
          <Link href={user ? `/${getProviderHandle(user).replace(/^@/, "")}` : "/onboarding"}>
            {user?.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt="Profile"
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
        <p className="text-[13px] text-ink-subtle mt-0.5">Find jobs, earn and grow with Akazek.</p>
      </div>
    </div>
  );
};

export default Header;
