"use client";

import { LucideIcon } from "lucide-react";
import { HuzaLogo } from "@/components/brand/huza-logo";
import { colors } from "@/constant/colors";

interface BusinessAuthShellProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Optional line under the card, e.g. "Already have an account? Sign in". */
  footer?: React.ReactNode;
  maxWidthClass?: string;
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
}: BusinessAuthShellProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F4F7F3] px-4 py-10">
      <div className={`w-full ${maxWidthClass}`}>
        <div className="mb-6 flex items-center justify-center">
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
  );
}
