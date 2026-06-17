"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { colors } from "@/constant/colors";
import {
    AppButton,
    FormField,
    PageHeader,
    PageShell,
    appTextareaClass,
} from "@/components/ui/app-primitives";
import toast from "react-hot-toast";

const ISSUE_TYPES = [
    { value: "NO_SHOW", label: "Worker did not show up" },
    { value: "MISCONDUCT", label: "Misconduct or inappropriate behavior" },
    { value: "POOR_PERFORMANCE", label: "Poor performance or quality of work" },
    { value: "SAFETY_CONCERN", label: "Safety concern" },
    { value: "OTHER", label: "Other" },
] as const;

type IssueType = (typeof ISSUE_TYPES)[number]["value"];

export default function ReportIssuePage() {
    const params = useParams();
    const router = useRouter();
    const placementId = params.id as string;

    const [issueType, setIssueType] = useState<IssueType | "">("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!issueType) {
            toast.error("Please select an issue type");
            return;
        }
        if (description.trim().length < 20) {
            toast.error("Please describe the issue in at least 20 characters");
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/placements/${placementId}/report`, {
                issueType,
                description: description.trim(),
            });
            setSubmitted(true);
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Failed to submit report. Please try again."));
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <PageShell bottomNav={false} padded>
                <div className="flex flex-col items-center justify-center gap-4 pt-20 text-center">
                    <div
                        className="flex h-16 w-16 items-center justify-center rounded-full"
                        style={{ backgroundColor: colors.backgroundTertiary }}
                    >
                        <CheckCircle2 className="h-8 w-8" style={{ color: colors.primary }} />
                    </div>
                    <h2 className="text-[20px] font-black text-ink">Report Submitted</h2>
                    <p className="max-w-[280px] text-[14px] leading-relaxed text-ink-muted">
                        The agency has been notified and will follow up with you within 24 hours.
                    </p>
                    <AppButton
                        appVariant="primary"
                        className="mt-4 w-full"
                        onClick={() => router.push(`/placements/${placementId}`)}
                    >
                        Back to Placement
                    </AppButton>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell bottomNav={false} padded>
            <PageHeader
                title="Report an Issue"
                subtitle="The agency will be notified and follow up with you"
                onBack={() => router.back()}
                compact
            />

            <div className="mt-6 flex flex-col gap-5">
                {/* Issue type */}
                <FormField label="What's the issue?">
                    <div className="flex flex-col gap-2">
                        {ISSUE_TYPES.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setIssueType(value)}
                                className="flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-[14px] font-medium transition-colors"
                                style={{
                                    borderColor: issueType === value ? colors.primary : colors.border,
                                    backgroundColor: issueType === value ? colors.backgroundTertiary : "white",
                                    color: issueType === value ? colors.primary : "#374151",
                                }}
                            >
                                <div
                                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2"
                                    style={{
                                        borderColor: issueType === value ? colors.primary : "#D1D5DB",
                                        backgroundColor: issueType === value ? colors.primary : "white",
                                    }}
                                >
                                    {issueType === value && (
                                        <div className="h-2 w-2 rounded-full bg-white" />
                                    )}
                                </div>
                                {label}
                            </button>
                        ))}
                    </div>
                </FormField>

                {/* Description */}
                <FormField label="Describe the issue">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please provide details about the issue so the agency can respond appropriately..."
                        rows={5}
                        className={appTextareaClass}
                    />
                    <p className="mt-1 text-right text-[11px] text-ink-muted">
                        {description.length} / 500
                    </p>
                </FormField>

                {/* Warning note */}
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                    <p className="text-[12px] leading-snug text-amber-800">
                        This report will be sent directly to the staffing agency. For emergencies or safety concerns, please call the agency directly.
                    </p>
                </div>

                {/* Submit */}
                <AppButton
                    appVariant="primary"
                    onClick={handleSubmit}
                    disabled={submitting || !issueType || description.trim().length < 20}
                    className="mt-2"
                >
                    {submitting ? "Submitting…" : "Submit Report"}
                </AppButton>
            </div>
        </PageShell>
    );
}
