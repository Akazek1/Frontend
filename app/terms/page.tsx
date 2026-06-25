import LegalView from "@/components/legal/legal-view";
import { TermsAndConditionsData } from "@/constant";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions - Akazek",
  description: "Read the terms that govern use of the Akazek platform.",
  alternates: {
    canonical: "/terms",
  },
};

const TERMS_INTRO =
  "These Terms & Conditions govern your use of Akazek and the services provided through our platform. By accessing and using Akazek, you agree to comply with these terms. If you do not agree, please do not use our services.";

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
