"use client";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/error-handler";

interface ReportModalProps {
  targetId: string;
  targetName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or Abuse" },
  { value: "fraud", label: "Fraud or Scam" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "unprofessional", label: "Unprofessional Behavior" },
  { value: "safety_concern", label: "Safety Concern" },
  { value: "other", label: "Other" },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  targetId,
  targetName,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    if (!description.trim()) {
      toast.error("Please provide details about the report");
      return;
    }

    setLoading(true);
    try {
      await api.post("/reports", {
        targetId,
        reason,
        description,
        evidence: [],
      });

      toast.success("Report submitted successfully. Our team will review it shortly.");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to submit report"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Report {targetName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Help us keep our community safe by reporting inappropriate behavior or content.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What&apos;s the reason for this report?
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a reason...</option>
              {REPORT_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Please provide details
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened and why you're reporting this..."
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length} / 500 characters
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> False reports may result in your account being suspended.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
