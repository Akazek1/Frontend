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
  const BackButton = () => showBack ? (
    backHref
      ? <Link href={backHref} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-ink hover:bg-white/30">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      : <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-ink hover:bg-white/30">
          <ArrowLeft className="h-4 w-4" />
        </button>
  ) : <div className="w-9" />;

  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F7F3]">
      {/* Top bar on green background: back | logo | language switcher */}
      <div className="flex items-center justify-between px-4 pt-4 pb-4">
        <BackButton />
        <HuzaLogo markClassName="h-8 w-8" wordClassName="text-[22px]" />
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 items-start justify-center px-4 pt-4 pb-8">
        <div className={`w-full ${maxWidthClass}`}>
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
