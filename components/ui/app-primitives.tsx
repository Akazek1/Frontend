"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, X, type LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Class-string helpers below are the single source of truth for these styles;
// the components further down (PageShell, Card, AppButton, FormField, …) consume
// them. The strings stay exported as composition escape hatches — apply them with
// cn() to a semantically-correct element (a <button>, <a>, <section>) when a
// wrapper component doesn't fit. Prefer the component for the common case.

export const appContentClass = "flex flex-col gap-4";

export const appStickyHeaderClass =
  "bg-surface sticky top-0 z-20 mx-auto w-full max-w-[428px] px-4 pb-3 pt-6 shadow-sm backdrop-blur";

export const appCardClass =
  "rounded-2xl border border-[#DCE8D9] bg-white p-4 shadow-[0_8px_24px_rgba(27,36,49,0.05)]";

export const appListCardClass =
  "rounded-2xl border border-[#DCE8D9] bg-white shadow-[0_8px_24px_rgba(27,36,49,0.05)]";

export const appActionCardClass =
  "rounded-2xl border border-[#DCE8D9] bg-white p-4 shadow-[0_8px_24px_rgba(27,36,49,0.05)] transition-colors hover:bg-[#FBFEFA]";

export const appStatusCardClass =
  "rounded-2xl border border-[#CFE8CD] bg-surface p-4 text-brand";

export const appInputClass =
  "w-full h-12 rounded-xl border-[#DCE8D9] bg-white px-4 text-[14px] font-semibold text-ink shadow-sm placeholder:text-[#98A2B3] focus-visible:ring-brand/20";

export const appTextareaClass =
  "w-full min-h-[120px] resize-none rounded-xl border-[#DCE8D9] bg-white px-4 py-3 text-[14px] font-semibold leading-6 text-ink shadow-sm placeholder:text-[#98A2B3] focus-visible:ring-brand/20";

export const appPrimaryButtonClass =
  "h-12 rounded-xl bg-brand px-4 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50";

export const appSecondaryButtonClass =
  "h-12 rounded-xl border border-brand/30 bg-white px-4 text-[14px] font-bold text-brand shadow-sm transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50";

export const appDangerButtonClass =
  "h-12 rounded-xl border border-red-200 bg-red-50 px-4 text-[14px] font-bold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50";

export const appFieldLabelClass =
  "text-[12px] font-black uppercase tracking-wide text-[#53604F]";

// Internal-only: surfaced through <FormField/>, not part of the public API.
const appFieldHintClass = "text-[11px] leading-4 text-[#6B7668]";

const appFieldErrorClass = "text-[11px] font-semibold text-red-500";

type AppButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type AppButtonProps = Omit<ButtonProps, "variant"> & {
  appVariant?: AppButtonVariant;
};

const appButtonVariantClass: Record<AppButtonVariant, string> = {
  primary: appPrimaryButtonClass,
  secondary: appSecondaryButtonClass,
  danger: appDangerButtonClass,
  ghost:
    "h-12 rounded-xl bg-transparent px-4 text-[14px] font-bold text-brand transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50",
};

export function AppButton({
  appVariant = "primary",
  className,
  ...props
}: AppButtonProps) {
  return (
    <Button
      className={cn(appButtonVariantClass[appVariant], className)}
      {...props}
    />
  );
}

type FormFieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({
  label,
  required,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className={cn("block", appFieldLabelClass)}>
        {label}
        {required ? <span className="text-[#FF3D00]"> *</span> : null}
      </label>
      {children}
      {error ? <p className={appFieldErrorClass}>{error}</p> : null}
      {!error && hint ? <p className={appFieldHintClass}>{hint}</p> : null}
    </div>
  );
}

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
        "bg-surface mx-auto flex min-h-dvh w-full max-w-[428px] flex-col",
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
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sm transition-colors hover:bg-[#E8F7E5]">
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
              "font-black text-ink",
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

type AppCardVariant = "base" | "list" | "action" | "status";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: AppCardVariant;
};

const appCardVariantClass: Record<AppCardVariant, string> = {
  base: appCardClass,
  list: appListCardClass,
  action: appActionCardClass,
  status: appStatusCardClass,
};

export function Card({
  variant = "base",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div className={cn(appCardVariantClass[variant], className)} {...props}>
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
          {Icon ? <Icon className="h-4 w-4 text-brand" /> : null}
          <h2 className="text-[13px] font-black uppercase tracking-wide text-ink">
            {title}
          </h2>
          {typeof count === "number" ? (
            <span className="rounded-full bg-[#E8F7E5] px-2 py-0.5 text-[11px] font-black text-brand">
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
    <Card className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}>
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F7E5] text-brand">
        <Icon className="h-8 w-8" />
      </span>
      <h3 className="mt-5 text-[16px] font-black text-ink">{title}</h3>
      <p className="mt-2 max-w-[280px] text-[13px] leading-6 text-[#5F6773]">{description}</p>
      {action ? <div className="mt-6 w-full">{action}</div> : null}
    </Card>
  );
}

type SheetOverlayProps = React.HTMLAttributes<HTMLDivElement> & {
  zIndexClassName?: string;
};

export function SheetOverlay({
  className,
  // Above the app's fixed bottom nav (z-50) so the sheet reads as a true modal
  // (nav dimmed, not floating on top). Override per-call-site if a sheet needs
  // to stack above another sheet.
  zIndexClassName = "z-[60]",
  ...props
}: SheetOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150",
        zIndexClassName,
        className,
      )}
      {...props}
    />
  );
}

type SheetPanelSide = "bottom" | "right" | "center";

const SHEET_FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Gives a SheetPanel real dialog semantics when an onClose is supplied:
// Escape-to-close, a focus trap, scroll lock, and focus restore on unmount.
// No-op when onClose is omitted, so existing call sites are unaffected.
function useSheetDialog(
  ref: React.RefObject<HTMLDivElement | null>,
  onClose?: () => void,
) {
  React.useEffect(() => {
    if (!onClose) return;
    const node = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = () =>
      node
        ? Array.from(node.querySelectorAll<HTMLElement>(SHEET_FOCUSABLE)).filter(
            (el) => el.offsetParent !== null,
          )
        : [];

    (focusable()[0] ?? node)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = focusable();
      if (items.length === 0) {
        e.preventDefault();
        node.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [ref, onClose]);
}

type SheetPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: SheetPanelSide;
  zIndexClassName?: string;
  /**
   * When provided, the panel behaves as a modal dialog: Escape closes it,
   * focus is trapped inside and restored on close, and body scroll is locked.
   * Wire it to the same handler your overlay's onClick uses.
   */
  onClose?: () => void;
};

const sheetPanelSideClass: Record<SheetPanelSide, string> = {
  bottom:
    "bottom-0 left-0 right-0 mx-auto max-w-[428px] rounded-t-3xl animate-in slide-in-from-bottom duration-200",
  right:
    "bottom-0 right-0 top-0 w-[88%] max-w-[380px] rounded-l-2xl animate-in slide-in-from-right duration-200",
  center:
    "left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-[428px] -translate-x-1/2 -translate-y-1/2 rounded-3xl",
};

export function SheetPanel({
  side = "bottom",
  zIndexClassName = "z-[70]",
  className,
  children,
  onClose,
  ...props
}: SheetPanelProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  useSheetDialog(ref, onClose);
  return (
    <div
      ref={ref}
      role={onClose ? "dialog" : undefined}
      aria-modal={onClose ? true : undefined}
      tabIndex={onClose ? -1 : undefined}
      className={cn(
        "fixed flex flex-col bg-white shadow-2xl outline-none",
        sheetPanelSideClass[side],
        zIndexClassName,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type SheetHeaderProps = {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  leading?: React.ReactNode;
  className?: string;
};

export function SheetHeader({
  title,
  subtitle,
  onClose,
  leading,
  className,
}: SheetHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-[#EDF1EC] px-5 py-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-black text-ink">{title}</h2>
          {subtitle ? <p className="mt-1 text-[12px] leading-4 text-[#5F6773]">{subtitle}</p> : null}
        </div>
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}

export function SheetBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-5 py-5", className)} {...props}>
      {children}
    </div>
  );
}

export function SheetFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-t border-[#EDF1EC] bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
