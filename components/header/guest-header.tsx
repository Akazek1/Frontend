"use client";

import React from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

/**
 * Header shown to logged-out guests on the home screen.
 * Replaces the personalized greeting / notifications / profile (which require
 * auth) with a value proposition and clear Log in / Sign up entry points.
 */
const GuestHeader: React.FC = () => {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Top row: location + auth actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-white/70 border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-[#145B10] flex-shrink-0" />
          <span className="text-[13px] font-semibold text-[#1B2431]">Kigali, Rwanda</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/onboarding?step=login"
            className="rounded-full border border-[#145B10] px-3.5 py-1.5 text-[13px] font-semibold text-[#145B10] hover:bg-[#F1FCEF] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-[#145B10] px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-[#1B5E20] transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>

      {/* Hero / value proposition */}
      <div>
        <h1 className="text-[20px] font-bold text-[#1B2431] leading-tight">
          Find trusted help or your next job 👋
        </h1>
        <p className="text-[13px] text-[#757575] mt-0.5">
          Browse jobs and service providers across Rwanda — no account needed.
        </p>
      </div>
    </div>
  );
};

export default GuestHeader;
