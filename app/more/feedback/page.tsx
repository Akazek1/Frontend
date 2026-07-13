"use client";

import React, { useState } from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Loader2 } from "lucide-react";
import { Inter } from "next/font/google";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import {
  AppButton,
  FormField,
  PageShell,
  appContentClass,
  appTextareaClass,
} from "@/components/ui/app-primitives";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/error-handler";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const Feedback = () => {
  const t = useTranslations("feedback");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handle textarea change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error(t("pleaseWriteMessage"));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        message: message.trim() || undefined,
      };

      await api.post("/feedback", payload);
      toast.success(t("thanksForFeedback"));
      setMessage("");
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast.error(getApiErrorMessage(err, t("failedToSubmit")));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell className={cn("gap-5", inter.className)}>
      {/* Header */}
      <BackButtonHeader text={t("shareFeedback")} />
      <div className={cn(appContentClass, "cursor-pointer gap-5")}>
        <h1 className="text-ink text-xl font-medium leading-6 pr-6">
          {t("tellUsWhatToImprove")}
        </h1>
        <FormField label={t("feedbackLabel")} className="space-y-2">
          <Textarea
            className={cn(appTextareaClass, "min-h-[140px]")}
            placeholder={t("feedbackPlaceholder")}
            rows={6}
            value={message}
            onChange={handleMessageChange}
          />
        </FormField>
        <AppButton
          onClick={handleSubmit}
          className="w-full font-urbanist text-base"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            t("submit")
          )}
        </AppButton>
      </div>
    </PageShell>
  );
};

export default Feedback;
