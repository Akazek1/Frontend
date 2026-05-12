"use client";
import React, { useEffect } from "react";
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
} from "lucide-react";
import { Icons } from "../icons";
import { Separator } from "../ui/separator";
import Image from "next/image";
import { logout } from "@/store/slices/auth-slice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { useRouter } from "next/navigation";
import ProfileImageUploader from "./profile-img-uloader";
import { persistor } from "@/store";
import authService from "@/services/auth-service";

type MenuItem = {
  name: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  href: string;
};

const MenuSection = ({ title, items }: { title: string; items: MenuItem[] }) => (
  <section className="space-y-2">
    <h3 className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5F7C5B]">
      {title}
    </h3>
    <div className="overflow-hidden rounded-lg border border-[#DDEED9] bg-white shadow-[0_10px_24px_rgba(20,91,16,0.06)]">
      {items.map(({ name, description, Icon, href }) => (
        <Link
          key={name}
          href={href}
          className="group flex min-h-[72px] items-center justify-between gap-3 border-b border-[#EEF5EC] px-4 py-3 transition-colors last:border-b-0 hover:bg-[#F7FCF5] active:bg-[#EEF8EA]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#EEF8EA] text-[#145B10] transition-colors group-hover:bg-[#E1F2DD]">
              <Icon className="h-5 w-5 stroke-current" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold leading-5 text-[#1B2431]">
                {name}
              </span>
              <span className="mt-0.5 block text-xs leading-4 text-[#6B7668]">
                {description}
              </span>
            </span>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#9AAD96] transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  </section>
);

const ProfileScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const mainActions = [
    { name: "Edit Profile", description: "Update your personal details", Icon: Icons.UserIcon, href: "/profile/edit" },
    { name: "Set Up Services", description: "Manage services and availability", Icon: Briefcase, href: "/profile/get-hired" },
    { name: "Saved Profiles", description: "View providers you bookmarked", Icon: Icons.BookMarkIcon, href: "/profile/bookmark" },
    { name: "Notifications", description: "Control alerts and reminders", Icon: Bell, href: "/profile/notifications" },
  ];

  const supportItems = [
    { name: "Help & Support", description: "Get answers or contact support", Icon: HelpingHand, href: "/profile/help-&-support" },
    { name: "Report an Issue", description: "Tell us what needs attention", Icon: AlertTriangle, href: "/profile/report-issue" },
    { name: "Share Feedback", description: "Help improve Akazek", Icon: MessageSquare, href: "/profile/feedback" },
  ];

  const legalItems = [
    { name: "Privacy Policy", description: "How your information is handled", Icon: Icons.LockIcon, href: "/profile/privacy-policy" },
    { name: "Terms & Conditions", description: "Service rules and responsibilities", Icon: ShieldX, href: "/profile/terms-&-conditions" },
  ];

  const handleLogout = async () => {
    dispatch(logout());
    await persistor.purge();
    authService.logout();
    window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: null }));
    router.push("/onboarding");
  };

  // Redirect to onboarding if not authenticated - use useEffect to avoid render-time side effects
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/onboarding");
    }
  }, [isAuthenticated, user, router]);

  // Return null while redirecting
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F1FCEF] px-4 pb-24 pt-4 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-2xl font-bold leading-[120%] text-[#1B2431]">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white shadow-sm">
            <Image src={"/images/hwa-green-icon.png"} width={20} height={20} alt="Akazek" />
          </span>
          More
        </h1>
      </div>

      <div className="mb-5 rounded-lg border border-[#DDEED9] bg-white px-4 py-5 shadow-[0_12px_28px_rgba(20,91,16,0.08)]">
        <ProfileImageUploader />
        <Separator className="my-4 bg-[#EAF3E7]" />
        <div className="flex items-start gap-3 rounded-md bg-[#F7FCF5] p-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#E7F4E3] text-[#145B10]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-5 text-[#1B2431]">
              Keep your profile current
            </p>
            <p className="mt-0.5 text-xs leading-4 text-[#6B7668]">
              A complete profile helps build trust before bookings.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <MenuSection title="Account" items={mainActions} />
        <MenuSection title="Support" items={supportItems} />
        <MenuSection title="Legal" items={legalItems} />

        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-lg border border-red-100 bg-white px-4 py-3 text-base font-semibold text-red-500 shadow-[0_10px_24px_rgba(247,85,85,0.08)] transition-colors hover:bg-red-50 active:bg-red-100"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
