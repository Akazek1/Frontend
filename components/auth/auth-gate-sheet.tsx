"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthGate } from "@/context/auth-gate-context";
import { GuestContactLine } from "@/components/support/guest-contact-line";
import {
  AppButton,
  SheetBody,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPanel,
} from "@/components/ui/app-primitives";

// Intent → translation key in the "authGate" namespace.
const INTENT_KEYS: Record<string, string> = {
  report: "intentReport",
  bookmark: "intentBookmark",
  hire: "intentHire",
  apply: "intentApply",
  "post-job": "intentPostJob",
  message: "intentMessage",
  "browse-more": "intentBrowseMore",
};

export function AuthGateSheet() {
  const { isOpen, intent, redirectUrl, closeAuthGate } = useAuthGate();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("authGate");

  if (!isOpen) return null;

  const redirectParam = encodeURIComponent(redirectUrl ?? pathname);
  const message = t((intent && INTENT_KEYS[intent]) || "intentDefault");

  const handleLogin = () => {
    closeAuthGate();
    router.push(`/onboarding?step=login&redirect=${redirectParam}`);
  };

  const handleSignup = () => {
    closeAuthGate();
    router.push(`/onboarding?redirect=${redirectParam}`);
  };

  return (
    <>
      <SheetOverlay onClick={closeAuthGate} aria-hidden="true" />

      <SheetPanel onClose={closeAuthGate}>
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />
        <SheetHeader title={message} onClose={closeAuthGate} className="border-b-0 pt-0" />

        <SheetBody className="pt-0">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF8EA] text-brand">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <p className="text-[14px] leading-5 text-gray-500">
            {t("body")}
          </p>
        </SheetBody>

        <SheetFooter className="space-y-3 border-t-0 pt-0">
          <AppButton
            type="button"
            onClick={handleLogin}
            className="w-full"
          >
            {t("logIn")}
          </AppButton>
          <AppButton
            type="button"
            onClick={handleSignup}
            appVariant="secondary"
            className="w-full"
          >
            {t("createAccount")}
          </AppButton>
          <button
            type="button"
            onClick={closeAuthGate}
            className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600"
          >
            {t("maybeLater")}
          </button>
          <GuestContactLine />
        </SheetFooter>
      </SheetPanel>
    </>
  );
}
