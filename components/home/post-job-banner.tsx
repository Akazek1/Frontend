"use client";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

const PostJobBanner: React.FC = () => (
  <Link href="/post-job">
    <div className="flex items-center gap-3 bg-white border border-[#145B10]/20 rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer">
      <div className="w-10 h-10 rounded-xl bg-[#145B10]/10 flex items-center justify-center flex-shrink-0">
        <PlusCircle className="w-5 h-5 text-[#145B10]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#1B2431]">Post a Custom Job</p>
        <p className="text-[11px] text-[#616161] leading-tight mt-0.5">
          Can&apos;t find what you need? Describe your job and let providers come to you.
        </p>
      </div>
      <span className="text-[11px] font-semibold text-[#145B10] whitespace-nowrap flex-shrink-0">
        Post →
      </span>
    </div>
  </Link>
);

export default PostJobBanner;
