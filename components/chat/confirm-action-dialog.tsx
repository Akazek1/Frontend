"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-primitives";
import { Loader2 } from "lucide-react";

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  /** What the action does, in plain words. */
  body: string;
  /** Extra consequences, shown as a short list under the body. */
  points?: string[];
  confirmLabel: string;
  /** The "don't do it" button. Named for what it keeps, never a bare "Cancel"
   *  (ambiguous when the action being confirmed is itself a cancellation). */
  dismissLabel: string;
  tone?: "primary" | "danger";
  isWorking?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * Explicit confirmation for booking actions that can't be reversed (accepting
 * an offer, completing or cancelling a job), so a stray tap never commits one.
 */
export function ConfirmActionDialog({
  open,
  title,
  body,
  points,
  confirmLabel,
  dismissLabel,
  tone = "primary",
  isWorking = false,
  onConfirm,
  onDismiss,
}: ConfirmActionDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isWorking) onDismiss();
      }}
    >
      <DialogContent className="w-[90vw] max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-ink">{title}</DialogTitle>
          <DialogDescription className="text-ink-muted">{body}</DialogDescription>
        </DialogHeader>
        {points && points.length > 0 && (
          <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-snug text-ink">
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        )}
        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <AppButton
            type="button"
            appVariant="secondary"
            onClick={onDismiss}
            disabled={isWorking}
            className="flex-1"
          >
            {dismissLabel}
          </AppButton>
          <AppButton
            type="button"
            appVariant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={isWorking}
            className="flex-1"
          >
            {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
