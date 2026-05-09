"use client";
import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import { MapPin, Clock, Banknote, Loader2, Briefcase, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

interface JobPost {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  budgetMin: number | null;
  budgetMax: number | null;
  urgency: string;
  preferredDate: string | null;
  createdAt: string;
  poster: { firstName: string; lastName: string };
}

const URGENCY_STYLE: Record<string, { color: string; bg: string }> = {
  urgent:     { color: "text-red-600",    bg: "bg-red-50" },
  "this week":{ color: "text-amber-600",  bg: "bg-amber-50" },
  flexible:   { color: "text-[#145B10]",  bg: "bg-green-50" },
};

const formatBudget = (min: number | null, max: number | null) => {
  if (!min && !max) return null;
  if (min && max) return `RWF ${min.toLocaleString()} – ${max.toLocaleString()}`;
  if (min) return `From RWF ${min.toLocaleString()}`;
  return `Up to RWF ${max!.toLocaleString()}`;
};

const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const JobPostingsFeed: React.FC = () => {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setJobs([]);
    setLoading(false);
  }, []);

  const handleExpress = (jobId: string) => {
    toast.success("Interest sent! The employer will be notified.");
    // TODO: POST /custom-jobs/:id/interest when backend ready
    console.log("Express interest in job", jobId);
  };

  if (loading) return (
    <div className="flex justify-center py-10">
      <Loader2 className="w-5 h-5 animate-spin text-[#145B10]" />
    </div>
  );

  if (jobs.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-[#145B10]/10 flex items-center justify-center">
        <Briefcase className="w-7 h-7 text-[#145B10]" />
      </div>
      <p className="text-[14px] font-bold text-[#1B2431]">No job postings yet</p>
      <p className="text-[12px] text-[#616161] text-center px-8 leading-relaxed">
        Employers haven&apos;t posted any custom jobs yet. Check back soon — new opportunities appear here.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 pb-8 mt-2">
      {jobs.map((job) => {
        const urgencyStyle = URGENCY_STYLE[job.urgency?.toLowerCase()] ?? URGENCY_STYLE.flexible;
        const budget = formatBudget(job.budgetMin, job.budgetMax);

        return (
          <div
            key={job.id}
            className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden"
          >
            {/* Top: category tag + urgency + time */}
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              <span className="text-[10px] font-semibold text-[#145B10] bg-green-50 rounded-full px-2 py-0.5">
                {job.category}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${urgencyStyle.bg} ${urgencyStyle.color}`}>
                  {job.urgency}
                </span>
                <span className="text-[10px] text-gray-400">{timeAgo(job.createdAt)}</span>
              </div>
            </div>

            {/* Main content */}
            <div className="px-3 pb-3 space-y-1.5">
              <h3 className="text-[13px] font-bold text-[#1B2431] leading-snug">{job.title}</h3>
              <p className="text-[11px] text-[#616161] leading-relaxed line-clamp-2">{job.description}</p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#616161]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {job.location}
                </span>
                {job.preferredDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    {new Date(job.preferredDate).toLocaleDateString("en-RW", { day: "numeric", month: "short" })}
                  </span>
                )}
                {budget && (
                  <span className="flex items-center gap-1 text-[#145B10] font-semibold">
                    <Banknote className="w-3 h-3 flex-shrink-0" />
                    {budget}
                  </span>
                )}
              </div>

              {/* Posted by + CTA */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-gray-400">
                  Posted by {job.poster?.firstName} {job.poster?.lastName}
                </span>
                <button
                  onClick={() => handleExpress(job.id)}
                  className="flex items-center gap-1 bg-[#145B10] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#0f4a0c] transition-colors"
                >
                  Express Interest <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default JobPostingsFeed;
