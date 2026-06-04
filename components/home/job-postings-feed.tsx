"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Loader2, Briefcase } from "lucide-react";
import toast from "react-hot-toast";
import jobsService from "@/services/jobs-service";
import type { RootState } from "@/store";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { JobPostCard } from "@/components/job-post-card";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/error-handler";

interface ApiJobPost {
  id: string;
  title: string;
  description: string;
  budgetMin: number | null;
  budgetMax: number | null;
  createdAt: string;
  employerId?: string;
  category?: { name?: string };
  address?: { city?: string };
  employer?: {
    id?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface ApplicationSummary {
  jobId: string;
}

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

const JobPostingsFeed: React.FC = () => {
  const [jobs, setJobs]                     = useState<JobPost[]>([]);
  const [loading, setLoading]               = useState(true);
  const [appliedJobIds, setAppliedJobIds]   = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying]         = useState<string | null>(null);
  const user         = useSelector((state: RootState) => state.auth.user);
  const router       = useRouter();
  const { requireAuth } = useRequireAuth();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res  = await api.get<{ data?: ApiJobPost[] } | ApiJobPost[]>("/jobs");
        const responseData = res.data;
        const data = Array.isArray(responseData) ? responseData : responseData.data;

        if (user) {
          try {
            const myApps = await jobsService.getMyApplications();
            if (Array.isArray(myApps))
              setAppliedJobIds(new Set((myApps as ApplicationSummary[]).map((a) => a.jobId)));
          } catch (e) {
            const status = getApiErrorStatus(e)
            if (status !== 401 && status !== 403) console.error(e);
          }
        }

        setJobs(
          (Array.isArray(data) ? data : []).map((j) => ({
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
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send interest."));
    } finally {
      setIsApplying(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-10">
      <Loader2 className="w-5 h-5 animate-spin text-brand" />
    </div>
  );

  if (jobs.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center">
        <Briefcase className="w-7 h-7 text-brand" />
      </div>
      <p className="text-[14px] font-bold text-ink">No job postings yet</p>
      <p className="text-[12px] text-[#616161] text-center px-8 leading-relaxed">
        Employers haven&apos;t posted any jobs yet. Check back soon.
      </p>
    </div>
  );

  return (
    <div className="space-y-3 pb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mt-1">
        <h2 className="text-[16px] font-bold text-ink">Jobs Near You</h2>
        <button onClick={() => router.push("/work")} className="text-[12px] font-semibold text-brand">
          See all
        </button>
      </div>

      {jobs.map(job => {
        const applied    = appliedJobIds.has(job.id);
        const poster   = job.poster.isPrivate
          ? "Private Employer"
          : `${job.poster.firstName} ${job.poster.lastName}`.trim() || "Private Employer";

        return (
          <JobPostCard
            key={job.id}
            job={{
              ...job,
              posterName: poster,
              posterIsPrivate: job.poster.isPrivate,
            }}
            currentUserId={user?.id}
            applied={applied}
            isApplying={isApplying === job.id}
            onClick={() => router.push(`/jobs/${job.id}`)}
            onExpress={() => requireAuth(() => handleExpress(job.id), "apply", `/jobs/${job.id}`)}
          />
        );
      })}
    </div>
  );
};

export default JobPostingsFeed;
