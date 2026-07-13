"use client";
import { Briefcase, Smile, MapPin, MessageCircle, ShieldCheck, Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useBookmark } from "@/context/bookmark-context";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { redactName } from "@/lib/privacy-utils";
import { serviceImageFallback, shouldUnoptimizeImage } from "@/lib/service-display";
import { VerifiedBadge } from "@/components/ui/verified-badge";

interface AgencyInfo {
  id: string;
  name: string;
  logoUrl: string | null;
  verified: boolean;
}

interface ServiceCardProps {
  id: string;
  image: string;
  profileImage?: string;
  name: string;
  handle?: string;
  title: string;
  experience: string;
  languages: string;
  location: string;
  price: string;
  rating?: number;
  reviews?: number;
  jobsCompleted?: number;
  wouldHireAgain?: number;
  distance?: string;
  available: boolean;
  verified?: boolean;
  tags?: string[];
  agency?: AgencyInfo | null;
  onClick: () => void;
  onHireClick?: () => void;
  onRemoveBookmark?: () => void;
  isBookmarked?: boolean;
  hasRequested?: boolean;
  isOwnService?: boolean;
  /** You have a completed-but-unreviewed job with this provider — the card
   *  leads with "Leave a review" until you've reviewed that last job. */
  needsReview?: boolean;
  onLeaveReview?: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  image,
  profileImage,
  name,
  handle,
  title,
  languages,
  location,
  price,
  jobsCompleted = 0,
  wouldHireAgain = 0,
  distance,
  available,
  verified,
  tags = [],
  agency,
  onClick,
  onHireClick,
  onRemoveBookmark,
  isBookmarked: isBookmarkedProp,
  hasRequested = false,
  isOwnService = false,
  needsReview = false,
  onLeaveReview,
}) => {
  const t = useTranslations("serviceCard");
  const tShared = useTranslations("serviceDetailShared");
  const router = useRouter();
  const { isBookmarked: isBookmarkedContext, toggleBookmark, isLoading } = useBookmark("services");
  const isServiceBookmarked = isBookmarkedProp !== undefined ? isBookmarkedProp : isBookmarkedContext(id);
  const { requireAuth, isAuthenticated } = useRequireAuth();

  const isGuest = !isAuthenticated;
  const displayProviderName = isGuest ? redactName(name) : name;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    if (isLoading) return;
    e.stopPropagation();
    // The owner viewing their own card can't bookmark themselves — no-op.
    if (isOwnService) return;
    requireAuth(async () => {
      if (isServiceBookmarked && onRemoveBookmark) {
        await onRemoveBookmark();
      } else {
        await toggleBookmark(id);
      }
    }, "bookmark");
  };

  const handleHireClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasRequested || isOwnService) return;
    
    requireAuth(() => {
      (onHireClick || onClick)();
    }, "hire");
  };

  const thumbnailSrc = image || profileImage || "";
  const thumbnailAlt = image ? title : name || t("service");

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-100 shadow-sm hover:shadow-md rounded-2xl overflow-hidden flex cursor-pointer transition-shadow duration-200"
    >
      {/* Left image */}
      <div className="relative flex-shrink-0 w-[110px] self-stretch">
        {thumbnailSrc ? (
          <Image
            src={thumbnailSrc}
            alt={thumbnailAlt}
            fill
            sizes="110px"
            loading="lazy"
            unoptimized={shouldUnoptimizeImage(thumbnailSrc)}
            onError={(e) => { (e.target as HTMLImageElement).src = serviceImageFallback; }}
            className="object-cover object-top"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100" />
        )}
        <span
          className={`absolute bottom-0 left-0 right-0 text-[10px] font-semibold py-1 text-center ${
            available ? "bg-brand/85 text-white" : "bg-red-600/85 text-white"
          }`}
        >
          {available ? t("availableToday") : t("unavailable")}
        </span>
      </div>

      {/* Right content */}
      <div className="flex flex-col flex-1 px-3 py-3 gap-1 min-w-0">

        {/* Row 1: name + verified | bookmark */}
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[13px] font-bold text-ink truncate">
              {displayProviderName || t("unknownProvider")}
            </span>
            {verified && <VerifiedBadge size={16} />}
          </div>
          <button
            onClick={handleBookmarkClick}
            disabled={isLoading || isOwnService}
            aria-label={
              isOwnService
                ? t("bookmarkUnavailableOwn")
                : isServiceBookmarked
                ? t("removeBookmark")
                : t("bookmarkThisService")
            }
            className="flex-shrink-0 p-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24"
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

        {/* Row 2: handle — subtle, tight to name */}
        {handle && (
          <span className="text-[11px] text-[#9E9E9E] font-normal -mt-1 leading-none">
            {handle}
          </span>
        )}

        {/* Row 3: service title */}
        <span className="text-[12px] text-ink-muted capitalize leading-tight">
          {title || t("service")}
        </span>

        {/* Row 4: trust metrics — jobs done | would rehire */}
        {jobsCompleted > 0 ? (
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-brand flex-shrink-0" />
              <span className="font-bold text-ink">{jobsCompleted}</span>
              <span className="text-ink-muted">
                {t("jobsDoneCount", { count: jobsCompleted })}
              </span>
            </span>
            {wouldHireAgain > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1">
                  <Smile className="w-3 h-3 text-brand flex-shrink-0" />
                  <span className="font-bold text-ink">{wouldHireAgain}</span>
                  <span className="text-ink-muted">{t("wouldRehire")}</span>
                </span>
              </>
            )}
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-brand">{t("new")}</span>
        )}

        {/* Row 5: 📍 location · distance (distance hidden when unknown) */}
        <div className="flex items-center gap-1 text-[11px] text-ink-muted">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate max-w-[140px]">{location || t("rwanda")}</span>
          {distance && (
            <>
              <span className="text-gray-300">·</span>
              <span>{distance}</span>
            </>
          )}
        </div>

        {/* Row 6: 💬 Speaks */}
        {languages && (
          <div className="flex items-center gap-1 text-[11px] text-ink-muted">
            <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{t("speaksWith", { languages })}</span>
          </div>
        )}

        {/* Agency backing badge — only shown for agency-backed workers */}
        {agency && (
          <div className="mt-0.5 rounded-lg bg-[#EEF8EA] border border-[#C8E6C4] px-2 py-1.5 flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-brand flex-shrink-0" />
              <span className="text-[10px] font-bold text-brand truncate">
                {t("backedByName", { name: agency.name })}
              </span>
              {agency.verified && <VerifiedBadge size={12} />}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[t("badgeIdVerified"), t("badgePoliceChecked"), t("badgeReplacementGuaranteed")].map((badge) => (
                <span key={badge} className="flex items-center gap-0.5 text-[9px] font-medium text-brand/80">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Row 5: price */}
        <p className="text-brand font-bold text-[13px]">{price || "—"}</p>

        {/* Row 6: tags (left) + Request to Hire (right) on same row */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex flex-wrap gap-1 min-w-0">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-ink-muted bg-gray-100 rounded-full px-2 py-0.5 whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
          </div>
          {!isOwnService && agency ? (
            // Agency-backed workers aren't hired directly — the employer
            // contacts the agency. Open the profile's Contact-Agency inquiry
            // modal directly via the `contact=agency` flag (same experience as
            // tapping "Contact Agency" on the worker's profile).
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (handle) {
                  router.push(`/${handle.replace(/^@/, "")}/services/${id}?contact=agency`);
                } else {
                  onClick();
                }
              }}
              className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors duration-200 whitespace-nowrap bg-brand text-white hover:bg-[#0f4a0c]"
            >
              {t("contactAgency")}
            </button>
          ) : !isOwnService && needsReview ? (
            // You have a completed job with this provider you haven't reviewed —
            // leave that review before hiring again (review-first flow).
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLeaveReview?.();
              }}
              className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors duration-200 whitespace-nowrap bg-[#C2630B] text-white hover:bg-[#a4530a]"
            >
              <Star className="w-3.5 h-3.5 fill-white stroke-white" />
              {t("leaveAReview")}
            </button>
          ) : (
            <button
              onClick={handleHireClick}
              disabled={hasRequested || isOwnService}
              className={`flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors duration-200 whitespace-nowrap ${
                isOwnService
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : hasRequested
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-brand text-white hover:bg-[#0f4a0c]"
              }`}
            >
              {isOwnService
                ? t("yourService")
                : hasRequested
                ? tShared("requestSent")
                : tShared("requestToHire")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
