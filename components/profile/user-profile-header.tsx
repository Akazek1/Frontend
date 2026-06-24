"use client";

import {
  ArrowLeft,
  Upload,
  Pencil,
  MapPin,
  MessageSquare,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { VerifiedBadge } from "@/components/ui/verified-badge";

export interface UserProfileHeaderProps {
  name: string;
  handle: string;
  profilePicture?: string;
  isVerified?: boolean;
  governmentIdStatus?: string;
  availableToday?: boolean;
  location?: string;
  city?: string;
  district?: string;
  sector?: string;
  cell?: string;
  country?: string;
  languages?: string[];
  memberSince?: string;
  isOwner?: boolean;
}

const formatMonth = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export function UserProfileHeader({
  name,
  handle,
  profilePicture,
  isVerified,
  availableToday,
  location: locationProp,
  city,
  district,
  sector,
  cell,
  country,
  languages = [],
  memberSince,
  isOwner = false,
}: UserProfileHeaderProps) {
  const router = useRouter();
  // Single source of truth: the admin-approved `isVerified` flag.
  const verified = !!isVerified;
  const location = locationProp || [district, sector, cell, city, country].filter(Boolean).join(", ");
  const memberSinceLabel = formatMonth(memberSince);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <section className="px-4 pt-4 pb-2">
      {/* Top bar: back, share, and either Edit (owner) or nothing (visitor) */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
          className="p-1 -ml-1"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Share profile"
          >
            <Upload className="w-5 h-5 text-ink" />
          </button>
          {isOwner && (
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand text-brand text-[13px] font-semibold hover:bg-surface transition-colors"
              aria-label="Edit profile"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Identity row */}
      <div className="flex items-start gap-5">
        <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          <Image
            src={profilePicture || "/default-profile.svg"}
            alt={name}
            fill
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/default-profile.svg";
            }}
          />
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-bold text-ink truncate">{name}</h1>
            {verified ? <VerifiedBadge size={20} /> : null}
          </div>
          <p className="text-sm text-gray-500 mb-2">{handle.startsWith("@") ? handle : `@${handle}`}</p>

          {availableToday !== undefined ? (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-semibold text-white ${availableToday ? "bg-brand/85" : "bg-red-600/85"}`}>
              {availableToday ? "Available Today" : "Unavailable"}
            </span>
          ) : null}
        </div>
      </div>

      {/* Meta rows */}
      <div className="mt-4 space-y-2.5 text-sm text-ink">
        {location ? (
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span>{location}</span>
          </div>
        ) : null}
        {languages.length > 0 ? (
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span>Speaks: {languages.join(", ")}</span>
          </div>
        ) : null}
        {memberSinceLabel ? (
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span>Member since {memberSinceLabel}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
