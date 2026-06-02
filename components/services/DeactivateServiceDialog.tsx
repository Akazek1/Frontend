"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const title = isDeactivating ? "Deactivate service" : "Reactivate service";
  const body = isDeactivating
    ? "Your card will be hidden from the marketplace until you turn it back on. Your reviews and booking history stay attached — you can reactivate from this page at any time."
    : "Your card will be visible to employers again. Existing reviews and booking history are restored along with it.";
  const ctaLabel = isDeactivating ? "Deactivate" : "Activate";
  const workingLabel = isDeactivating ? "Deactivating…" : "Activating…";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isWorking) onCancel();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#1B2431]">{title}</DialogTitle>
          <DialogDescription className="text-[#475467]">
            {serviceTitle ? (
              <>
                <span className="font-semibold text-[#1B2431]">
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
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isWorking}
            className="border-[#145B10]/30 text-[#145B10] hover:bg-[#F1FCEF]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isWorking}
            className={
              isDeactivating
                ? "bg-[#FF3D00] text-white hover:bg-[#E63600]"
                : "bg-[#145B10] text-white hover:bg-[#0F4D0C]"
            }
          >
            {isWorking ? workingLabel : ctaLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
