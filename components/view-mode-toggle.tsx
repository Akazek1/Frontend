"use client";
import React from "react";
import { useViewMode } from "@/context/view-mode-context";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, User } from "lucide-react";

const ViewModeToggle: React.FC = () => {
  const { viewMode, toggleViewMode } = useViewMode();
  const { isAuthenticated } = useAuth();

  // For guests the toggle is a browse filter (intent), not an identity
  // declaration — so it's labelled "Hire help" / "Find work" instead of
  // "I'm an Employer" / "I'm a Provider".
  const labels = isAuthenticated
    ? {
        employer: { title: "I'm an Employer", sub: "Hire for your needs" },
        provider: { title: "I'm a Provider", sub: "Find jobs & earn" },
      }
    : {
        employer: { title: "Hire help", sub: "Browse workers & services" },
        provider: { title: "Find work", sub: "Browse jobs near you" },
      };

  return (
    <div className="flex flex-row gap-3 w-full">
      <button
        onClick={() => viewMode !== "employer" && toggleViewMode()}
        className={`flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl transition-all duration-200 ${
          viewMode === "employer"
            ? "bg-brand text-white shadow-md"
            : "bg-white text-ink border border-gray-200 shadow-sm"
        }`}
      >
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${viewMode === "employer" ? "bg-white/20" : "bg-gray-100"}`}>
          <Briefcase className={`w-4 h-4 ${viewMode === "employer" ? "text-white" : "text-brand"}`} />
        </div>
        <div className="flex flex-col items-start min-w-0">
          <span className="text-xs sm:text-sm font-semibold leading-tight">{labels.employer.title}</span>
          <span className={`text-[10px] sm:text-[11px] leading-tight ${viewMode === "employer" ? "text-white/70" : "text-gray-400"}`}>
            {labels.employer.sub}
          </span>
        </div>
      </button>

      <button
        onClick={() => viewMode !== "provider" && toggleViewMode()}
        className={`flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl transition-all duration-200 ${
          viewMode === "provider"
            ? "bg-brand text-white shadow-md"
            : "bg-white text-ink border border-gray-200 shadow-sm"
        }`}
      >
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${viewMode === "provider" ? "bg-white/20" : "bg-gray-100"}`}>
          <User className={`w-4 h-4 ${viewMode === "provider" ? "text-white" : "text-brand"}`} />
        </div>
        <div className="flex flex-col items-start min-w-0">
          <span className="text-xs sm:text-sm font-semibold leading-tight">{labels.provider.title}</span>
          <span className={`text-[10px] sm:text-[11px] leading-tight ${viewMode === "provider" ? "text-white/70" : "text-gray-400"}`}>
            {labels.provider.sub}
          </span>
        </div>
      </button>
    </div>
  );
};

export default ViewModeToggle;
