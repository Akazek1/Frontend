"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { LightboxState } from "@/hooks/useLightbox";

interface ImageLightboxProps {
  lightbox: LightboxState | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}

/**
 * Fullscreen image viewer — navigable with arrows, swipe, and keyboard.
 * Image is sized to always fit within the viewport (never clipped/off-screen).
 * Pair with the useLightbox() hook for state + keyboard bindings.
 */
export function ImageLightbox({ lightbox, onClose, onPrev, onNext, onSelect }: ImageLightboxProps) {
  const touchStartX = useRef(0);

  if (!lightbox) return null;
  const { images, index } = lightbox;
  const src = images[index];
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/15 p-2 text-white"
      >
        <X className="h-6 w-6" />
      </button>

      {hasPrev && (
        <button
          type="button"
          aria-label="Previous photo"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          aria-label="Next photo"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (dx > 50) onPrev();
          else if (dx < -50) onNext();
        }}
        style={{ maxHeight: "85dvh", maxWidth: "calc(100vw - 5rem)", width: "auto", height: "auto" }}
        className="rounded-lg"
      />

      {images.length > 1 && (
        <div className="absolute bottom-5 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Photo ${i + 1}`}
              onClick={(e) => { e.stopPropagation(); onSelect(i); }}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
