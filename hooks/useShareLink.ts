"use client";

import { useCallback } from "react";
import toast from "react-hot-toast";

/**
 * Shares a URL with a layered fallback chain: native OS share sheet, then
 * async clipboard, then legacy execCommand copy, then a manual-copy toast as
 * a last resort. Used everywhere a share button appears so behavior is
 * identical regardless of which page it's tapped from.
 */
export function useShareLink() {
  return useCallback(async (url: string, title?: string) => {
    // 1) Native share sheet — must be called before any `await` to keep the
    // user-activation it requires.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        // User dismissed the sheet — don't fall through.
        if ((e as { name?: string })?.name === "AbortError") return;
      }
    }
    // 2) Async clipboard (secure contexts, focused tab).
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
        return;
      }
    } catch {
      /* fall through to legacy copy */
    }
    // 3) Legacy execCommand copy (works in more contexts).
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) {
        toast.success("Link copied to clipboard");
        return;
      }
    } catch {
      /* fall through to manual copy */
    }
    // 4) Last resort — surface the link so it can be copied.
    toast(`Copy this link: ${url}`, { duration: 6000 });
  }, []);
}
