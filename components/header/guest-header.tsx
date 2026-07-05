"use client";

import React from "react";
import Link from "next/link";
import LanguageSwitcher from "@/components/header/language-switcher";

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
        <LanguageSwitcher />

        <div className="flex items-center gap-2">
          <Link
            href="/onboarding?step=login"
            className="rounded-full border border-brand px-3.5 py-1.5 text-[13px] font-semibold text-brand hover:bg-surface transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-brand px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-brand-strong transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>

      {/* Hero / value proposition */}
      <div>
        <h1 className="text-[20px] font-bold text-ink leading-tight">
          Find trusted help or your next job 👋
        </h1>
        <p className="text-[13px] text-ink-subtle mt-0.5">
          Browse jobs and service providers across Rwanda — no account needed.
        </p>
      </div>
    </div>
  );
};

export default GuestHeader;
