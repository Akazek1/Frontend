"use client";

import Link from "next/link";
import { Search, Home, Briefcase, HelpCircle, ArrowRight, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { colors } from "@/constant/colors";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function NotFound() {
  const t = useTranslations("notFound");
  // A dead link can strand someone on a page whose own in-app nav might not
  // be trustworthy for whatever reason got them here — /logout is a plain,
  // self-contained route (see app/logout/page.tsx) that doesn't depend on
  // any of that, so it's a safety valve, not just a redundant link.
  const { isAuthenticated } = useAuth();
  return (
    // min-h-full, not min-h-screen: this renders inside pwa-layout's <main>,
    // which already reserves space for the fixed bottom nav via padding.
    // min-h-screen (100vh) on top of that padding is what caused the extra
    // scroll — the content was never actually taller than the screen.
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-6 text-center" style={{ backgroundColor: colors.background }}>
      {/* Explicit Error Badge */}
      <div className="mb-4 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.2em]" style={{ borderColor: colors.borderSecondary, color: colors.textMuted, backgroundColor: "white" }}>
        {t("errorBadge")}
      </div>

      {/* 404 Visual Section - Reduced size */}
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-2xl opacity-10 rounded-full scale-125" style={{ backgroundColor: colors.primary }}></div>
        <div className="relative bg-white p-6 rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.02)] border-2" style={{ borderColor: colors.border }}>
          <Search className="w-12 h-12 opacity-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: colors.primary }} />
          <div className="relative text-4xl font-black italic tracking-tighter" style={{ color: colors.primary }}>
            404
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: colors.text }}>
        {t("heading")}
      </h1>
      <p className="text-base mb-6 max-w-xs mx-auto leading-tight" style={{ color: colors.textSecondary }}>
        {t("description")}
      </p>

      <div className="flex flex-col w-full max-w-xs gap-3 mb-8 mx-auto">
        <Link href="/" className="w-full">
          <Button className="w-full py-5 text-base font-bold shadow-md shadow-[#145B1015]" style={{ backgroundColor: colors.primary }}>
            <Home className="mr-2 h-4 w-4" /> {t("backToHome")}
          </Button>
        </Link>

        {isAuthenticated && (
          <div className="pt-1">
            <p className="mb-1.5 text-xs" style={{ color: colors.textMuted }}>{t("logOutInstead")}</p>
            <Link
              href="/logout"
              className="inline-flex items-center gap-1.5 text-xs font-bold underline underline-offset-2"
              style={{ color: colors.textSecondary }}
            >
              <LogOut className="h-3.5 w-3.5" /> {t("logOut")}
            </Link>
          </div>
        )}
      </div>

      {/* "Important Info" / Quick Guide Section - More compact */}
      <div className="w-full max-w-md bg-white rounded-2xl p-5 text-left shadow-[0_4px_15px_rgba(20,91,16,0.04)] border" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
            {t("quickGuide")}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: colors.backgroundTertiary }}>
              <Briefcase className="w-4 h-4" style={{ color: colors.primary }} />
            </div>
            <div>
              <p className="font-bold text-sm leading-none mb-0.5" style={{ color: colors.text }}>{t("verifiedProfessionals")}</p>
              <p className="text-[10px] leading-tight opacity-80" style={{ color: colors.textSecondary }}>{t("verifiedProfessionalsDesc")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: colors.backgroundTertiary }}>
              <Search className="w-4 h-4" style={{ color: colors.primary }} />
            </div>
            <div>
              <p className="font-bold text-sm leading-none mb-0.5" style={{ color: colors.text }}>{t("simpleBooking")}</p>
              <p className="text-[10px] leading-tight opacity-80" style={{ color: colors.textSecondary }}>{t("simpleBookingDesc")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: colors.backgroundTertiary }}>
              <HelpCircle className="w-4 h-4" style={{ color: colors.primary }} />
            </div>
            <div>
              <p className="font-bold text-sm leading-none mb-0.5" style={{ color: colors.text }}>{t("supportCenter")}</p>
              <p className="text-[10px] leading-tight opacity-80" style={{ color: colors.textSecondary }}>{t("supportCenterDesc")}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t" style={{ borderColor: colors.border }}>
          <Link href="/more/help" className="flex items-center justify-center text-xs font-black group" style={{ color: colors.primary }}>
            {t("visitHelpCenter")}
            <ArrowRight className="ml-1.5 w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
