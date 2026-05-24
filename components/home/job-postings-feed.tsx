"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { MapPin, Loader2, Briefcase, Zap, Star, Clock } from "lucide-react";
import toast from "react-hot-toast";
import jobsService from "@/services/jobs-service";
import type { RootState } from "@/store";
import { getCategoryIcon } from "@/constant/category-icons";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface JobPost {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  budgetMin: number | null;
  budgetMax: number | null;
  createdAt: string;
  poster: { firstName: string; lastName: string; isPrivate?: boolean };
  employerId: string;
}

const formatBudget = (min: number | null, max: number | null) => {
  if (!min && !max) return null;
  const fmt = (n: number) => `RWF ${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
};

const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const getUrgency = (id: string): "urgent" | "new" | "flexible" => {
  const n = id.charCodeAt(0) + id.charCodeAt(1);
  if (n % 3 === 0) return "urgent";
  if (n % 3 === 1) return "new";
  return "flexible";
};

const URGENCY_CONFIG = {
  urgent:   { label: "Urgent",   bg: "bg-orange-50", text: "text-orange-600", Icon: Zap },
  new:      { label: "New",      bg: "bg-blue-50",   text: "text-blue-600",   Icon: Star },
  flexible: { label: "Flexible", bg: "bg-purple-50", text: "text-purple-600", Icon: Clock },
};

const WORK_TAG_SETS = [
  ["Live-in", "Full-time"],
  ["Part-time", "Weekdays"],
  ["Live-out", "Full-time"],
  ["Flexible", "Part-time"],
];

const getWorkTags = (id: string) => WORK_TAG_SETS[id.charCodeAt(0) % WORK_TAG_SETS.length];
const getDistance  = (id: string) => ((id.charCodeAt(0) % 40) / 10 + 0.5).toFixed(1) + " km away";

const JobPostingsFeed: React.FC = () => {
  const [jobs, setJobs]                     = useState<JobPost[]>([]);
  const [loading, setLoading]               = useState(true);
  const [appliedJobIds, setAppliedJobIds]   = useState<Set<string>>(new Set());
  const [savedJobIds, setSavedJobIds]       = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying]         = useState<string | null>(null);
  const user         = useSelector((state: RootState) => state.auth.user);
  const router       = useRouter();
  const { requireAuth } = useRequireAuth();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res  = await api.get("/jobs");
        const data = res.data.data || res.data;

        if (user) {
          try {
            const myApps = await jobsService.getMyApplications();
            if (Array.isArray(myApps))
              setAppliedJobIds(new Set(myApps.map((a: any) => a.jobId)));
          } catch (e: any) {
            const status = e.response?.status
            if (status !== 401 && status !== 403) console.error(e);
          }
        }

        setJobs(
          (Array.isArray(data) ? data : []).map((j: any) => ({
            id:          j.id,
            title:       j.title,
            category:    j.category?.name || "Other",
            description: j.description,
            location:    j.address?.city || "Kigali",
            budgetMin:   j.budgetMin,
            budgetMax:   j.budgetMax,
            createdAt:   j.createdAt,
            poster: {
              firstName: j.employer?.firstName || "",
              lastName:  j.employer?.lastName  || "",
              isPrivate: !j.employer?.firstName,
            },
            employerId: j.employer?.id || j.employerId || "",
          }))
        );
      } catch (e) {
        console.error("Failed to fetch jobs:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleExpress = async (jobId: string) => {
    if (appliedJobIds.has(jobId) || isApplying) return;
    setIsApplying(jobId);
    try {
      await jobsService.applyToJob(jobId, { message: "I am interested in this job." });
      setAppliedJobIds(prev => new Set([...prev, jobId]));
      toast.success("Interest sent! The employer will be notified.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send interest.");
    } finally {
      setIsApplying(null);
    }
  };

  const toggleSave = (jobId: string) => {
    setSavedJobIds(prev => {
      const next = new Set(prev);
      next.has(jobId) ? next.delete(jobId) : next.add(jobId);
      return next;
    });
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
        Employers haven&apos;t posted any jobs yet. Check back soon.
      </p>
    </div>
  );

  return (
    <div className="space-y-3 pb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mt-1">
        <h2 className="text-[16px] font-bold text-[#1B2431]">Jobs Near You</h2>
        <button onClick={() => router.push("/jobs")} className="text-[12px] font-semibold text-[#145B10]">
          See all
        </button>
      </div>

      {jobs.map(job => {
        const urgency  = getUrgency(job.id);
        const { label, bg, text, Icon: UrgIcon } = URGENCY_CONFIG[urgency];
        const budget   = formatBudget(job.budgetMin, job.budgetMax);
        const workTags = getWorkTags(job.id);
        const dist     = getDistance(job.id);
        const applied    = appliedJobIds.has(job.id);
        const isOwnJob   = !!(user?.id && job.employerId === user.id);
        const saved      = savedJobIds.has(job.id);
        const poster   = job.poster.isPrivate
          ? "Private Employer"
          : `${job.poster.firstName} ${job.poster.lastName}`.trim() || "Private Employer";

        return (
          <div
            key={job.id}
            onClick={() => router.push(`/jobs/${job.id}`)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 space-y-2 cursor-pointer hover:border-[#145B10]/30 hover:shadow-md transition-all group"
          >

            {/* ── Row 1: icon | title + badges ── */}
            <div className="flex items-start gap-3">
              {/* Circle icon */}
              <div className="w-[44px] h-[44px] rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                <img src={getCategoryIcon(job.category)} alt={job.category} width={22} height={22} />
              </div>

              {/* Badges + title */}
              <div className="flex-1 min-w-0">
                {/* Pills row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-[#145B10] bg-[#E8F5E9] rounded-full px-2 py-0.5 whitespace-nowrap">
                    {job.category}
                  </span>
                  <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${bg} ${text}`}>
                    <UrgIcon className="w-2.5 h-2.5" />
                    {label}
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{timeAgo(job.createdAt)}</span>
                </div>
                {/* Title */}
                <h3 className="text-[14px] font-bold text-[#1B2431] leading-snug mt-1">
                  {job.title}
                </h3>
              </div>
            </div>

            {/* ── Location ── */}
            <div className="flex items-center gap-1 text-[11px] text-[#616161]">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span>{job.location}, Kigali &nbsp;•&nbsp; {dist}</span>
            </div>

            {/* ── Budget + work tags ── */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {budget && (
                <span className="flex items-center gap-1 text-[12px] font-bold text-[#1B2431]">
                  <span>💰</span>
                  {budget}
                </span>
              )}
              {workTags.map(tag => (
                <span key={tag} className="text-[10px] font-medium text-[#616161] bg-gray-100 rounded-full px-2.5 py-0.5 border border-gray-200">
                  {tag}
                </span>
              ))}
            </div>

            {/* ── Description ── */}
            <p className="text-[11px] text-[#616161] leading-relaxed line-clamp-2">
              {job.description}
            </p>

            {/* ── Footer: poster + CTA ── */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-gray-400">Posted by {poster}</span>

              {isOwnJob ? (
                <span className="text-[11px] font-semibold text-gray-400 italic">Your posting</span>
              ) : applied ? (
                <div className="flex flex-col items-end">
                  <span className="text-[12px] font-bold text-[#145B10]">✓ Interest Sent</span>
                  <span className="text-[10px] text-gray-400 leading-tight">Waiting for employer response</span>
                </div>
              ) : (
                <button
                  onClick={() => requireAuth(() => handleExpress(job.id), "apply", `/jobs/${job.id}`)}
                  disabled={!!isApplying}
                  className="flex items-center justify-center gap-1.5 min-w-[128px] py-2 rounded-full text-[12px] font-bold bg-[#145B10] text-white hover:bg-[#0f4a0c] shadow-sm transition-all active:scale-95"
                >
                  {isApplying === job.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Express Interest"
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default JobPostingsFeed;
