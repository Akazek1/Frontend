"use client";

import Link from "next/link";
import { LucideIcon, ArrowLeft } from "lucide-react";
import { HuzaLogo } from "@/components/brand/huza-logo";
import LanguageSwitcher from "@/components/header/language-switcher";
import { colors } from "@/constant/colors";

interface BusinessAuthShellProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Optional line under the card, e.g. "Already have an account? Sign in". */
  footer?: React.ReactNode;
  maxWidthClass?: string;
  /** Renders a back arrow that navigates to this href. */
  backHref?: string;
  /** Renders a back arrow that calls this function (used when back = previous phase). */
  onBack?: () => void;
}

/**
 * The centred card every business auth screen sits in — sign in, register,
 * forgot password, change password. Kept in one place so those four pages
 * can't drift apart visually.
 */
export function BusinessAuthShell({
  icon: Icon,
  title,
  subtitle,
  children,
  footer,
  maxWidthClass = "max-w-[420px]",
  backHref,
  onBack,
}: BusinessAuthShellProps) {
  const showBack = backHref || onBack;
  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F7F3]">
      {/* Top bar — language switcher sits here so its dropdown never overlaps the card */}
      <div className="flex items-center justify-end px-4 pt-3 pb-1">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-6">
      <div className={`w-full ${maxWidthClass}`}>
        <div className="mb-6 flex items-center justify-center relative">
          {showBack && (
            backHref
              ? <Link href={backHref} className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full bg-white border border-gray-200 text-ink hover:bg-gray-50">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              : <button type="button" onClick={onBack} className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full bg-white border border-gray-200 text-ink hover:bg-gray-50">
                  <ArrowLeft className="h-4 w-4" />
                </button>
          )}
          <HuzaLogo markClassName="h-8 w-8" wordClassName="text-[22px]" />
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div
              className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: colors.backgroundTertiary }}
            >
              <Icon className="h-7 w-7" style={{ color: colors.primary }} />
            </div>
            <h1 className="text-[22px] font-black text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>}
          </div>

          {children}
        </div>

        {footer && <div className="mt-5 text-center text-[13px] text-ink-muted">{footer}</div>}
      </div>
      </div>
    </div>
  );
}
