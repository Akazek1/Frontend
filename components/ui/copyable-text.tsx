"use client";

import { Copy } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils";

interface CopyableTextProps {
  /** The raw value copied to the clipboard — pass the phone/email as-is. */
  value: string;
  /** What's shown; defaults to `value`. Use this to keep display formatting
   *  (e.g. a redacted or prettified string) while still copying the real value. */
  display?: string;
  /** Shown in the "X copied" toast, e.g. "Phone number". */
  label?: string;
  className?: string;
}

/**
 * A phone number or email rendered as plain text, with a tap-to-copy icon.
 * One component so every contact-info row in the app copies the same way.
 */
export function CopyableText({ value, display, label, className }: CopyableTextProps) {
  const copy = useCopyToClipboard();

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <span className="truncate">{display ?? value}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          copy(value, label);
        }}
        className="shrink-0 rounded-md p-0.5 text-current opacity-60 hover:opacity-100 hover:bg-black/5"
        aria-label={label ? `Copy ${label.toLowerCase()}` : "Copy"}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
