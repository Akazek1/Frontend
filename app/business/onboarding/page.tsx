"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { Building2, Clock, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/hooks/useServices";
import { PageShell } from "@/components/ui/app-primitives";
import { WizardHeader } from "@/components/services/wizard/wizard-ui";
import ProfileImageUploader from "@/components/profile/profile-img-uloader";
import { LocationStep } from "@/components/onboarding/LocationStep";
import { AddServiceWizard } from "@/components/services/AddServiceWizard";
import { colors } from "@/constant/colors";

type Step = "checking" | "bio" | "address" | "service" | "pending-verification";

// Business-profile onboarding for a SERVICE_COMPANY account — asks what a
// business actually needs (description, logo, address, a first service
// listing) instead of the individual provider questions (gender, DOB,
// education, health) that don't apply to it. Runs after /business/register
// and again on /business/login until every step is satisfied, then the
// account behaves exactly like any other provider.
export default function BusinessOnboardingPage() {
  const t = useTranslations("businessOnboarding");
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const { services, isLoading: servicesLoading } = useServices();

  const [step, setStep] = useState<Step>("checking");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [companyVerified, setCompanyVerified] = useState(false);

  const isCompany = (user as { accountType?: string })?.accountType === "COMPANY";

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !isCompany) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [companyRes, profileRes] = await Promise.all([
          api.get("/users/company-profile"),
          api.get("/users/profile"),
        ]);
        if (cancelled) return;
        const company = companyRes.data?.data || companyRes.data || {};
        const profile = profileRes.data?.data || profileRes.data || {};
        setDescription(company.description || "");
        setCompanyVerified(Boolean(company.verified));
        const addressCount = Array.isArray(profile.addresses) ? profile.addresses.length : 0;

        if (!company.description) {
          setStep("bio");
        } else if (addressCount === 0) {
          setStep("address");
        } else if (!company.verified) {
          // Listing a service requires admin verification (backend-enforced) —
          // an unverified company can't finish this step, so don't send them
          // into a wizard that will 403 on submit. They're free to browse the
          // app meanwhile; the "Add a service" flow will work once approved.
          setStep("pending-verification");
        } else {
          setStep("service");
        }
      } catch {
        if (!cancelled) setStep("bio");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, isCompany]);

  // Once services finish loading, a company that already has a listing
  // (e.g. came back here mid-flow after finishing step 3 before) can skip
  // straight through — but only once we're already on the service step, so
  // we don't jump ahead of an incomplete bio/address.
  useEffect(() => {
    if (step === "service" && !servicesLoading && services.length > 0) {
      router.replace("/");
    }
  }, [step, servicesLoading, services.length, router]);

  const saveBio = async () => {
    if (description.trim().length < 10) {
      toast.error(t("descriptionTooShort"));
      return;
    }
    setSaving(true);
    try {
      const logoUrl = (reduxUser as { profilePicture?: string | null })?.profilePicture;
      await api.patch("/users/company-profile", {
        description: description.trim(),
        ...(logoUrl ? { logoUrl } : {}),
      });
      setStep("address");
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("saveFailed")));
    } finally {
      setSaving(false);
    }
  };

  if (step === "checking") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F4F7F3]">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  if (step === "service") {
    return <AddServiceWizard finishHref="/" />;
  }

  if (step === "pending-verification") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#F4F7F3] px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF4E5]">
          <Clock className="h-8 w-8 text-[#C2630B]" />
        </div>
        <h1 className="text-[20px] font-black text-ink">{t("pendingVerificationTitle")}</h1>
        <p className="max-w-[320px] text-[13px] text-ink-subtle">{t("pendingVerificationBody")}</p>
        <button
          type="button"
          onClick={() => router.replace("/")}
          className="rounded-[100px] bg-brand px-8 py-3 text-[14px] font-bold text-white hover:bg-[#0f4a0c]"
        >
          {t("pendingVerificationCta")}
        </button>
      </div>
    );
  }

  return (
    <PageShell padded={false}>
      <WizardHeader
        title={step === "bio" ? t("bioStepTitle") : t("addressStepTitle")}
        subtitle={step === "bio" ? t("bioStepSubtitle") : t("addressStepSubtitle")}
      />

      {step === "bio" ? (
        <div className="flex flex-col gap-5 px-4 pt-2 pb-8">
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF8EA]">
              <Building2 className="h-8 w-8 text-brand" />
            </div>
            <p className="text-[13px] text-ink-subtle">{t("logoHint")}</p>
            <ProfileImageUploader />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-black text-ink">{t("descriptionLabel")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              placeholder={t("descriptionPlaceholder")}
              rows={5}
              className="w-full rounded-2xl border border-[#E1EBDD] bg-white p-3 text-[14px] text-ink outline-none focus:border-brand"
            />
            <p className="text-right text-[11px] text-ink-subtle">{description.length}/2000</p>
          </div>

          <button
            type="button"
            onClick={saveBio}
            disabled={saving || description.trim().length < 10}
            className="flex w-full items-center justify-center gap-2 rounded-[100px] bg-brand py-4 text-[15px] font-bold text-white transition disabled:opacity-60 hover:bg-[#0f4a0c]"
          >
            {saving ? t("saving") : t("continue")}
          </button>
        </div>
      ) : (
        <LocationStep onContinue={() => setStep(companyVerified ? "service" : "pending-verification")} />
      )}
    </PageShell>
  );
}
