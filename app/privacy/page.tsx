import LegalView from "@/components/legal/legal-view";
import { PrivacyPolicyData } from "@/constant";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Huza.app",
  description: "Read how Huza.app collects, uses, and protects personal information.",
  alternates: {
    canonical: "/privacy",
  },
};

const PRIVACY_INTRO =
  "This Privacy Policy explains how Huza.app LTD, the data controller, collects, uses, shares, and protects your personal data when you use Huza.app, in line with Rwanda's Law No. 058/2021 on the protection of personal data and privacy. It covers what is shown publicly on the marketplace, what is shared between users to complete a booking, how reviews work, how app screenshots and videos may be used on social media, and the record we keep after a ban to prevent re-registration.";

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
