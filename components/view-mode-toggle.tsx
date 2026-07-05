"use client";
import React from "react";
import { useViewMode } from "@/context/view-mode-context";
import { Briefcase, User } from "lucide-react";

const ViewModeToggle: React.FC = () => {
  const { viewMode, toggleViewMode } = useViewMode();
  const labels = {
    employer: { title: "Hire help" },
    provider: { title: "Find work" },
  };

  return (
    <div className="flex flex-row gap-3 w-full">
      <button
        onClick={() => viewMode !== "employer" && toggleViewMode()}
        className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl transition-all duration-200 ${
          viewMode === "employer"
            ? "bg-brand text-white shadow-md"
            : "bg-white text-ink border border-gray-200 shadow-sm"
        }`}
      >
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${viewMode === "employer" ? "bg-white/20" : "bg-gray-100"}`}>
          <Briefcase className={`w-4 h-4 ${viewMode === "employer" ? "text-white" : "text-brand"}`} />
        </div>
        <span className="text-xs sm:text-sm font-semibold leading-tight">{labels.employer.title}</span>
      </button>

      <button
        onClick={() => viewMode !== "provider" && toggleViewMode()}
        className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl transition-all duration-200 ${
          viewMode === "provider"
            ? "bg-brand text-white shadow-md"
            : "bg-white text-ink border border-gray-200 shadow-sm"
        }`}
      >
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${viewMode === "provider" ? "bg-white/20" : "bg-gray-100"}`}>
          <User className={`w-4 h-4 ${viewMode === "provider" ? "text-white" : "text-brand"}`} />
        </div>
        <span className="text-xs sm:text-sm font-semibold leading-tight">{labels.provider.title}</span>
      </button>
    </div>
  );
};

export default ViewModeToggle;
