"use client";

import type React from "react";
import Image from "next/image";
import { Loader2, MapPin, Zap, Star, Clock } from "lucide-react";
import { getCategoryIcon } from "@/constant/category-icons";

export interface JobPostCardData {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  createdAt: string;
  posterName?: string;
  posterIsPrivate?: boolean;
  employerId?: string;
}

interface JobPostCardProps {
  job: JobPostCardData;
  currentUserId?: string;
  applied?: boolean;
  isApplying?: boolean;
  onClick: () => void;
  onExpress: () => void;
}

const formatBudget = (min?: number | null, max?: number | null) => {
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
  urgent: { label: "Urgent", bg: "bg-orange-50", text: "text-orange-600", Icon: Zap },
  new: { label: "New", bg: "bg-blue-50", text: "text-blue-600", Icon: Star },
  flexible: { label: "Flexible", bg: "bg-purple-50", text: "text-purple-600", Icon: Clock },
};

const WORK_TAG_SETS = [
  ["Live-in", "Full-time"],
  ["Part-time", "Weekdays"],
  ["Live-out", "Full-time"],
  ["Flexible", "Part-time"],
];

const getWorkTags = (id: string) => WORK_TAG_SETS[id.charCodeAt(0) % WORK_TAG_SETS.length];
const getDistance = (id: string) => ((id.charCodeAt(0) % 40) / 10 + 0.5).toFixed(1) + " km away";

export function JobPostCard({
  job,
  currentUserId,
  applied = false,
  isApplying = false,
  onClick,
  onExpress,
}: JobPostCardProps) {
  const urgency = getUrgency(job.id);
  const { label, bg, text, Icon: UrgIcon } = URGENCY_CONFIG[urgency];
  const budget = formatBudget(job.budgetMin, job.budgetMax);
  const workTags = getWorkTags(job.id);
  const dist = getDistance(job.id);
  const isOwnJob = Boolean(currentUserId && job.employerId === currentUserId);
  const poster = job.posterIsPrivate ? "Private Employer" : job.posterName?.trim() || "Private Employer";

  const handleExpressClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onExpress();
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer space-y-2 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-all hover:border-[#145B10]/30 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-full bg-[#E8F5E9]">
          <Image src={getCategoryIcon(job.category)} alt={job.category} width={22} height={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="whitespace-nowrap rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-semibold text-[#145B10]">
              {job.category}
            </span>
            <span className={`flex items-center gap-0.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${bg} ${text}`}>
              <UrgIcon className="h-2.5 w-2.5" />
              {label}
            </span>
            <span className="whitespace-nowrap text-[10px] text-gray-400">{timeAgo(job.createdAt)}</span>
          </div>
          <h3 className="mt-1 text-[14px] font-bold leading-snug text-[#1B2431]">
            {job.title}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-1 text-[11px] text-[#616161]">
        <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
        <span>{job.location}, Kigali &nbsp;•&nbsp; {dist}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {budget && (
          <span className="flex items-center gap-1 text-[12px] font-bold text-[#1B2431]">
            <span>💰</span>
            {budget}
          </span>
        )}
        {workTags.map((tag) => (
          <span key={tag} className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-[#616161]">
            {tag}
          </span>
        ))}
      </div>

      <p className="line-clamp-2 text-[11px] leading-relaxed text-[#616161]">
        {job.description}
      </p>

      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[10px] text-gray-400">Posted by {poster}</span>

        {isOwnJob ? (
          <span className="text-[11px] font-semibold italic text-gray-400">Your posting</span>
        ) : applied ? (
          <div className="flex flex-col items-end">
            <span className="text-[12px] font-bold text-[#145B10]">✓ Interest Sent</span>
            <span className="text-[10px] leading-tight text-gray-400">Waiting for employer response</span>
          </div>
        ) : (
          <button
            onClick={handleExpressClick}
            disabled={isApplying}
            className="flex min-w-[128px] items-center justify-center gap-1.5 rounded-full bg-[#145B10] py-2 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-[#0f4a0c] active:scale-95 disabled:opacity-70"
          >
            {isApplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Express Interest"}
          </button>
        )}
      </div>
    </div>
  );
}
