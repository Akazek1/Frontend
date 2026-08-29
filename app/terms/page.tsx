import LegalView from "@/components/legal/legal-view";
import { TermsAndConditionsData } from "@/constant";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions - Huza.app",
  description: "Read the terms that govern use of the Huza.app platform.",
  alternates: {
    canonical: "/terms",
  },
};

const TERMS_INTRO =
  "These Terms & Conditions are an agreement between you and Huza.app LTD. They govern your use of Huza.app, an online marketplace that connects people who need household and personal services with people who provide them. By creating an account or using Huza.app you accept these Terms and the Privacy Policy. If you do not agree, please do not use Huza.app.";

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
