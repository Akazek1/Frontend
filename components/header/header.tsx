"use client";
import { useState } from "react";
import { RootState } from "@/store";
import { Bell, Briefcase, Calendar, Check, CheckCircle, Globe, MapPin, User, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { getProviderHandle } from "@/lib/service-display";
import { useAuth } from "@/hooks/useAuth";
import { NotificationItem, formatRelativeTime, useNotifications } from "@/hooks/useNotifications";

const languages = [
  { code: "EN", name: "English", hint: "Default app language" },
  { code: "RW", name: "Kinyarwanda", hint: "Simple local wording" },
  { code: "FR", name: "French", hint: "Available soon" },
  { code: "SW", name: "Swahili", hint: "Available soon" },
];

function iconForType(type?: string) {
  switch (type) {
    case "NEW_APPLICATION":
      return Briefcase;
    case "JOB_AWARDED":
      return CheckCircle;
    case "BOOKING_CONFIRMED":
      return Calendar;
    case "BOOKING_CANCELLED":
      return XCircle;
    default:
      return Bell;
  }
}

function routeForNotification(n: NotificationItem): string | null {
  const meta = n.metadata || {};
  if (meta.bookingId) return `/bookings/${meta.bookingId}`;
  if (meta.jobId) return `/jobs/${meta.jobId}`;
  return null;
}

const Header = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const router = useRouter();
  const { items, unreadCount, refetch, markRead } = useNotifications({ limit: 5 });

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.readAt) await markRead(n.id);
    const href = routeForNotification(n);
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
          <MapPin className="w-3.5 h-3.5 text-[#145B10] flex-shrink-0" />
          <span className="text-[13px] font-semibold text-[#1B2431]">Kigali, Rwanda</span>
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
                <Globe className="w-3.5 h-3.5 text-[#145B10]" />
                <span className="text-[12px] font-semibold text-[#1B2431]">{selectedLanguage}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[calc(100vw-24px)] max-w-[300px] rounded-2xl border-gray-100 bg-white p-3 shadow-xl">
              <div className="space-y-3">
                <div>
                  <p className="text-[14px] font-bold text-[#1B2431]">Choose language</p>
                  <p className="text-[11px] text-[#757575]">Preview only. Translation is not connected yet.</p>
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
                          active ? "bg-[#F1FCEF] ring-1 ring-[#145B10]/20" : "hover:bg-gray-50"
                        }`}
                      >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${
                          active ? "bg-[#145B10] text-white" : "bg-gray-100 text-[#1B2431]"
                        }`}>
                          {language.code}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold text-[#1B2431]">{language.name}</span>
                          <span className="block text-[11px] text-[#757575]">{language.hint}</span>
                        </span>
                        {active && <Check className="h-4 w-4 text-[#145B10]" />}
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
                <Bell className="w-4 h-4 text-[#1B2431]" />
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
                  <p className="text-[14px] font-bold text-[#1B2431]">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">{unreadCount} new</span>
                  )}
                </div>
              </div>
              <div className="max-h-[320px] overflow-y-auto p-2">
                {items.length === 0 ? (
                  <p className="px-3 py-6 text-center text-[12px] text-[#757575]">No notifications yet.</p>
                ) : (
                  items.map((notification) => {
                    const Icon = iconForType(notification.metadata?.type);
                    const isUnread = !notification.readAt;
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className={`flex w-full gap-3 rounded-xl px-2 py-3 text-left hover:bg-gray-50 ${isUnread ? "bg-[#F1FCEF]/50" : ""}`}
                      >
                        <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F1FCEF]">
                          <Icon className="h-4 w-4 text-[#145B10]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[13px] text-[#1B2431] ${isUnread ? "font-bold" : "font-semibold"}`}>{notification.title}</span>
                          <span className="mt-0.5 block text-[11px] leading-4 text-[#616161]">{notification.body}</span>
                          <span className="mt-1 block text-[10px] font-semibold text-[#9E9E9E]">{formatRelativeTime(notification.createdAt)}</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              <Link
                href="/more/notifications/history"
                className="block w-full border-t border-gray-100 py-3 text-center text-[12px] font-bold text-[#145B10] hover:bg-[#F1FCEF]"
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
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#145B10]/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#145B10] text-white flex items-center justify-center ring-2 ring-[#145B10]/30">
                <User className="w-4 h-4" />
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Greeting */}
      <div>
        <h1 className="text-[20px] font-bold text-[#1B2431] leading-tight">
          {getGreeting()}{user?.firstName ? `, ${user.firstName}` : ""} 👋
        </h1>
        <p className="text-[13px] text-[#757575] mt-0.5">Find jobs, earn and grow with Akazek.</p>
      </div>
    </div>
  );
};

export default Header;
