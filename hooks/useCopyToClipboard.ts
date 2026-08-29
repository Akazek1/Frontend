"use client";

import { useCallback } from "react";
import toast from "react-hot-toast";

/**
 * Copies plain text with a layered fallback chain: async clipboard, then
 * legacy execCommand copy, then a manual-copy toast as a last resort. This is
 * the plain-copy half of what `useShareLink` does (it adds the native share
 * sheet on top, which only makes sense for a URL) — kept separate so a phone
 * number or email copy button doesn't pop the OS share sheet.
 */
export function useCopyToClipboard() {
  return useCallback(async (value: string, label?: string) => {
    const successMessage = label ? `${label} copied` : "Copied to clipboard";
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        toast.success(successMessage);
        return;
      }
    } catch {
      /* fall through to legacy copy */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) {
        toast.success(successMessage);
        return;
      }
    } catch {
      /* fall through to manual copy */
    }
    toast(`Copy this: ${value}`, { duration: 6000 });
  }, []);
}
