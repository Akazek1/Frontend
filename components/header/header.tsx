"use client";
import { Icons } from "@/components/icons";
import { RootState } from "@/store";
import { Bell, Globe, MapPin, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";

const Header = () => {
  const { user } = useSelector((state: RootState) => state.auth);

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
          <button className="flex items-center gap-1 bg-white/70 border border-gray-200 rounded-full px-2.5 py-1.5 shadow-sm">
            <Globe className="w-3.5 h-3.5 text-[#145B10]" />
            <span className="text-[12px] font-semibold text-[#1B2431]">EN</span>
          </button>

          {/* Bell */}
          <button className="relative bg-white/70 border border-gray-200 rounded-full p-2 shadow-sm">
            <Bell className="w-4 h-4 text-[#1B2431]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>

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
