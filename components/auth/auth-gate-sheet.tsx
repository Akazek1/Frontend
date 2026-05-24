"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useAuthGate } from "@/context/auth-gate-context";

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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={closeAuthGate}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[428px] rounded-t-3xl bg-white px-6 pb-10 pt-6 shadow-2xl">
        {/* Drag handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />

        {/* Close button */}
        <button
          type="button"
          onClick={closeAuthGate}
          className="absolute right-5 top-5 rounded-full p-1 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF8EA]">
          <span className="text-2xl">🔒</span>
        </div>

        {/* Message */}
        <h2 className="text-[20px] font-bold text-[#1B2431]">{message}</h2>
        <p className="mt-1.5 text-[14px] text-gray-500">
          You need an account to do this. It only takes a minute.
        </p>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleLogin}
            className="h-13 w-full rounded-2xl bg-[#145B10] py-4 text-[15px] font-bold text-white hover:bg-[#0F4D0C] transition-colors"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={handleSignup}
            className="h-13 w-full rounded-2xl border-2 border-[#145B10] py-4 text-[15px] font-bold text-[#145B10] hover:bg-[#F1FCEF] transition-colors"
          >
            Create account
          </button>
          <button
            type="button"
            onClick={closeAuthGate}
            className="py-2 text-[13px] text-gray-400 hover:text-gray-600"
          >
            Maybe later
          </button>
        </div>
      </div>
    </>
  );
}
