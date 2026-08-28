"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AgencyConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Destructive actions (removing a worker) get the red treatment. */
  tone?: "danger" | "default";
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}

/**
 * A yes/no gate in front of an action the agency cannot undo from the console.
 *
 * Removing a worker used to fire on the first click, so a mistap ended a real
 * affiliation with no way back — the worker has to be invited and accept again.
 */
export function AgencyConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  onCancel,
  onConfirm,
}: AgencyConfirmDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !isWorking) onCancel(); }}>
      <DialogContent className="max-w-[420px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold text-ink">{title}</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-ink-muted">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isWorking}
            className="h-11 flex-1 rounded-xl border-2 border-gray-200 text-[13px] font-bold text-ink hover:bg-gray-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isWorking}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-bold text-white disabled:opacity-60",
              tone === "danger" ? "bg-[#DC2626] hover:bg-[#B91C1C]" : "bg-brand hover:bg-brand-dark",
            )}
          >
            {isWorking && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
