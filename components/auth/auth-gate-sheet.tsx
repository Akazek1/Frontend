"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { useAuthGate } from "@/context/auth-gate-context";
import {
  AppButton,
  SheetBody,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPanel,
} from "@/components/ui/app-primitives";

const INTENT_MESSAGES: Record<string, string> = {
  report: "Sign in to report this",
  bookmark: "Sign in to save this",
  hire: "Sign in to hire",
  apply: "Sign in to apply for this job",
  "post-job": "Sign in to post a job",
  message: "Sign in to send a message",
};

export function AuthGateSheet() {
  const { isOpen, intent, redirectUrl, closeAuthGate } = useAuthGate();
  const pathname = usePathname();
  const router = useRouter();

  if (!isOpen) return null;

  const redirectParam = encodeURIComponent(redirectUrl ?? pathname);
  const message = (intent && INTENT_MESSAGES[intent]) || "Sign in to continue";

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

      <SheetPanel>
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />
        <SheetHeader title={message} onClose={closeAuthGate} className="border-b-0 pt-0" />

        <SheetBody className="pt-0">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF8EA] text-[#145B10]">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <p className="text-[14px] leading-5 text-gray-500">
            You need an account to do this. It only takes a minute.
          </p>
        </SheetBody>

        <SheetFooter className="space-y-3 border-t-0 pt-0">
          <AppButton
            type="button"
            onClick={handleLogin}
            className="w-full"
          >
            Log in
          </AppButton>
          <AppButton
            type="button"
            onClick={handleSignup}
            appVariant="secondary"
            className="w-full"
          >
            Create account
          </AppButton>
          <button
            type="button"
            onClick={closeAuthGate}
            className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600"
          >
            Maybe later
          </button>
        </SheetFooter>
      </SheetPanel>
    </>
  );
}
