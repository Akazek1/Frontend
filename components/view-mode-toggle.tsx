"use client";
import React from "react";
import { useViewMode } from "@/context/view-mode-context";
import { Briefcase, User } from "lucide-react";

const ViewModeToggle: React.FC = () => {
  const { viewMode, toggleViewMode } = useViewMode();

  return (
    <div className="flex gap-3 w-full">
      <button
        onClick={() => viewMode !== "employer" && toggleViewMode()}
        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          viewMode === "employer"
            ? "bg-[#145B10] text-white shadow-md"
            : "bg-white text-[#1B2431] border border-gray-200 shadow-sm"
        }`}
      >
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${viewMode === "employer" ? "bg-white/20" : "bg-gray-100"}`}>
          <Briefcase className={`w-4 h-4 ${viewMode === "employer" ? "text-white" : "text-[#145B10]"}`} />
        </div>
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-semibold leading-tight whitespace-nowrap">I'm an Employer</span>
          <span className={`text-[11px] leading-tight whitespace-nowrap ${viewMode === "employer" ? "text-white/70" : "text-gray-400"}`}>
            Hire for your needs
          </span>
        </div>
      </button>

      <button
        onClick={() => viewMode !== "provider" && toggleViewMode()}
        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          viewMode === "provider"
            ? "bg-[#145B10] text-white shadow-md"
            : "bg-white text-[#1B2431] border border-gray-200 shadow-sm"
        }`}
      >
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${viewMode === "provider" ? "bg-white/20" : "bg-gray-100"}`}>
          <User className={`w-4 h-4 ${viewMode === "provider" ? "text-white" : "text-[#145B10]"}`} />
        </div>
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-semibold leading-tight whitespace-nowrap">I'm a Provider</span>
          <span className={`text-[11px] leading-tight whitespace-nowrap ${viewMode === "provider" ? "text-white/70" : "text-gray-400"}`}>
            Find jobs & earn
          </span>
        </div>
      </button>
    </div>
  );
};

export default ViewModeToggle;
