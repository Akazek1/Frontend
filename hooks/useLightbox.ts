"use client";

import { useEffect, useState, useCallback } from "react";

export interface LightboxState {
  images: string[];
  index: number;
}

/**
 * Shared fullscreen-image-viewer state: open/close, prev/next, and the
 * keyboard-arrow / Escape bindings. Pair with <ImageLightbox> for the modal UI.
 */
export function useLightbox() {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const open = useCallback((images: string[], index: number) => setLightbox({ images, index }), []);
  const close = useCallback(() => setLightbox(null), []);
  const prev = useCallback(
    () => setLightbox((lb) => (lb && lb.index > 0 ? { ...lb, index: lb.index - 1 } : lb)),
    [],
  );
  const next = useCallback(
    () =>
      setLightbox((lb) => (lb && lb.index < lb.images.length - 1 ? { ...lb, index: lb.index + 1 } : lb)),
    [],
  );
  const select = useCallback((index: number) => setLightbox((lb) => (lb ? { ...lb, index } : lb)), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, prev, next, close]);

  return { lightbox, open, close, prev, next, select };
}
