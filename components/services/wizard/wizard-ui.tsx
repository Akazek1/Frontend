"use client";

import type { ComponentType } from "react";
import {
  ArrowLeft,
  Baby,
  Bed,
  Briefcase,
  CalendarDays,
  Car,
  ChefHat,
  Hammer,
  HeartHandshake,
  Home,
  LayoutGrid,
  Lightbulb,
  PawPrint,
  Shield,
  ShoppingBag,
  SprayCan,
  Sprout,
  UserRound,
  Users,
  Utensils,
  WashingMachine,
  Wrench,
  Zap,
} from "lucide-react";

/** Taxonomy rows store lucide icon names in kebab-case ("spray-can"). */
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  home: Home,
  "spray-can": SprayCan,
  utensils: Utensils,
  "chef-hat": ChefHat,
  "washing-machine": WashingMachine,
  baby: Baby,
  users: Users,
  "user-round": UserRound,
  "heart-handshake": HeartHandshake,
  zap: Zap,
  wrench: Wrench,
  hammer: Hammer,
  sprout: Sprout,
  leaf: Sprout,
  shield: Shield,
  car: Car,
  "shopping-bag": ShoppingBag,
  "paw-print": PawPrint,
  bed: Bed,
  "calendar-days": CalendarDays,
  briefcase: Briefcase,
  lightbulb: Lightbulb,
};

export function TaxonomyIcon({
  icon,
  className = "h-5 w-5",
}: {
  icon?: string | null;
  className?: string;
}) {
  const Cmp = (icon && ICONS[icon]) || LayoutGrid;
  return <Cmp className={className} />;
}

/** Circular pale-green badge holding a taxonomy icon, as in the mockups. */
export function IconBadge({
  icon,
  size = "md",
}: {
  icon?: string | null;
  size?: "md" | "lg";
}) {
  const wrap = size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const glyph = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <span
      className={`flex ${wrap} shrink-0 items-center justify-center rounded-full bg-[#E8F7E5] text-brand`}
    >
      <TaxonomyIcon icon={icon} className={glyph} />
    </span>
  );
}

/** Centered title + subtitle header with a floating back button (mockup style). */
export function WizardHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  return (
    <header className="bg-surface sticky top-0 z-20 px-4 pb-3 pt-6">
      <div className="relative flex items-center justify-center">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-sm transition-colors hover:bg-[#E8F7E5]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-[20px] font-black text-ink">{title}</h1>
      </div>
      {subtitle && (
        <p className="mt-2 text-center text-[13px] text-ink-muted">{subtitle}</p>
      )}
    </header>
  );
}
