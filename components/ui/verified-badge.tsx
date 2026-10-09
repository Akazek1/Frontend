import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const VERIFIED_BADGE_COLOR = "#145B10";
// The official Huza Support account is marked in blue, so it can never be
// mistaken for an ordinary verified user (green).
export const SUPPORT_BADGE_COLOR = "#1D8CF8";

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
  title?: string;
  fill?: string;
}

export function VerifiedBadge({ size = 20, className, title = "Verified", fill }: VerifiedBadgeProps) {
  return (
    <BadgeCheck
      width={size}
      height={size}
      fill={fill ?? VERIFIED_BADGE_COLOR}
      stroke="#FFFFFF"
      strokeWidth={2.25}
      aria-label={title}
      className={cn("flex-shrink-0", className)}
    />
  );
}
