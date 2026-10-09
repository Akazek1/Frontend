"use client";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { getApiErrorMessage } from "@/lib/error-handler";

interface ReportModalProps {
  targetId: string;
  targetName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

// Values are sent to the API; labels live under reportModal.reasons.<value>.
const REPORT_REASONS = [
  "harassment",
  "fraud",
  "inappropriate_content",
  "unprofessional",
  "safety_concern",
  "other",
] as const;

const DESCRIPTION_MAX_LENGTH = 500;

export const ReportModal: React.FC<ReportModalProps> = ({
  targetId,
  targetName,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations("reportModal");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error(t("reasonRequired"));
      return;
    }

    if (!description.trim()) {
      toast.error(t("detailsRequired"));
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

      toast.success(t("success"));
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("failed")));
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
          <h2 className="text-xl font-bold text-gray-900">{t("title", { name: targetName ?? "" })}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label={t("close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          {t("intro")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("reasonLabel")}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("reasonPlaceholder")}</option>
              {REPORT_REASONS.map((value) => (
                <option key={value} value={value}>
                  {t(`reasons.${value}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Description Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("detailsLabel")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("detailsPlaceholder")}
              maxLength={DESCRIPTION_MAX_LENGTH}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("charCount", { count: description.length, max: DESCRIPTION_MAX_LENGTH })}
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>{t("noteLabel")}</strong> {t("noteBody")}
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
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
