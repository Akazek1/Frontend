"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, IdCard, Loader2, ShieldCheck } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import api from "@/lib/axios";
import ProfileImageUploader from "@/components/profile/profile-img-uloader";
import IdUploadDialog from "@/components/profile/id-upload-dialog";
import { AppButton } from "@/components/ui/app-primitives";

type IdStatus = "NONE" | "PENDING_VERIFICATION" | "APPROVED" | "REJECTED";

interface ServicePrerequisiteGateProps {
  /** Called when the user has met the prerequisites and continues. */
  onContinue: () => void;
}

/**
 * Shown before the Add-Service wizard when the provider is missing the trust
 * basics. Both a profile picture and an ID/passport (uploaded, pending or
 * approved) are required before listing. Reuses the same profile-image and ID
 * upload flows used elsewhere so behaviour and image compression stay consistent.
 */
export default function ServicePrerequisiteGate({ onContinue }: ServicePrerequisiteGateProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [idStatus, setIdStatus] = useState<IdStatus>("NONE");
  const [showIdUpload, setShowIdUpload] = useState(false);
  const [loadingId, setLoadingId] = useState(true);

  const refreshIdStatus = useCallback(async () => {
    try {
      const res = await api.get("/documents/user/my-documents");
      const docs = res.data?.data || res.data || [];
      const idDoc = Array.isArray(docs)
        ? docs.find((d: { type?: string }) =>
            ["GOVERNMENT_ID", "PASSPORT", "DRIVER_LICENSE"].includes(d.type || ""),
          )
        : null;
      setIdStatus((idDoc?.status as IdStatus) || "NONE");
    } catch {
      // Non-fatal.
    } finally {
      setLoadingId(false);
    }
  }, []);

  useEffect(() => {
    void refreshIdStatus();
  }, [refreshIdStatus]);

  const hasPhoto = Boolean(user?.profilePicture);
  const hasId = idStatus === "APPROVED" || idStatus === "PENDING_VERIFICATION";

  // Auto-skip the gate ONLY when both prerequisites are already satisfied at
  // load — decided once, after the ID status resolves. This must not fire when
  // the user adds a photo/ID during the flow (otherwise it would advance before
  // they get to add the other), so it's guarded to run a single time.
  const autoDecidedRef = useRef(false);
  useEffect(() => {
    if (loadingId || autoDecidedRef.current) return;
    autoDecidedRef.current = true;
    if (hasPhoto && hasId) onContinue();
  }, [loadingId, hasPhoto, hasId, onContinue]);

  // While the ID status is loading (or we're about to auto-skip), show a spinner
  // instead of flashing the full gate.
  if (loadingId) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-8">
      <div className="text-center">
        <h1 className="text-xl font-black text-ink">Before you list a service</h1>
        <p className="mt-1 text-sm text-ink-subtle">
          Clients hire people they can trust. Add a clear profile picture and your ID to stand out.
        </p>
      </div>

      {/* Profile picture — required */}
      <div className="rounded-2xl border border-[#E1EBDD] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-black text-ink">Profile picture</span>
          {hasPhoto ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-brand">
              <CheckCircle2 className="h-4 w-4" /> Added
            </span>
          ) : (
            <span className="rounded-md bg-[#FFF4E5] px-2 py-0.5 text-[11px] font-black text-[#C2630B]">
              Required
            </span>
          )}
        </div>
        <ProfileImageUploader />
      </div>

      {/* ID — recommended */}
      <div className="rounded-2xl border border-[#E1EBDD] bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF8EA] text-brand">
            <IdCard className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-black text-ink">Identity verification</p>
            <p className="text-[11px] text-ink-subtle">
              {idStatus === "PENDING_VERIFICATION"
                ? "Submitted — under review."
                : idStatus === "APPROVED"
                  ? "Verified."
                  : idStatus === "REJECTED"
                    ? "Previous ID was rejected. Please re-upload."
                    : "Required — add your ID or passport to list a service."}
            </p>
          </div>
          {loadingId ? (
            <Loader2 className="h-4 w-4 animate-spin text-ink-subtle" />
          ) : hasId ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-brand">
              <ShieldCheck className="h-4 w-4" /> Done
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowIdUpload(true)}
              className="rounded-md border border-[#BFD9BA] px-3 py-1.5 text-[11px] font-black text-brand hover:bg-[#EEF8EA]"
            >
              {idStatus === "REJECTED" ? "Re-upload" : "Upload ID"}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <AppButton onClick={onContinue} disabled={!hasPhoto || !hasId} className="w-full">
          {!hasPhoto
            ? "Add a profile picture to continue"
            : !hasId
              ? "Add your ID to continue"
              : "Continue to create service"}
        </AppButton>
        {hasPhoto && !hasId && (
          <p className="text-center text-[11px] text-ink-subtle">
            A verified ID or passport is required to list a service.
          </p>
        )}
      </div>

      <IdUploadDialog
        open={showIdUpload}
        onOpenChange={setShowIdUpload}
        onUploaded={() => void refreshIdStatus()}
      />
    </div>
  );
}
