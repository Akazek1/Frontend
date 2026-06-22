"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Lightbulb, ShieldCheck } from "lucide-react";

interface TipCardProps {
  title?: string;
  body: string;
  /** Stable key used to persist a "dismissed" flag in localStorage. */
  persistKey?: string;
  /** When set, the card is a link to this href. */
  href?: string;
  /** Icon variant. Defaults to a green shield (the screenshot's design). */
  variant?: "shield" | "lightbulb";
  dismissible?: boolean;
}

const STORAGE_PREFIX = "hwa.tip_dismissed.";

function readDismissed(key?: string) {
  if (!key || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(key: string) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, "1");
  } catch {
    /* ignore quota errors */
  }
}

export function TipCard({
  title = "Tip",
  body,
  persistKey,
  href,
  variant = "shield",
  dismissible = true,
}: TipCardProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(readDismissed(persistKey));
  }, [persistKey]);

  if (dismissible && dismissed) return null;

  const Icon = variant === "lightbulb" ? Lightbulb : ShieldCheck;

  const inner = (
    <div className="flex items-start gap-3 rounded-2xl border border-[#DCEEDD] bg-surface p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
        <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-black text-ink">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">
          {body}
        </p>
      </div>
      {href && (
        <ChevronRight
          className="mt-1 h-4 w-4 shrink-0 text-ink-subtle"
          aria-hidden="true"
        />
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={() => {
          if (dismissible && persistKey) {
            writeDismissed(persistKey);
            setDismissed(true);
          }
        }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
