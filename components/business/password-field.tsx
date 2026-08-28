"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** "new-password" for anything being set, "current-password" to sign in. */
  autoComplete?: string;
}

/**
 * Label + password input + show/hide toggle, as used on every business auth
 * screen (register, change password, reset password). Each field owns its own
 * toggle so a "confirm" box can be revealed without also exposing the one
 * above it.
 */
export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-12 w-full rounded-xl border border-gray-200 px-3.5 pr-11 text-[14px] outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
          aria-label={label}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
