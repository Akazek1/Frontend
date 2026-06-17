"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { profileImageFallback, shouldUnoptimizeImage } from "@/lib/service-display";

/** Card surface used across agency screens. */
export function AgencyCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-gray-100 bg-white shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/** Page header: optional back link, title, optional status badge, optional right actions. */
export function AgencyPageHeader({
  title,
  subtitle,
  backHref,
  badge,
  actions,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:mb-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[22px] font-black text-ink lg:text-[26px]">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

type PillTone = "green" | "amber" | "red" | "gray" | "blue";

const PILL_TONES: Record<PillTone, string> = {
  green: "bg-[#E8F7E5] text-[#145B10]",
  amber: "bg-[#FFF4E0] text-[#B45309]",
  red: "bg-[#FEECEC] text-[#DC2626]",
  gray: "bg-gray-100 text-gray-600",
  blue: "bg-[#E6F0FB] text-[#1D4ED8]",
};

export function StatusPill({
  label,
  tone = "gray",
  className,
}: {
  label: string;
  tone?: PillTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold",
        PILL_TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

export function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const imgSrc = src || profileImageFallback;
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-full bg-gray-100", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={imgSrc}
        alt={name}
        fill
        sizes={`${size}px`}
        className="object-cover object-top"
        unoptimized={shouldUnoptimizeImage(imgSrc)}
      />
    </div>
  );
}

/** Card whose body collapses on mobile but stays open on desktop (lg+). */
export function Collapsible({
  title,
  icon: Icon,
  defaultOpen = true,
  action,
  children,
}: {
  title: string;
  icon?: React.ElementType<{ className?: string }>;
  defaultOpen?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <AgencyCard className="overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-4 lg:px-5">
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F7E5]">
            <Icon className="h-4 w-4 text-brand" />
          </span>
        )}
        <button onClick={() => setOpen((o) => !o)} className="flex flex-1 items-center gap-2 text-left lg:cursor-default">
          <span className="flex-1 text-[15px] font-bold text-ink">{title}</span>
          <ChevronDown className={cn("h-5 w-5 text-gray-400 transition-transform lg:hidden", open && "rotate-180")} />
        </button>
        {action}
      </div>
      <div className={cn("px-4 pb-5 lg:block lg:px-5", open ? "block" : "hidden")}>{children}</div>
    </AgencyCard>
  );
}

export function AgencyLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-brand" />
    </div>
  );
}

export function AgencyEmpty({ title, hint }: { title: string; hint?: string }) {
  return (
    <AgencyCard className="flex flex-col items-center justify-center gap-1 px-6 py-16 text-center">
      <p className="text-[15px] font-bold text-ink">{title}</p>
      {hint && <p className="text-[13px] text-ink-muted">{hint}</p>}
    </AgencyCard>
  );
}
