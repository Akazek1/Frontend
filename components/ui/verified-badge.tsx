import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const VERIFIED_BADGE_COLOR = "#145B10";

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
  title?: string;
}

export function VerifiedBadge({ size = 20, className, title = "Verified" }: VerifiedBadgeProps) {
  return (
    <BadgeCheck
      width={size}
      height={size}
      fill={VERIFIED_BADGE_COLOR}
      stroke="#FFFFFF"
      strokeWidth={2.25}
      aria-label={title}
      className={cn("flex-shrink-0", className)}
    />
  );
}
