"use client";

import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

interface PageProp {
  text: string;
  className?: string | undefined;
  backHref?: string; // Optional: explicit back URL. If not provided, uses browser history (router.back())
  fallbackHref?: string; // Where to go if no browser history (defaults to /more)
}

const BackButtonHeader: React.FC<PageProp> = ({
  text,
  className,
  backHref,
  fallbackHref = "/more",
}) => {
  const router = useRouter();

  const handleBackClick = (e: React.MouseEvent) => {
    if (!backHref) {
      e.preventDefault();
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push(fallbackHref);
      }
    }
  };

  return (
    <div className={cn(`${className} flex items-center gap-4 rounded-lg`)}>
      {backHref ? (
        <Link href={backHref} className="">
          <ArrowLeft className="w-6 h-6 text-[#1B2431]" />
        </Link>
      ) : (
        <button onClick={handleBackClick} className="cursor-pointer" aria-label="Go back">
          <ArrowLeft className="w-6 h-6 text-[#1B2431]" />
        </button>
      )}
      <h1 className="text-2xl leading-7 font-bold text-[#1B2431] capitalize">{text}</h1>
    </div>
  );
};

export default BackButtonHeader;
