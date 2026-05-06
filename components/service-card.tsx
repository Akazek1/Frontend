"use client";
import { Star, MapPin, Languages, BadgeCheck } from "lucide-react";
import Image from "next/image";
import { useBookmark } from "@/context/bookmark-context";

interface ServiceCardProps {
  id: string;
  image: string;
  name: string;
  title: string;
  experience: string;
  languages: string;
  location: string;
  price: string;
  rating: number;
  reviews: number;
  distance: string;
  available: boolean;
  verified?: boolean;
  tags?: string[];
  onClick: () => void;
  onRemoveBookmark?: () => void;
  isBookmarked?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  image,
  name,
  title,
  languages,
  location,
  price,
  rating,
  reviews,
  available,
  verified,
  tags = [],
  onClick,
  onRemoveBookmark,
  isBookmarked: isBookmarkedProp,
}) => {
  const { isBookmarked: isBookmarkedContext, toggleBookmark, isLoading } = useBookmark("services");
  const isServiceBookmarked = isBookmarkedProp !== undefined ? isBookmarkedProp : isBookmarkedContext(id);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    if (isLoading) return;
    e.stopPropagation();
    if (isServiceBookmarked && onRemoveBookmark) {
      await onRemoveBookmark();
    } else {
      await toggleBookmark(id);
    }
  };

  const handleHireClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-100 shadow-sm hover:shadow-md rounded-2xl overflow-hidden flex cursor-pointer transition-shadow duration-200"
    >
      {/* Left image */}
      <div className="relative flex-shrink-0 w-[120px] self-stretch">
        <Image
          src={image || "/default-service.svg"}
          alt={name || "Provider"}
          fill
          sizes="120px"
          loading="lazy"
          unoptimized={image.endsWith(".svg") || image === "/default-service.svg"}
          onError={(e) => { (e.target as HTMLImageElement).src = "/default-service.svg"; }}
          className="object-cover object-top"
        />
        {/* Available badge */}
        <span
          className={`absolute bottom-0 left-0 right-0 text-[10px] font-semibold py-1 text-center ${
            available ? "bg-[#145B10]/85 text-white" : "bg-red-600/85 text-white"
          }`}
        >
          {available ? "Available Today" : "Unavailable"}
        </span>
      </div>

      {/* Right content */}
      <div className="flex flex-col flex-1 px-3 py-3 gap-1.5 min-w-0">

        {/* Row 1: name + bookmark */}
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[13px] font-bold text-[#1B2431] truncate">
              {name || "Unknown Provider"}
            </span>
            {verified && (
              <BadgeCheck className="w-4 h-4 fill-blue-500 stroke-white flex-shrink-0" />
            )}
          </div>
          <button
            onClick={handleBookmarkClick}
            disabled={isLoading}
            className="flex-shrink-0 p-0.5 disabled:opacity-50"
          >
            <svg
              width="20" height="20" viewBox="0 0 24 24"
              fill={isServiceBookmarked ? "#145B10" : "none"}
              stroke="#145B10"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path fillRule="evenodd" clipRule="evenodd" d="M19.7388 6.15344C19.7388 3.40256 17.8581 2.2998 15.1503 2.2998H8.79143C6.16687 2.2998 4.19995 3.32737 4.19995 5.96998V20.6938C4.19995 21.4196 4.9809 21.8767 5.61348 21.5219L11.9954 17.9419L18.3223 21.5158C18.9558 21.8727 19.7388 21.4156 19.7388 20.6888V6.15344Z" />
            </svg>
          </button>
        </div>

        {/* Row 2: service title */}
        <span className="text-[12px] text-[#616161] capitalize leading-tight">
          {title || "Service"}
        </span>

        {/* Row 3: rating + location */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#616161] flex-wrap">
          <div className="flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-yellow-400 stroke-yellow-400 flex-shrink-0" />
            <span className="font-semibold text-[#1B2431]">{rating > 0 ? rating.toFixed(1) : "New"}</span>
            {reviews > 0 && <span>({reviews} reviews)</span>}
          </div>
          {location && (
            <>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[90px]">{location}</span>
              </div>
            </>
          )}
        </div>

        {/* Row 4: languages */}
        {languages && (
          <div className="flex items-center gap-1 text-[11px] text-[#616161]">
            <Languages className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Speaks: {languages}</span>
          </div>
        )}

        {/* Row 5: price */}
        <p className="text-[#145B10] font-bold text-[13px]">{price || "—"}</p>

        {/* Row 6: tags (only if provided) */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-[#616161] bg-gray-100 rounded-full px-2 py-0.5 whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Row 7: Request to Hire */}
        <div className="flex justify-end mt-1">
          <button
            onClick={handleHireClick}
            className="bg-[#145B10] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#0f4a0c] transition-colors duration-200 whitespace-nowrap"
          >
            Request to Hire
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
