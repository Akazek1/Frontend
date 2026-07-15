"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  ChevronRight,
  HelpingHand,
  AlertTriangle,
  Bell,
  MessageSquare,
  ShieldX,
  LogOut,
  User,
  Bookmark,
  Lock,
  Building2,
} from "lucide-react";
import { Separator } from "../ui/separator";
import Image from "next/image";
import { logout } from "@/store/slices/auth-slice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { useRouter } from "next/navigation";
import ProfileImageUploader from "./profile-img-uloader";
import { persistor } from "@/store";
import { colors } from "@/constant/colors";
import { HuzaLogo } from "@/components/brand/huza-logo";
import { useAuth } from "@/hooks/useAuth";

type MenuItem = {
  name: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  href: string;
};

const MenuSection = ({ title, items }: { title: string; items: MenuItem[] }) => (
  <section className="space-y-1.5">
    <h3 className="px-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: colors.textMuted }}>
      {title}
    </h3>
    <div className="overflow-hidden rounded-lg bg-white shadow-[0_4px_12px_rgba(20,91,16,0.04)]" style={{ borderColor: colors.border }}>
      {items.map(({ name, description, Icon, href }) => (
        <Link
          key={name}
          href={href}
          className="group flex min-h-[56px] items-center justify-between gap-2 px-3 py-2.5 transition-colors last:border-b-0"
          style={{
            borderBottom: `1px solid ${colors.backgroundTertiary}`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.backgroundSecondary)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors"
              style={{
                backgroundColor: colors.backgroundTertiary,
                color: colors.primaryHover,
              }}
            >
              <Icon className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold leading-4" style={{ color: colors.text }}>
                {name}
              </span>
              <span className="mt-0.5 block text-xs leading-3" style={{ color: colors.borderMuted }}>
                {description}
              </span>
            </span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: colors.borderSecondary }} />
        </Link>
      ))}
    </div>
  </section>
);

const ProfileScreen = () => {
  const t = useTranslations("profileScreen");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const isWorker = Boolean(user?.isProvider);

  const mainActions = [
    { name: t("editProfile"), description: t("editProfileDesc"), Icon: User, href: "/profile" },
    { name: t("myServices"), description: t("myServicesDesc"), Icon: Briefcase, href: "/more/services" },
    // Agency inquiry flow — workers see hand-over offers, others see inquiries they sent.
    isWorker
      ? { name: t("placementOffers"), description: t("placementOffersDesc"), Icon: Building2, href: "/inquiries" }
      : { name: t("agencyInquiries"), description: t("agencyInquiriesDesc"), Icon: Building2, href: "/inquiries" },
    { name: t("savedProfiles"), description: t("savedProfilesDesc"), Icon: Bookmark, href: "/more/saved" },
    { name: t("notifications"), description: t("notificationsDesc"), Icon: Bell, href: "/more/notifications" },
  ];

  const supportItems = [
    { name: t("helpAndSupport"), description: t("helpAndSupportDesc"), Icon: HelpingHand, href: "/more/help" },
    { name: t("reportAnIssue"), description: t("reportAnIssueDesc"), Icon: AlertTriangle, href: "/more/report" },
    { name: t("shareFeedback"), description: t("shareFeedbackDesc"), Icon: MessageSquare, href: "/more/feedback" },
  ];

  const legalItems = [
    { name: t("privacyPolicy"), description: t("privacyPolicyDesc"), Icon: Lock, href: "/privacy" },
    { name: t("termsConditions"), description: t("termsConditionsDesc"), Icon: ShieldX, href: "/terms" },
  ];

  const handleLogout = async () => {
    await dispatch(logout());
    await persistor.purge();
    window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: null }));
    router.replace("/");
  };

  // Return null while loading
  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-3 sm:px-6" style={{ backgroundColor: colors.background }}>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold leading-[120%]" style={{ color: colors.text }}>
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm">
            <HuzaLogo variant="mark" markClassName="h-5 w-5" />
          </span>
          {t("more")}
        </h1>
      </div>

      <div className="mb-3 rounded-lg bg-white px-3 py-3 shadow-[0_4px_12px_rgba(20,91,16,0.04)]" style={{ borderColor: colors.border }}>
        <div className="scale-90 origin-top">
          <ProfileImageUploader />
        </div>
        <Separator className="my-2" style={{ backgroundColor: colors.backgroundTertiary }} />
        <div className="rounded-md p-2" style={{ backgroundColor: colors.backgroundSecondary }}>
          <div>
            <p className="text-[11px] font-semibold leading-3" style={{ color: colors.text }}>
              {t("keepProfileCurrent")}
            </p>
            <p className="mt-0.5 text-[10px] leading-2.5" style={{ color: colors.borderMuted }}>
              {t("keepProfileCurrentDesc")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3.5">
        <MenuSection title={t("account")} items={mainActions} />
        <MenuSection title={t("support")} items={supportItems} />
        <MenuSection title={t("legal")} items={legalItems} />

        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-lg border border-red-100 bg-white px-4 py-2.5 text-sm font-semibold text-red-500 shadow-[0_4px_12px_rgba(247,85,85,0.06)] transition-colors hover:bg-red-50 active:bg-red-100"
        >
          <LogOut className="h-4.5 w-4.5" />
          {t("logout")}
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
