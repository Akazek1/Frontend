"use client";

import {
  ArrowLeft,
  Upload,
  Pencil,
  MapPin,
  MessageSquare,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { useShareLink } from "@/hooks/useShareLink";
import { useLightbox } from "@/hooks/useLightbox";

export interface UserProfileHeaderProps {
  name: string;
  handle: string;
  profilePicture?: string;
  isVerified?: boolean;
  governmentIdStatus?: string;
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
  const shareLink = useShareLink();
  const { lightbox, open: openLightbox, close: closeLightbox, prev: lightboxPrev, next: lightboxNext, select: selectLightboxIndex } = useLightbox();
  // Single source of truth: the admin-approved `isVerified` flag.
  const verified = !!isVerified;
  const location = locationProp || [district, sector, cell, city, country].filter(Boolean).join(", ");
  const memberSinceLabel = formatMonth(memberSince);

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
            onClick={() => shareLink(window.location.href, name)}
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
        <button
          type="button"
          onClick={() => profilePicture && openLightbox([profilePicture], 0)}
          aria-label={`View ${name}'s photo`}
          disabled={!profilePicture}
          className="relative w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex-shrink-0"
        >
          <Avatar className="h-28 w-28">
            <AvatarImage src={profilePicture} alt={name} className="object-cover" />
            <AvatarFallback className="bg-gray-100 text-2xl font-bold text-ink">
              {name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </button>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-bold text-ink truncate">{name}</h1>
            {verified ? <VerifiedBadge size={20} /> : null}
          </div>
          <p className="text-sm text-gray-500 mb-2">{handle.startsWith("@") ? handle : `@${handle}`}</p>
        </div>
      </div>

      <ImageLightbox
        lightbox={lightbox}
        onClose={closeLightbox}
        onPrev={lightboxPrev}
        onNext={lightboxNext}
        onSelect={selectLightboxIndex}
      />

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
