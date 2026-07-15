import LegalView from "@/components/legal/legal-view";
import { PrivacyPolicyData } from "@/constant";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Huza",
  description: "Read how Huza collects, uses, and protects personal information.",
  alternates: {
    canonical: "/privacy",
  },
};

const PRIVACY_INTRO =
  "This Privacy Policy explains how Huza collects, uses, and protects your personal information when you use our platform.";

// Public, auth-free page so it is readable from the signup screen (where the
// user is not yet authenticated) as well as from the in-app More menu.
export default function PrivacyPage() {
  return (
    <LegalView
      type="privacy"
      heading="Privacy Policy"
      fallbackIntro={PRIVACY_INTRO}
      fallbackSections={PrivacyPolicyData}
    />
  );
}
