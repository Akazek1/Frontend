"use client";

import { useEffect, useRef } from "react";

export const OTP_LENGTH = 6;

interface OtpCodeInputProps {
  /** One entry per box; length must be OTP_LENGTH. */
  value: string[];
  onChange: (next: string[]) => void;
  /** Fired as soon as the last digit lands, so nobody has to press a button. */
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
  /**
   * Optional external ref to the (visually hidden) field, for callers that
   * focus it themselves — the onboarding context keeps one for its step flow.
   */
  inputRef?: (el: HTMLInputElement | null) => void;
  ariaLabel: string;
}

/**
 * The six-box verification code entry.
 *
 * One real input sits invisibly over the boxes, which are only a display: that
 * is what makes SMS autofill (`autocomplete="one-time-code"`) and paste work,
 * where six separate inputs break both. Extracted from the phone-login form so
 * every code entry in the app — user login, organization sign-up, organization
 * password reset — behaves identically.
 */
export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  autoFocus,
  inputRef,
  ariaLabel,
}: OtpCodeInputProps) {
  const localRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocus) setTimeout(() => localRef.current?.focus(), 350);
  }, [autoFocus]);

  return (
    <div className="relative flex justify-center gap-2" onClick={() => localRef.current?.focus()}>
      <input
        ref={(el) => {
          localRef.current = el;
          inputRef?.(el);
        }}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        value={value.join("")}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
          const next = Array(OTP_LENGTH).fill("");
          for (let i = 0; i < val.length; i++) next[i] = val[i];
          onChange(next);
          if (val.length === OTP_LENGTH) onComplete?.(val);
        }}
        onFocus={(e) => e.target.scrollIntoView({ behavior: "smooth", block: "center" })}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        // 16px keeps iOS Safari from zooming the page on focus.
        style={{ fontSize: "16px" }}
        aria-label={ariaLabel}
      />
      {Array.from({ length: OTP_LENGTH }).map((_, i) => {
        const isFilled = !!value[i];
        const isActive =
          i === value.findIndex((d) => !d) || (i === OTP_LENGTH - 1 && value.every((d) => d));
        return (
          <div
            key={i}
            className={`flex h-12 w-11 items-center justify-center rounded-xl border-2 text-xl font-bold transition-all ${
              isActive ? "border-brand ring-2 ring-brand/20" : isFilled ? "border-brand/50" : "border-gray-200"
            }`}
          >
            {value[i] || ""}
          </div>
        );
      })}
    </div>
  );
}
