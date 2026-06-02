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

interface DeleteServiceDialogProps {
  open: boolean;
  serviceTitle?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}

export function DeleteServiceDialog({
  open,
  serviceTitle,
  onCancel,
  onConfirm,
}: DeleteServiceDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isDeleting) onCancel();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#1B2431]">Confirm Deletion</DialogTitle>
          <DialogDescription className="text-[#475467]">
            {serviceTitle ? (
              <>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[#1B2431]">
                  {serviceTitle}
                </span>
                ? This action cannot be undone.
              </>
            ) : (
              "Are you sure you want to delete this service? This action cannot be undone."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="border-[#145B10]/30 text-[#145B10] hover:bg-[#F1FCEF]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-[#FF3D00] text-white hover:bg-[#E63600]"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
