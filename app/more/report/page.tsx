"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import BackButtonHeader from "@/components/header/back-button-header";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import {
  PageShell,
  AppButton,
  FormField,
  appContentClass,
  appInputClass,
  appTextareaClass,
} from "@/components/ui/app-primitives";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/error-handler";

interface FormData {
  category: string;
  description: string;
}

const ReportIssue = () => {
  const [formData, setFormData] = useState<FormData>({
    category: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categories = [
    { value: "safety-concern", label: "Safety concern" },
    { value: "inappropriate-behavior", label: "Inappropriate behavior" },
    { value: "contract-dispute", label: "Contract dispute" },
    { value: "technical-issue", label: "Technical issue" },
    { value: "other", label: "Other" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
    setErrors((prev) => ({ ...prev, category: "" }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.category) {
      newErrors.category = "Please select an issue category";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Please describe the issue";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/issues/report", {
        category: formData.category,
        description: formData.description,
      });

      setIsSubmitted(true);
      toast.success("Issue reported successfully. Thank you for helping us improve!");

      setTimeout(() => {
        window.history.back();
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = getApiErrorMessage(err, "Failed to report issue");
      console.error("Error reporting issue:", err);
      setErrors({ form: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center space-y-6 app-bg px-4 py-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#145B10] flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#145B10]">Thank you!</h2>
          <p className="text-[#757575] text-base">
            Your issue has been reported and our team will review it shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageShell className="gap-5">
      <BackButtonHeader text="Report an Issue" backHref="/more" />

      <form onSubmit={handleSubmit} className={cn(appContentClass, "gap-5")}>
        {/* Category */}
        <FormField label="Issue Category" required error={errors.category}>
          <Select value={formData.category} onValueChange={handleSelectChange}>
            <SelectTrigger
              className={cn(appInputClass, errors.category && "border-red-500")}
            >
              <SelectValue placeholder="Select issue category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {/* Description */}
        <FormField label="Description" required error={errors.description}>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={cn(appTextareaClass, "h-32", errors.description && "border-red-500")}
            placeholder="Please describe the issue in detail, including what happened and when"
          />
        </FormField>

        {errors.form && <p className="rounded-xl bg-red-50 p-3 text-[12px] font-semibold text-red-500">{errors.form}</p>}

        {/* Submit Button */}
        <div className="flex flex-col gap-2 pt-4">
          <AppButton
            size="lg"
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </AppButton>
          <AppButton
            size="lg"
            type="button"
            appVariant="secondary"
            className="w-full"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            Cancel
          </AppButton>
        </div>
      </form>
    </PageShell>
  );
};

export default ReportIssue;
