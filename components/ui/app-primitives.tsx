import * as React from "react";
import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const appShellClass =
  "app-bg mx-auto flex min-h-dvh w-full max-w-[428px] flex-col px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6";

export const appBgClass = "app-bg";

export const appContentClass = "flex flex-col gap-4";

export const appStickyHeaderClass =
  "app-bg sticky top-0 z-20 mx-auto w-full max-w-[428px] px-4 pb-3 pt-6 shadow-sm backdrop-blur";

export const appCardClass =
  "rounded-2xl border border-[#DCE8D9] bg-white p-4 shadow-[0_8px_24px_rgba(27,36,49,0.05)]";

export const appListCardClass =
  "rounded-2xl border border-[#DCE8D9] bg-white shadow-[0_8px_24px_rgba(27,36,49,0.05)]";

export const appInputClass =
  "h-12 rounded-xl border-[#DCE8D9] bg-white px-4 text-[14px] font-semibold text-[#1B2431] shadow-sm placeholder:text-[#98A2B3] focus-visible:ring-[#145B10]/20";

export const appTextareaClass =
  "min-h-[120px] resize-none rounded-xl border-[#DCE8D9] bg-white px-4 py-3 text-[14px] font-semibold leading-6 text-[#1B2431] shadow-sm placeholder:text-[#98A2B3] focus-visible:ring-[#145B10]/20";

export const appPrimaryButtonClass =
  "h-12 rounded-xl bg-[#145B10] px-4 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-[#0F4D0C] disabled:cursor-not-allowed disabled:opacity-50";

export const appSecondaryButtonClass =
  "h-12 rounded-xl border border-[#145B10]/30 bg-white px-4 text-[14px] font-bold text-[#145B10] shadow-sm transition-colors hover:bg-[#F1FCEF] disabled:cursor-not-allowed disabled:opacity-50";

export const appDangerButtonClass =
  "h-12 rounded-xl border border-red-200 bg-red-50 px-4 text-[14px] font-bold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50";

export const appFieldLabelClass =
  "text-[12px] font-black uppercase tracking-wide text-[#53604F]";

export const appFieldHintClass = "text-[11px] leading-4 text-[#6B7668]";

export const appFieldErrorClass = "text-[11px] font-semibold text-red-500";

type PageShellProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode;
  padded?: boolean;
  bottomNav?: boolean;
};

export function PageShell({
  children,
  className,
  padded = true,
  bottomNav = true,
  ...props
}: PageShellProps) {
  return (
    <main
      className={cn(
        "app-bg mx-auto flex min-h-dvh w-full max-w-[428px] flex-col",
        padded && "px-4 pt-6",
        bottomNav ? "pb-[calc(6rem+env(safe-area-inset-bottom))]" : "pb-6",
        className,
      )}
      {...props}
    >
      {children}
    </main>
  );
}

export function AppShell(props: PageShellProps) {
  return <PageShell {...props} />;
}

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  compact?: boolean;
};

export function PageHeader({
  title,
  subtitle,
  backHref,
  onBack,
  action,
  className,
  titleClassName,
  compact = false,
}: PageHeaderProps) {
  const backButton = (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1B2431] shadow-sm transition-colors hover:bg-[#E8F7E5]">
      <ArrowLeft className="h-5 w-5" />
    </span>
  );

  return (
    <header className={cn("flex items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {backHref ? (
          <Link href={backHref} aria-label="Go back" className="shrink-0">
            {backButton}
          </Link>
        ) : onBack ? (
          <button type="button" onClick={onBack} aria-label="Go back" className="shrink-0">
            {backButton}
          </button>
        ) : null}
        <div className="min-w-0 pt-0.5">
          <h1
            className={cn(
              compact ? "text-[20px] leading-6" : "text-[24px] leading-7",
              "font-black text-[#1B2431]",
              titleClassName,
            )}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-[13px] font-medium leading-5 text-[#5F6773]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function AppHeader(props: PageHeaderProps) {
  return <PageHeader {...props} />;
}

export function AppCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(appCardClass, className)} {...props}>
      {children}
    </div>
  );
}

type AppSectionHeaderProps = {
  title: string;
  count?: number;
  subtitle?: string;
  icon?: React.ElementType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
};

export function AppSectionHeader({
  title,
  count,
  subtitle,
  icon: Icon,
  action,
  className,
}: AppSectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-1", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-[#145B10]" /> : null}
          <h2 className="text-[13px] font-black uppercase tracking-wide text-[#1B2431]">
            {title}
          </h2>
          {typeof count === "number" ? (
            <span className="rounded-full bg-[#E8F7E5] px-2 py-0.5 text-[11px] font-black text-[#145B10]">
              {count}
            </span>
          ) : null}
        </div>
        {subtitle ? <p className="mt-1 text-[12px] leading-5 text-[#5F6773]">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <AppCard className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}>
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F7E5] text-[#145B10]">
        <Icon className="h-8 w-8" />
      </span>
      <h3 className="mt-5 text-[16px] font-black text-[#1B2431]">{title}</h3>
      <p className="mt-2 max-w-[280px] text-[13px] leading-6 text-[#5F6773]">{description}</p>
      {action ? <div className="mt-6 w-full">{action}</div> : null}
    </AppCard>
  );
}
