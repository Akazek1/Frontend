"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Copy, MessageCircle, Phone } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/** Used until the admin-set number loads (and if that request fails). */
const FALLBACK_PHONE = "+250789737838";
const LONG_PRESS_MS = 500;

/** "+250789737838" → "+250 789 737 838" (other lengths are shown as stored). */
function formatPhone(phone: string) {
  const m = phone.match(/^\+(\d{3})(\d{3})(\d{3})(\d{3})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}

/**
 * "Trouble signing in? Call or WhatsApp us on …" — for GUESTS only: it exists
 * to rescue people who cannot get into the app, so signed-in users (who have
 * the in-app support chat) never see it. Tap the number for call / WhatsApp /
 * copy; press and hold to copy straight away. The number is set in the admin
 * panel (Support settings).
 */
export function GuestContactLine({ className }: { className?: string }) {
  const t = useTranslations("guestContact");
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const { data } = useQuery({
    queryKey: ["support-contact"],
    queryFn: async () => {
      const res = await api.get("/support/contact");
      return ((res.data?.data ?? res.data) as { phone: string }).phone;
    },
    enabled: !isAuthenticated,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  if (isAuthenticated) return null;

  const phone = data || FALLBACK_PHONE;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const startPress = () => {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      void copy();
    }, LONG_PRESS_MS);
  };
  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const actionClass =
    "inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-white px-3 py-1.5 text-[12px] font-semibold text-brand transition-colors hover:bg-brand/5";

  return (
    <div className={cn("text-center text-[13px] leading-5 text-gray-500", className)}>
      <p>
        {t("prompt")}{" "}
        <button
          type="button"
          aria-expanded={open}
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onPointerCancel={endPress}
          // The long-press already copied; stop the OS text-selection menu.
          onContextMenu={(e) => e.preventDefault()}
          onClick={() => {
            if (longPressed.current) return;
            setOpen((v) => !v);
          }}
          className="select-none whitespace-nowrap font-bold text-brand underline underline-offset-2 [-webkit-touch-callout:none]"
        >
          {formatPhone(phone)}
        </button>
      </p>
      {open && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <a href={`tel:${phone}`} className={actionClass}>
            <Phone className="h-3.5 w-3.5" />
            {t("call")}
          </a>
          <a
            href={`https://wa.me/${phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={actionClass}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {t("whatsapp")}
          </a>
          <button type="button" onClick={copy} className={actionClass}>
            <Copy className="h-3.5 w-3.5" />
            {t("copy")}
          </button>
        </div>
      )}
    </div>
  );
}
