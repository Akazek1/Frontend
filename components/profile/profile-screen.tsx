"use client";
import React from "react";
import Link from "next/link";
import {
  Briefcase,
  ChevronRight,
  HelpingHand,
  AlertTriangle,
  Bell,
  MessageSquare,
  ShieldX,
  LogOut,
  Sparkles,
  User,
  Bookmark,
  Lock,
} from "lucide-react";
import { Separator } from "../ui/separator";
import Image from "next/image";
import { logout } from "@/store/slices/auth-slice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { useRouter } from "next/navigation";
import ProfileImageUploader from "./profile-img-uloader";
import { persistor } from "@/store";
import authService from "@/services/auth-service";
import { colors } from "@/constant/colors";
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
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const mainActions = [
    { name: "Edit Profile", description: "Update your personal details", Icon: User, href: "/profile" },
    { name: "My Services", description: "Create and manage service cards", Icon: Briefcase, href: "/more/services" },
    { name: "Saved Profiles", description: "View providers you bookmarked", Icon: Bookmark, href: "/more/saved" },
    { name: "Notifications", description: "Control alerts and reminders", Icon: Bell, href: "/more/notifications" },
  ];

  const supportItems = [
    { name: "Help & Support", description: "Get answers or contact support", Icon: HelpingHand, href: "/more/help" },
    { name: "Report an Issue", description: "Tell us what needs attention", Icon: AlertTriangle, href: "/more/report" },
    { name: "Share Feedback", description: "Help improve Akazek", Icon: MessageSquare, href: "/more/feedback" },
  ];

  const legalItems = [
    { name: "Privacy Policy", description: "How your information is handled", Icon: Lock, href: "/more/privacy" },
    { name: "Terms & Conditions", description: "Service rules and responsibilities", Icon: ShieldX, href: "/more/terms" },
  ];

  const handleLogout = async () => {
    dispatch(logout());
    await persistor.purge();
    authService.logout();
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
            <Image src={"/images/hwa-green-icon.png"} width={18} height={18} alt="Akazek" />
          </span>
          More
        </h1>
      </div>

      <div className="mb-3 rounded-lg bg-white px-3 py-3 shadow-[0_4px_12px_rgba(20,91,16,0.04)]" style={{ borderColor: colors.border }}>
        <div className="scale-90 origin-top">
          <ProfileImageUploader />
        </div>
        <Separator className="my-2" style={{ backgroundColor: colors.backgroundTertiary }} />
        <div className="flex items-start gap-2 rounded-md p-2" style={{ backgroundColor: colors.backgroundSecondary }}>
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: colors.backgroundTertiary, color: colors.primaryHover }}>
            <Sparkles className="h-3 w-3" />
          </span>
          <div>
            <p className="text-[11px] font-semibold leading-3" style={{ color: colors.text }}>
              Keep your profile current
            </p>
            <p className="mt-0.5 text-[10px] leading-2.5" style={{ color: colors.borderMuted }}>
              A complete profile helps build trust.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3.5">
        <MenuSection title="Account" items={mainActions} />
        <MenuSection title="Support" items={supportItems} />
        <MenuSection title="Legal" items={legalItems} />

        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-lg border border-red-100 bg-white px-4 py-2.5 text-sm font-semibold text-red-500 shadow-[0_4px_12px_rgba(247,85,85,0.06)] transition-colors hover:bg-red-50 active:bg-red-100"
        >
          <LogOut className="h-4.5 w-4.5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
