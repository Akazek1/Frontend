"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentUploadStep } from "@/components/onboarding/DocumentUploadStep";

interface IdUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired after a successful upload so callers can refresh ID status. */
  onUploaded?: () => void;
}

/**
 * Reusable modal wrapper around the identity-document upload flow. Centralises
 * the upload UI (with built-in image compression) so the More page, the service
 * gate, and registration all share one implementation instead of duplicating it.
 */
export default function IdUploadDialog({ open, onOpenChange, onUploaded }: IdUploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Upload your ID</DialogTitle>
        </DialogHeader>
        <DocumentUploadStep
          onCancel={() => onOpenChange(false)}
          onUploadSuccess={() => {
            onUploaded?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
