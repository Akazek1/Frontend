"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

type MarketingImageProps = {
  /** Public path, e.g. "/marketing/app-home.png". Drop the file there to show it. */
  src: string;
  alt: string;
  /** Placeholder title shown until the file exists, e.g. "Add app screenshot". */
  label: string;
  /** Placeholder hint, e.g. recommended size. */
  hint?: string;
  /** Sizing/aspect/rounding classes for the slot (applies to both image + placeholder). */
  className?: string;
};

// Renders a real image once its file is dropped into /public, and a labeled
// dashed placeholder until then — so the marketing page never 404s or looks
// broken while assets are still being added.
export function MarketingImage({ src, alt, label, hint, className = "" }: MarketingImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex min-h-[160px] flex-col items-center justify-center gap-2 border-2 border-dashed border-brand/40 bg-surface p-4 text-center ${className}`}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand ring-1 ring-brand/20">
          <ImageIcon className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold text-brand">{label}</span>
        {hint ? <span className="text-xs leading-snug text-ink-subtle">{hint}</span> : null}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
