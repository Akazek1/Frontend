"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  SheetOverlay,
  SheetPanel,
  SheetHeader,
  SheetBody,
  SheetFooter,
} from "@/components/ui/app-primitives";
import {
  profileImageFallback,
  shouldUnoptimizeImage,
} from "@/lib/service-display";

interface HireSheetProps {
  providerName: string;
  serviceTitle: string;
  providerPhoto?: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  /** floating = search results panel; bottom = full-width sheet */
  side?: "bottom" | "floating";
  zIndexClassName?: string;
}

export function HireSheet({
  providerName,
  serviceTitle,
  providerPhoto,
  submitting = false,
  onClose,
  onSubmit,
  side = "bottom",
  zIndexClassName,
}: HireSheetProps) {
  const t = useTranslations("serviceDetail");
  const tShared = useTranslations("serviceDetailShared");

  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const handleClose = () => {
    setMessage("");
    setError(false);
    onClose();
  };

  const handleSend = () => {
    if (!message.trim()) {
      setError(true);
      return;
    }
    setError(false);
    onSubmit(message.trim());
  };

  const photo = providerPhoto || profileImageFallback;

  return (
    <>
      <SheetOverlay onClick={handleClose} zIndexClassName={zIndexClassName} />
      <SheetPanel side={side} onClose={handleClose} zIndexClassName={zIndexClassName}>
        <SheetHeader
          title={providerName}
          subtitle={serviceTitle}
          onClose={handleClose}
          leading={
            <p className="text-[11px] font-semibold text-brand uppercase tracking-wider">
              {tShared("requestToHire")}
            </p>
          }
        />
        <SheetBody>
          {/* Provider identity card — makes it unmistakable the user is hiring a provider */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              <Image
                src={photo}
                alt={providerName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                unoptimized={shouldUnoptimizeImage(photo)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = profileImageFallback;
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink truncate">{providerName}</p>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[11px] font-semibold">
                {t("serviceProviderBadge")}
              </span>
            </div>
          </div>

          <label className="text-[12px] font-semibold text-ink block mb-1.5">
            {t("messageRequired")}
          </label>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (e.target.value.trim()) setError(false);
            }}
            placeholder={t("hireMessagePlaceholder")}
            rows={3}
            className={`w-full rounded-2xl border px-4 py-3 text-[13px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 resize-none transition-colors ${
              error
                ? "border-red-400 focus:ring-red-200"
                : "border-gray-200 focus:ring-brand/30"
            }`}
          />
          {error && (
            <div className="mt-2 space-y-1">
              <p className="text-[12px] text-red-500 font-medium">
                {t("messageRequiredError")}
              </p>
              <p className="text-[11px] text-gray-400">{t("messageExamples")}</p>
            </div>
          )}
        </SheetBody>
        <SheetFooter>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 h-12 rounded-[18px] border-2 border-gray-100 text-gray-500 font-bold text-[13px] hover:bg-gray-50 transition-all"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSend}
              disabled={submitting}
              className="flex-1 h-12 rounded-[18px] bg-brand text-white font-bold text-[13px] hover:bg-brand-dark shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("sendRequest")
              )}
            </button>
          </div>
        </SheetFooter>
      </SheetPanel>
    </>
  );
}
