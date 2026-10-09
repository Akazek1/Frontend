"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-primitives";

interface DeactivateServiceDialogProps {
  open: boolean;
  serviceTitle?: string;
  /**
   * The current isActive state of the service in question. Determines
   * whether this dialog is asking to deactivate (true → false) or
   * reactivate (false → true).
   */
  isActive: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}

/**
 * Confirms a deactivation or reactivation of a service card.
 *
 * We intentionally do not expose a hard-delete affordance to owners.
 * Reviews and booking history stay attached to the card across the
 * deactivate/reactivate cycle, preventing review-laundering by
 * deleting-and-recreating.
 */
export function DeactivateServiceDialog({
  open,
  serviceTitle,
  isActive,
  onCancel,
  onConfirm,
}: DeactivateServiceDialogProps) {
  const t = useTranslations("deactivateService");
  const [isWorking, setIsWorking] = useState(false);

  const handleConfirm = async () => {
    if (isWorking) return;
    try {
      setIsWorking(true);
      await onConfirm();
    } finally {
      setIsWorking(false);
    }
  };

  const isDeactivating = isActive;
  const title = isDeactivating ? t("deactivateTitle") : t("reactivateTitle");
  const body = isDeactivating
    ? t("deactivateBody")
    : t("reactivateBody");
  const ctaLabel = isDeactivating ? t("deactivate") : t("activate");
  const workingLabel = isDeactivating ? t("deactivating") : t("activating");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isWorking) onCancel();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-ink">{title}</DialogTitle>
          <DialogDescription className="text-ink-muted">
            {serviceTitle ? (
              <>
                <span className="font-semibold text-ink">
                  {serviceTitle}
                </span>
                . {body}
              </>
            ) : (
              body
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <AppButton
            type="button"
            appVariant="secondary"
            onClick={onCancel}
            disabled={isWorking}
          >
            {t("cancel")}
          </AppButton>
          <AppButton
            type="button"
            onClick={handleConfirm}
            disabled={isWorking}
            appVariant={isDeactivating ? "danger" : "primary"}
          >
            {isWorking ? workingLabel : ctaLabel}
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
