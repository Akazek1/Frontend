"use client";
import { useState } from "react";
import { RootState } from "@/store";
import { Bell, Check, Clock, Globe, MapPin, MessageCircle, ShieldCheck, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const languages = [
  { code: "EN", name: "English", hint: "Default app language" },
  { code: "RW", name: "Kinyarwanda", hint: "Simple local wording" },
  { code: "FR", name: "French", hint: "Available soon" },
  { code: "SW", name: "Swahili", hint: "Available soon" },
];

const notifications = [
  {
    title: "Booking request sent",
    body: "Your request for home cleaning is waiting for provider confirmation.",
    time: "Just now",
    icon: Clock,
  },
  {
    title: "Verification reminder",
    body: "Add your ID photo later to improve trust on your profile.",
    time: "Today",
    icon: ShieldCheck,
  },
  {
    title: "New message preview",
    body: "Messages will appear here when chat is enabled.",
    time: "Demo",
    icon: MessageCircle,
  },
];

const Header = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

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
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Open notifications"
                className="relative bg-white/70 border border-gray-200 rounded-full p-2 shadow-sm"
              >
                <Bell className="w-4 h-4 text-[#1B2431]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[calc(100vw-24px)] max-w-[320px] rounded-2xl border-gray-100 bg-white p-0 shadow-xl">
              <div className="border-b border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-bold text-[#1B2431]">Notifications</p>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">3 new</span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#757575]">Fixed preview content for the future feature.</p>
              </div>
              <div className="max-h-[320px] overflow-y-auto p-2">
                {notifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <button
                      key={notification.title}
                      type="button"
                      className="flex w-full gap-3 rounded-xl px-2 py-3 text-left hover:bg-gray-50"
                    >
                      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F1FCEF]">
                        <Icon className="h-4 w-4 text-[#145B10]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-[#1B2431]">{notification.title}</span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-[#616161]">{notification.body}</span>
                        <span className="mt-1 block text-[10px] font-semibold text-[#9E9E9E]">{notification.time}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="w-full border-t border-gray-100 py-3 text-center text-[12px] font-bold text-[#145B10] hover:bg-[#F1FCEF]"
              >
                View all notifications
              </button>
            </PopoverContent>
          </Popover>

          {/* Avatar */}
          <Link href="/profile">
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
          {getGreeting()}, {user?.firstName || user?.phoneNumber} 👋
        </h1>
        <p className="text-[13px] text-[#757575] mt-0.5">How can we help you today?</p>
      </div>
    </div>
  );
};

export default Header;
