"use client";
import { Flag, Smile } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { VerifiedBadge } from "@/components/ui/verified-badge";

interface ProfileHeaderProps {
  name: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  isVerified?: boolean;
  createdAt?: string;
  wouldHireAgain?: number;
  rating?: number;
  reviewCount?: number;
  trustScore?: number;
  onReportClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  gender,
  dateOfBirth,
  profilePicture,
  isVerified,
  createdAt,
  wouldHireAgain = 0,
  reviewCount = 0,
  trustScore = 0,
  onReportClick,
}) => {
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const calculateAge = (dob: string | undefined) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  const age = calculateAge(dateOfBirth);
  const memberSince = formatDate(createdAt);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        {/* Large Avatar */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowPhotoModal(true)}
            className="relative w-32 h-32 rounded-2xl overflow-hidden hover:opacity-80 transition-opacity"
          >
            <Image
              src={profilePicture || "/default-profile.svg"}
              alt={name}
              fill
              className="object-cover object-top"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/default-profile.svg";
              }}
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-sm font-semibold">View</span>
            </div>
          </button>
        </div>

        {/* Identity Info */}
        <div className="flex-1 min-w-0">
          {/* Name + Verification */}
          <div className="flex items-start gap-2 mb-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            {isVerified && <VerifiedBadge size={24} className="mt-1" />}
          </div>

          {/* Demographics */}
          <div className="space-y-1 mb-3 text-sm text-gray-600">
            {(gender || age) && (
              <p>
                {gender && <span className="font-medium capitalize">{gender}</span>}
                {gender && age && <span className="mx-2">•</span>}
                {age && <span>Age {age}</span>}
              </p>
            )}
            {memberSince && (
              <p>
                <span className="text-gray-500">Member since</span>{" "}
                <span className="font-medium text-gray-700">{memberSince}</span>
              </p>
            )}
          </div>

          {/* Trust signals */}
          <div className="flex items-center gap-4 flex-wrap">
            {wouldHireAgain > 0 && (
              <div className="flex items-center gap-1">
                <Smile className="h-4 w-4 text-brand" />
                <span className="font-semibold text-gray-900">{wouldHireAgain}</span>
                <span className="text-sm text-gray-500">would hire again</span>
              </div>
            )}
            {reviewCount > 0 && (
              <div className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium text-gray-700">
                {reviewCount} reviews
              </div>
            )}
            {trustScore > 0 && trustScore <= 5 && (
              <div className="px-3 py-1 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-700">
                Trust: {trustScore.toFixed(1)}/5
              </div>
            )}
          </div>

          {/* Report Button */}
          {onReportClick && (
            <button
              onClick={onReportClick}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
            >
              <Flag className="w-4 h-4" />
              Report
            </button>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div className="relative flex h-[85vh] w-full max-w-2xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute -top-10 right-0 text-white text-2xl font-bold"
            >
              ✕
            </button>
            <Image
              src={profilePicture || "/default-profile.svg"}
              alt={name}
              width={600}
              height={600}
              className="max-h-full w-auto max-w-full rounded-2xl object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/default-profile.svg";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
