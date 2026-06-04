"use client";

import React, { useState } from "react";
import { Job } from "@/services/jobs-service";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  ChevronRight, 
  Loader2,
  Timer
} from "lucide-react";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useAuthGate } from "@/context/auth-gate-context";
import { redactName, redactSensitiveText } from "@/lib/privacy-utils";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import jobsService from "@/services/jobs-service";
import { getApiErrorMessage } from "@/lib/error-handler";

interface JobCardProps {
  job: Job;
  isOwner?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, isOwner }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthGate } = useAuthGate();
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const isGuest = !user;
  const employerDisplayName = isGuest 
    ? redactName(job.employer.firstName, job.employer.lastName)
    : `${job.employer.firstName} ${job.employer.lastName}`;
  
  const displayDescription = isGuest
    ? redactSensitiveText(job.description)
    : job.description;

  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthGate("apply", `/jobs/${job.id}`);
      return;
    }

    setApplying(true);
    try {
      await jobsService.applyToJob(job.id, { message: "I am interested in this job." });
      toast.success("Application sent successfully!");
      setHasApplied(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to apply."));
    } finally {
      setApplying(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/jobs/${job.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_25px_-5px_rgba(20,91,16,0.1)] transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Visual Accent */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-surface text-brand text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
              {job.category.name}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
              <Timer className="w-3 h-3" />
              {formatDistanceToNow(new Date(job.createdAt))} ago
            </div>
          </div>
          <h3 className="text-[17px] font-extrabold text-ink leading-tight group-hover:text-brand transition-colors">{job.title}</h3>
        </div>
        
        <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-gray-100">
            <AvatarImage src={job.employer.profilePicture} className="object-cover" />
            <AvatarFallback className="bg-brand/5 text-[14px] font-bold text-brand">
              {job.employer.firstName[0]}{job.employer.lastName[0]}
            </AvatarFallback>
          </Avatar>
          {job.employer.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="bg-gray-50/50 rounded-2xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
            <DollarSign className="w-3 h-3 text-brand" />
            Budget
          </div>
          <span className="text-[13px] font-black text-ink">
            {job.budgetMin ? `${job.budgetMin.toLocaleString()} - ${job.budgetMax?.toLocaleString()} RWF` : "Negotiable"}
          </span>
        </div>
        <div className="bg-gray-50/50 rounded-2xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
            <MapPin className="w-3 h-3 text-brand" />
            Location
          </div>
          <span className="text-[13px] font-bold text-ink truncate">{job.address?.city || "Kigali"}</span>
        </div>
      </div>

      <p className="mt-4 text-[13px] text-ink-muted line-clamp-2 leading-relaxed font-medium">
        {displayDescription}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-bold text-ink">
            {employerDisplayName}
          </div>
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          <div className="text-[11px] text-gray-400 font-medium">Employer</div>
        </div>

        {isOwner ? (
          <Button variant="ghost" size="sm" className="h-9 rounded-xl text-[12px] font-bold text-brand hover:bg-surface group/btn">
            Manage ({job._count?.applications || 0}) 
            <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
          </Button>
        ) : (
          <Button 
            onClick={handleApply}
            disabled={applying || hasApplied || job.status !== "OPEN"}
            size="sm" 
            className={`h-9 px-5 rounded-xl text-[12px] font-bold shadow-sm transition-all ${
                hasApplied 
                  ? "bg-gray-100 text-gray-400" 
                  : "bg-brand text-white hover:bg-brand-dark hover:shadow-lg active:scale-95"
            }`}
          >
            {applying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {hasApplied ? "Applied" : "Apply Now"}
          </Button>
        )}
      </div>
    </div>
  );
};
