"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DEVICE_PUSH_KEY,
  isDevicePushOptedOut,
  registerFcmToken,
} from "@/services/fcm-token-service";

// "Soft ask" for push notifications. The OS permission prompt is a one-shot:
// a reflexive "Don't Allow" can only be undone deep in the phone's settings.
// So we never fire it cold — this card asks first, in our own UI, and only a
// tap on "Turn on" (a fresh user gesture, as iOS requires) triggers the real
// prompt. Dismissing the card is free: it snoozes on an escalating schedule
// (1 day after the first dismissal, then 2, 3, … capped at 7 days) — gentle
// early on, and never more than weekly for someone who keeps saying no.
const SNOOZE_KEY = "akazek-push-ask-snoozed-until";
const DISMISS_COUNT_KEY = "akazek-push-ask-dismissals";
const MAX_SNOOZE_DAYS = 7;
// The install card (PwaLifecycle) appears after 3 interactions; waiting for a
// few more keeps the two from stacking on top of each other.
const MIN_INTERACTIONS = 6;

export function EnablePushCard() {
  const { user, isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    // Only when the OS has never been asked: "granted" needs no card, and
    // "denied" can't be fixed from here (the settings page explains that).
    if (Notification.permission !== "default") return;
    if (isDevicePushOptedOut()) return;
    if (Date.now() < Number(localStorage.getItem(SNOOZE_KEY) || 0)) return;

    let interactions = 0;
    const onInteraction = () => {
      interactions += 1;
      if (interactions < MIN_INTERACTIONS) return;
      setVisible(true);
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };
    window.addEventListener("click", onInteraction, { passive: true });
    window.addEventListener("keydown", onInteraction);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const snooze = () => {
    const dismissals = Number(localStorage.getItem(DISMISS_COUNT_KEY) || 0) + 1;
    const days = Math.min(dismissals, MAX_SNOOZE_DAYS);
    localStorage.setItem(DISMISS_COUNT_KEY, String(dismissals));
    localStorage.setItem(
      SNOOZE_KEY,
      String(Date.now() + days * 24 * 60 * 60 * 1000),
    );
    setVisible(false);
  };

  const enable = async () => {
    setBusy(true);
    try {
      // Must be the first await in the tap handler — iOS only honors
      // requestPermission() while the user gesture is still "live".
      const permission = await Notification.requestPermission();
      setVisible(false);
      if (permission === "granted") {
        localStorage.setItem(DEVICE_PUSH_KEY, "on");
        const token = await registerFcmToken();
        toast[token ? "success" : "error"](
          token
            ? "Notifications are on"
            : "Couldn't finish — try again in More → Notification Settings.",
        );
      } else if (permission === "denied") {
        toast("You can turn them on anytime in More → Notification Settings.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[70] mx-auto max-w-[404px] rounded-lg border border-[#D8E7D6] bg-white p-3 shadow-[0_10px_28px_rgba(0,0,0,0.14)]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E7F2E5] text-[#145B10]">
          <Bell className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#111827]">Turn on notifications</p>
          <p className="mt-0.5 text-xs leading-5 text-[#4B5563]">
            Know the moment someone wants to hire you or replies to you.
          </p>
          <Button
            size="sm"
            disabled={busy}
            className="mt-2 h-8 bg-[#145B10] px-3 text-xs hover:bg-[#0f4a0c]"
            onClick={enable}
          >
            Turn on
          </Button>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
          aria-label="Not now"
          onClick={snooze}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
