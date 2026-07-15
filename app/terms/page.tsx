import LegalView from "@/components/legal/legal-view";
import { TermsAndConditionsData } from "@/constant";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions - Huza",
  description: "Read the terms that govern use of the Huza platform.",
  alternates: {
    canonical: "/terms",
  },
};

const TERMS_INTRO =
  "These Terms & Conditions govern your use of Huza and the services provided through our platform. By accessing and using Huza, you agree to comply with these terms. If you do not agree, please do not use our services.";

// Public, auth-free page so it is readable from the signup screen (where the
// user is not yet authenticated) as well as from the in-app More menu.
export default function TermsPage() {
  return (
    <LegalView
      type="terms"
      heading="Terms & Conditions"
      fallbackIntro={TERMS_INTRO}
      fallbackSections={TermsAndConditionsData}
    />
  );
}
