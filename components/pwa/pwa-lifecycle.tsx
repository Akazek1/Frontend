"use client";

import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSED_INSTALL_KEY = "akazek-install-dismissed";

function isIosInstallCandidate() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIos && !isStandalone;
}

export function PwaLifecycle() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [canShowInstall, setCanShowInstall] = useState(false);

  useEffect(() => {
    setCanShowInstall(localStorage.getItem(DISMISSED_INSTALL_KEY) !== "true");
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" || !("serviceWorker" in navigator)) return;

    // Silent update strategy — no "reload?" popup:
    //  - A new SW found DURING the session just installs and waits; the user
    //    is never interrupted (the old SW keeps serving its own matching
    //    cached assets, so a stale session stays fully functional).
    //  - A SW already waiting AT LAUNCH is activated right away (SKIP_WAITING
    //    + one reload). The page has barely rendered, so this is invisible —
    //    it's the update-on-restart model native apps use.
    let refreshing = false;

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          // Only reload for THIS launch-time activation, never for workers
          // that finish installing mid-session (they wait for next launch).
          navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      })
      .catch(() => undefined);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  useEffect(() => {
    if (!canShowInstall) return;

    let interactionCount = 0;
    let readyToShow = false;

    const maybeShow = () => {
      interactionCount += 1;
      if (interactionCount < 3) return;
      readyToShow = true;
      if (installPrompt) setShowInstall(true);
      if (isIosInstallCandidate()) setShowIosHint(true);
      window.removeEventListener("click", maybeShow);
      window.removeEventListener("keydown", maybeShow);
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      if (readyToShow) setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("click", maybeShow, { passive: true });
    window.addEventListener("keydown", maybeShow);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("click", maybeShow);
      window.removeEventListener("keydown", maybeShow);
    };
  }, [canShowInstall, installPrompt]);

  const dismissInstall = () => {
    localStorage.setItem(DISMISSED_INSTALL_KEY, "true");
    setCanShowInstall(false);
    setShowInstall(false);
    setShowIosHint(false);
  };

  if (!showInstall && !showIosHint) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[70] mx-auto max-w-[404px] rounded-lg border border-[#D8E7D6] bg-white p-3 shadow-[0_10px_28px_rgba(0,0,0,0.14)]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E7F2E5] text-[#145B10]">
          {showIosHint ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#111827]">Add Akazek</p>
          <p className="mt-0.5 text-xs leading-5 text-[#4B5563]">
            {showIosHint ? "Use Share, then Add to Home Screen." : "Install it for faster access."}
          </p>
          {!showIosHint && (
            <Button
              size="sm"
              className="mt-2 h-8 bg-[#145B10] px-3 text-xs hover:bg-[#0f4a0c]"
              onClick={async () => {
                const promptEvent = installPrompt;
                setShowInstall(false);
                if (!promptEvent) return;
                await promptEvent.prompt();
                await promptEvent.userChoice.catch(() => undefined);
              }}
            >
              Install
            </Button>
          )}
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
          aria-label="Dismiss install prompt"
          onClick={dismissInstall}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
