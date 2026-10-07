"use client";

import React, { useState } from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { useTermsGate } from "@/context/terms-gate-context";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { logout, updateUser } from "@/store/slices/auth-slice";
import {
  AppButton,
  SheetBody,
  SheetFooter,
  SheetOverlay,
  SheetPanel,
} from "@/components/ui/app-primitives";
import { TermsAndConditionsData, PrivacyPolicyData } from "@/constant";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

const TERMS_INTRO =
  "These Terms & Conditions are an agreement between you and Huza.app LTD. They govern your use of Huza.app, an online marketplace that connects people who need household and personal services with people who provide them. By creating an account or using Huza.app you accept these Terms and the Privacy Policy.";

const PRIVACY_INTRO =
  "Huza.app is operated by Huza.app LTD. This policy explains what personal data we collect, how we use it, and your rights under Rwanda's Law No. 058/2021.";

type Tab = "terms" | "privacy";

export function TermsGateSheet() {
  const { isOpen, closeTermsGate } = useTermsGate();
  const t = useTranslations("termsGate");
  const dispatch = useDispatch<AppDispatch>();
  const [tab, setTab] = useState<Tab>("terms");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedIdentity, setAgreedIdentity] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const canAccept = agreedTerms && agreedIdentity;

  const handleAccept = async () => {
    if (!canAccept) return;
    setLoading(true);
    try {
      await api.post("/auth/accept-terms", {}, { skipAuthRedirect: true });
      dispatch(updateUser({ termsAcceptedAt: new Date().toISOString() }));
      closeTermsGate();
      // Fire a cancelable event. The login flow's listener calls preventDefault()
      // to signal it will handle routing (e.g. to the PIN step). If nothing
      // cancels it, we reload so all in-flight queries retry with full access.
      const ev = new CustomEvent("huza:terms-accepted", { cancelable: true });
      const notHandled = window.dispatchEvent(ev);
      if (notHandled) window.location.reload();
    } catch {
      toast.error(t("genericError"));
    } finally {
      setLoading(false);
    }
  };

  // Declining is a full sign-out: the logout thunk revokes the refresh token
  // server-side and clears cached data, which a local-only clear would not.
  const handleDecline = async () => {
    setLoading(true);
    try {
      await dispatch(logout());
    } finally {
      window.location.href = "/";
    }
  };

  const sections = tab === "terms" ? TermsAndConditionsData : PrivacyPolicyData;
  const intro = tab === "terms" ? TERMS_INTRO : PRIVACY_INTRO;

  return (
    <SheetOverlay className="backdrop-blur-md" zIndexClassName="z-[10000]">
      <SheetPanel className="max-h-[92dvh] flex flex-col">
        <div className="border-b border-[#EDF1EC] px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">{t("title")}</span>
          </div>
          <p className="text-ink-muted text-sm mt-1">
            {t("subtitle")}
          </p>

          {/* Tab switcher */}
          <div className="flex gap-2 mt-3">
            {(["terms", "privacy"] as Tab[]).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  tab === tabKey
                    ? "bg-primary text-white"
                    : "bg-surface-secondary text-ink-muted"
                }`}
              >
                {tabKey === "terms" ? t("tabTerms") : t("tabPrivacy")}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <SheetBody className="overflow-y-auto flex-1 py-4 space-y-4">
          <p className="text-ink-muted text-sm leading-relaxed">{intro}</p>
          {sections.map((section) => (
            <div key={section.id} className="space-y-1">
              <h3 className="font-bold text-sm text-ink">
                {section.id}. {section.title}
              </h3>
              <p className="text-ink-muted text-sm leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </div>
          ))}
        </SheetBody>

        <SheetFooter className="space-y-3 pt-3 border-t border-border">
          {/* Checkboxes */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 accent-primary w-4 h-4 shrink-0"
            />
            <span className="text-sm text-ink-muted leading-snug">
              {t.rich("agree", {
                b: (chunks) => <strong className="text-ink">{chunks}</strong>,
              })}
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedIdentity}
              onChange={(e) => setAgreedIdentity(e.target.checked)}
              className="mt-0.5 accent-primary w-4 h-4 shrink-0"
            />
            <span className="text-sm text-ink-muted leading-snug">
              {t("confirmIdentity")}
            </span>
          </label>

          <AppButton
            onClick={handleAccept}
            disabled={!canAccept || loading}
            className="w-full"
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            {loading ? t("pleaseWait") : t("accept")}
          </AppButton>

          <button
            onClick={handleDecline}
            disabled={loading}
            className="w-full text-sm text-ink-muted underline py-1"
          >
            {t("decline")}
          </button>
        </SheetFooter>
      </SheetPanel>
    </SheetOverlay>
  );
}
