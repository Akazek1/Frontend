"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import BackButtonHeader from "@/components/header/back-button-header";
import { Check, ChevronDown, Mail, Phone, Send } from "lucide-react";
import Link from "next/link";
import {
  AppButton,
  AppSectionHeader,
  Card,
  PageShell,
  appActionCardClass,
  appContentClass,
} from "@/components/ui/app-primitives";
import { cn } from "@/lib/utils";

const FAQ_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

const HelpAndSupport = () => {
  const t = useTranslations("help");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <PageShell className="gap-5 font-urbanist">
      <BackButtonHeader text={t("headerTitle")} />

      {/* Contact Support Section */}
      <Card className="space-y-4">
        <AppSectionHeader title={t("needHelp")} />
        <p className="text-sm text-gray-600">
          {t("needHelpDesc")}
        </p>
        <div className="space-y-3 flex flex-col">
          <AppButton asChild className="w-full">
            <a href="mailto:support@huza.app">
              <Mail className="h-4 w-4" />
              {t("emailSupport")}
            </a>
          </AppButton>
          <div className="text-center text-sm text-gray-600">
            <p>support@huza.app</p>
            <p className="text-xs text-gray-500 mt-1">{t("emailResponseTime")}</p>
          </div>
        </div>

        <div className="space-y-2 border-t border-[#EDF1EC] pt-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Phone className="h-4 w-4 text-brand" />
            {t("phoneSupport")}
          </p>
          <a
            href="tel:+250788000000"
            className="text-brand font-semibold hover:underline"
          >
            +250 788 000 000
          </a>
          <p className="text-xs text-gray-500">{t("phoneAvailability")}</p>
        </div>

        <div className="space-y-2 border-t border-[#EDF1EC] pt-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Send className="h-4 w-4 text-brand" />
            {t("whatsappSupport")}
          </p>
          <a
            href="https://wa.me/250788000000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand font-semibold hover:underline inline-flex items-center gap-1"
          >
            {t("chatWithUs")}
          </a>
          <p className="text-xs text-gray-500">{t("whatsappResponseTime")}</p>
        </div>
      </Card>

      {/* FAQ Section */}
      <section className={appContentClass}>
        <AppSectionHeader title={t("faqSectionTitle")} />
        <div className="space-y-3">
          {FAQ_IDS.map((id) => (
            <Card
              variant="list"
              key={id}
              className="overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(id)}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <span className="font-semibold text-gray-900 text-sm sm:text-base">
                  {t(`faq.${id}.question`)}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${
                    expandedFAQ === id ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedFAQ === id && (
                <div className="border-t border-[#EDF1EC] bg-gray-50 px-4 py-4">
                  <p className="text-sm leading-relaxed text-gray-700">{t(`faq.${id}.answer`)}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Additional Resources */}
      <Card className="space-y-4">
        <AppSectionHeader title={t("additionalResources")} />
        <div className="space-y-3">
          <Link
            href="/more/privacy"
            className={cn(appActionCardClass, "block px-4 py-3 shadow-none")}
          >
            <p className="font-semibold text-gray-900 text-sm">{t("privacyPolicy")}</p>
            <p className="text-xs text-gray-600 mt-1">{t("privacyPolicyDesc")}</p>
          </Link>
          <Link
            href="/more/terms"
            className={cn(appActionCardClass, "block px-4 py-3 shadow-none")}
          >
            <p className="font-semibold text-gray-900 text-sm">{t("termsConditions")}</p>
            <p className="text-xs text-gray-600 mt-1">{t("termsConditionsDesc")}</p>
          </Link>
          <Link
            href="/more/feedback"
            className={cn(appActionCardClass, "block px-4 py-3 shadow-none")}
          >
            <p className="font-semibold text-gray-900 text-sm">{t("sendFeedback")}</p>
            <p className="text-xs text-gray-600 mt-1">{t("sendFeedbackDesc")}</p>
          </Link>
        </div>
      </Card>

      {/* Tips Section */}
      <Card className="space-y-4 border-[#BFD8FF] bg-[#EEF6FF]">
        <h3 className="text-base font-bold text-blue-900">
          {t("proTips")}
        </h3>
        <ul className="space-y-2 text-sm text-blue-900">
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("tip1")}</span>
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("tip2")}</span>
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("tip3")}</span>
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("tip4")}</span>
          </li>
        </ul>
      </Card>
    </PageShell>
  );
};

export default HelpAndSupport;
